import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

// Helper to execute an MCP tool on the remote Kapruka server
async function callMcpTool(toolName: string, toolArgs: any): Promise<any> {
  // Use absolute path for proxy.js to prevent CWD mismatches in Next.js Serverless environments
  const proxyPath = path.resolve(process.cwd(), "node_modules/mcp-remote/dist/proxy.js");

  const transport = new StdioClientTransport({
    command: "node",
    args: [proxyPath, "https://mcp.kapruka.com/mcp"],
  });

  const client = new Client(
    {
      name: "kapruka-shopping-agent",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    const response = await client.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    // Clean up connection
    await client.close();

    return response;
  } catch (error) {
    try {
      await client.close();
    } catch (_) {}
    console.error(`MCP Tool execution error [${toolName}]:`, error);
    throw error;
  }
}

/**
 * Interface representing a Kapruka product
 */
export interface Product {
  id: string;
  name: string;
  summary: string;
  price: {
    amount: number | null;
    currency: string;
  };
  compare_at_price: {
    amount: number;
    currency: string;
  } | null;
  in_stock: boolean;
  stock_level: string;
  image_url: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  url: string;
}

/**
 * Searches Kapruka catalog for products
 */
export async function searchProducts(query: string, category?: string | null): Promise<Product[]> {
  try {
    const response = await callMcpTool("kapruka_search_products", {
      params: {
        q: query,
        category: category || null,
        limit: 10,
        response_format: "json",
      },
    });

    const content = response.content?.[0];
    if (content?.type === "text") {
      const data = JSON.parse(content.text);
      return data.results || [];
    }
    return [];
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

/**
 * Fetches product category list
 */
export async function browseCategories() {
  try {
    const response = await callMcpTool("kapruka_list_categories", {
      params: {
        depth: 1,
        response_format: "json",
      },
    });

    const content = response.content?.[0];
    if (content?.type === "text") {
      const data = JSON.parse(content.text);
      return data.categories || [];
    }
    return [];
  } catch (error) {
    console.error("Error browsing categories:", error);
    return [];
  }
}

/**
 * Gets a delivery quote for a specific city and date
 */
export async function getDeliveryQuote(cityInput: string, deliveryDate?: string | null) {
  try {
    // 1. Resolve to a canonical delivery city name
    console.log(`Resolving canonical city for input: "${cityInput}"`);
    const citiesResponse = await callMcpTool("kapruka_list_delivery_cities", {
      params: {
        query: cityInput,
        limit: 5,
        response_format: "json",
      },
    });

    let canonicalCity = cityInput;
    const citiesContent = citiesResponse.content?.[0];
    if (citiesContent?.type === "text") {
      const citiesData = JSON.parse(citiesContent.text);
      if (citiesData.cities && citiesData.cities.length > 0) {
        canonicalCity = citiesData.cities[0].name;
        console.log(`Resolved "${cityInput}" to canonical city: "${canonicalCity}"`);
      }
    }

    // 2. Format delivery date if provided, otherwise default to today
    let dateStr = deliveryDate || null;
    if (!dateStr) {
      const today = new Date();
      // Format to Sri Lanka date (Asia/Colombo) YYYY-MM-DD
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const formatter = new Intl.DateTimeFormat("en-CA", options); // en-CA outputs YYYY-MM-DD
      dateStr = formatter.format(today);
    }

    // 3. Call check delivery tool
    const deliveryResponse = await callMcpTool("kapruka_check_delivery", {
      params: {
        city: canonicalCity,
        delivery_date: dateStr,
        response_format: "json",
      },
    });

    const deliveryContent = deliveryResponse.content?.[0];
    if (deliveryContent?.type === "text") {
      return JSON.parse(deliveryContent.text);
    }
    throw new Error("Could not parse delivery quote response");
  } catch (error) {
    console.error("Error getting delivery quote:", error);
    return {
      city: cityInput,
      available: false,
      rate: 0,
      currency: "LKR",
      reason: error instanceof Error ? error.message : "Failed to fetch delivery details",
    };
  }
}

/**
 * Creates guest checkout order and returns payment link
 */
export async function createGuestCheckout(params: {
  cart: Array<{ product_id: string; quantity: number; icing_text?: string | null }>;
  recipient: { name: string; phone: string };
  delivery: { address: string; city: string; location_type?: string; date: string; instructions?: string | null };
  sender: { name: string; anonymous?: boolean };
  gift_message?: string | null;
}) {
  try {
    // 1. Resolve city to canonical city first
    const citiesResponse = await callMcpTool("kapruka_list_delivery_cities", {
      params: {
        query: params.delivery.city,
        limit: 5,
        response_format: "json",
      },
    });

    let canonicalCity = params.delivery.city;
    const citiesContent = citiesResponse.content?.[0];
    if (citiesContent?.type === "text") {
      const citiesData = JSON.parse(citiesContent.text);
      if (citiesData.cities && citiesData.cities.length > 0) {
        canonicalCity = citiesData.cities[0].name;
      }
    }

    // 2. Assemble parameters for kapruka_create_order
    const response = await callMcpTool("kapruka_create_order", {
      params: {
        cart: params.cart,
        recipient: {
          name: params.recipient.name,
          phone: params.recipient.phone,
        },
        delivery: {
          address: params.delivery.address,
          city: canonicalCity,
          location_type: params.delivery.location_type || "house",
          date: params.delivery.date,
          instructions: params.delivery.instructions || null,
        },
        sender: {
          name: params.sender.name,
          anonymous: params.sender.anonymous || false,
        },
        gift_message: params.gift_message || null,
        currency: "LKR",
        response_format: "json",
      },
    });

    const content = response.content?.[0];
    if (content?.type === "text") {
      return JSON.parse(content.text);
    }
    throw new Error("Could not parse guest checkout response");
  } catch (error) {
    console.error("Error creating guest checkout:", error);
    throw error;
  }
}
