import OpenAI from "openai";
import { searchProducts, browseCategories, getDeliveryQuote, createGuestCheckout } from "./mcp";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const key = geminiKey || openAiKey;

  if (!key) {
    throw new Error("Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured in your server environment variables.");
  }

  // Use Gemini if GEMINI_API_KEY is present or if OPENAI_API_KEY starts with Google key prefix
  const isGoogle = !!geminiKey || key.startsWith("AIzaSy");

  if (isGoogle) {
    return new OpenAI({
      apiKey: key,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
  return new OpenAI({ apiKey: key });
};

// System prompt for the Kapruka Shopping Agent
const SYSTEM_PROMPT = `You are Kapruka's Premium AI Shopping Agent, a helpful concierge assistant that helps users discover products, calculate delivery rates, and checkout.

The entire interface is a full-screen chat window. The products you search for will be displayed as beautiful, interactive cards directly in the chat window, and delivery details can be collected using an inline form.

Follow this workflow:
1. UNDERSTAND INTENT & RECOMMEND:
   - When a user states what they need (e.g., "gift for mom"), search products immediately using the 'search_products' tool.
   - If the request is too vague, ask friendly, targeted follow-up questions about:
     * Who is the recipient?
     * What is the occasion? (birthday, anniversary, thank you, etc.)
     * What is the budget? (in LKR/Rs. e.g. Rs. 5000)
   - Present the search results. Explain why you recommended them based on their query. The UI will render the product cards automatically.

2. CART SELECTION:
   - Guide the user to select the products they want using the "Select" button on the cards.
   - The active cart items will be passed to you in the context.

3. DELIVERY DETAILS:
   - Once they have selected products (the cart is not empty) and want to proceed, ask for delivery details. 
   - State that they can fill out the form shown on the screen, or provide: Name, Phone number, Delivery City (District), and Street Address.
   - Once they submit the form or provide the details, call the 'get_delivery_quote' tool.

4. QUOTE & CHECKOUT:
   - Call 'get_delivery_quote' using the city.
   - Present the quote details (delivery cost and date) clearly.
   - Ask if they are ready to place the order.
   - If yes, call 'create_guest_checkout' using their cart, recipient, delivery, and sender information (default sender to the recipient's name or ask who it is from if it's a gift).
   - Return the secure checkout link (payment link) generated. Tell the user to click the link to complete the payment.

Be concise, warm, and highly professional. Do not dump raw JSON. Use markdown formatting to make your text easy to read.`;

// Define the OpenAI tools
const AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products in the Kapruka catalog by keyword/query, and optionally filter by category.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search keyword (e.g., 'birthday cake', 'chocolates', 'teddy bear', 'flowers'). Min 3 chars.",
          },
          category: {
            type: "string",
            description: "Optional category filter (e.g., 'Cakes', 'Flowers', 'Toys').",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browse_categories",
      description: "List all top-level product categories available on Kapruka.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_delivery_quote",
      description: "Retrieve delivery feasibility, cost (LKR), and delivery date for a Sri Lankan city/district.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "The name of the city/district to check delivery for (e.g., 'Colombo 03', 'Galle', 'Kandy').",
          },
          delivery_date: {
            type: "string",
            description: "Optional target delivery date in YYYY-MM-DD format (must be today or future).",
          },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_guest_checkout",
      description: "Create a guest order on Kapruka and generate a secure checkout/payment link.",
      parameters: {
        type: "object",
        properties: {
          cart: {
            type: "array",
            description: "List of items in the cart.",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string", description: "The Kapruka product ID (e.g., 'cake00ka002034')" },
                quantity: { type: "integer", default: 1, description: "Quantity of the product" },
                icing_text: { type: "string", description: "Optional icing message (cakes only)" },
              },
              required: ["product_id"],
            },
          },
          recipient: {
            type: "object",
            description: "Recipient contact details.",
            properties: {
              name: { type: "string", description: "Recipient name" },
              phone: { type: "string", description: "Recipient phone number (e.g., 0771234567)" },
            },
            required: ["name", "phone"],
          },
          delivery: {
            type: "object",
            description: "Delivery address details.",
            properties: {
              address: { type: "string", description: "Street address" },
              city: { type: "string", description: "Kapruka delivery city name (e.g., 'Colombo 03')" },
              date: { type: "string", description: "Delivery date (YYYY-MM-DD)" },
              location_type: { type: "string", enum: ["house", "apartment", "office", "other"], default: "house" },
              instructions: { type: "string", description: "Optional delivery instructions" },
            },
            required: ["address", "city", "date"],
          },
          sender: {
            type: "object",
            description: "Sender details for the gift card.",
            properties: {
              name: { type: "string", description: "Sender name" },
              anonymous: { type: "boolean", default: false, description: "Hide sender name on the gift card" },
            },
            required: ["name"],
          },
          gift_message: {
            type: "string",
            description: "Optional gift card message. Max 300 chars.",
          },
        },
        required: ["cart", "recipient", "delivery", "sender"],
      },
    },
  },
];

/**
 * Runs the OpenAI agent flow and executes any requested MCP tools.
 * Returns the final agent message and any structured layout metadata (e.g., products searched, quotes created).
 */
export async function runAgent(
  messages: Array<{ role: "user" | "assistant" | "system" | "tool"; content: string; name?: string; tool_call_id?: string }>,
  currentCart: Array<{ product_id: string; quantity: number; title: string; price: number; image_url: string | null }>
) {
  const openai = getOpenAIClient();
  
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const key = geminiKey || openAiKey;
  const isUsingGemini = !!geminiKey || (!!key && key.startsWith("AIzaSy"));
  const defaultModel = isUsingGemini ? "gemini-2.5-flash" : "gpt-4o-mini";
  const model = process.env.OPENAI_MODEL || defaultModel;

  // Construct context regarding the user's active cart state
  const cartContext = currentCart.length > 0
    ? `\n\n[USER ACTIVE CART CONTEXT]: The user currently has the following items selected in their cart:\n${JSON.stringify(currentCart, null, 2)}`
    : `\n\n[USER ACTIVE CART CONTEXT]: The user's cart is currently empty. Direct them to search and select products.`;

  // Inject system prompt and cart context at the start
  const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT + cartContext,
    },
    ...messages.map((m) => {
      // Map properties for OpenAI SDK compatibility
      const msg: any = {
        role: m.role,
        content: m.content,
      };
      if (m.name) msg.name = m.name;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      return msg;
    }),
  ];

  console.log("Calling OpenAI Chat Completion with model:", model);
  const response = await openai.chat.completions.create({
    model,
    messages: formattedMessages,
    tools: AGENT_TOOLS,
    tool_choice: "auto",
  });

  const choice = response.choices[0];
  const responseMessage = choice.message;

  // Check if the model wants to call tools
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    const toolCalls = responseMessage.tool_calls;
    console.log(`Agent requested ${toolCalls.length} tool call(s)`);

    // Prepare messages array for recursive/iterative execution
    const conversationHistory: any[] = [...formattedMessages];
    conversationHistory.push(responseMessage);

    let layoutMetadata: {
      type?: "products" | "address_form" | "checkout_quote" | "payment_link";
      products?: any[];
      quoteData?: any;
      checkoutData?: any;
    } = {};

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      
      const functionCall = (toolCall as any).function;
      if (!functionCall) continue;

      const functionName = functionCall.name;
      const functionArgs = JSON.parse(functionCall.arguments);
      let toolResult: any;

      console.log(`Executing tool: ${functionName}`, functionArgs);

      try {
        if (functionName === "search_products") {
          const products = await searchProducts(functionArgs.query, functionArgs.category);
          toolResult = JSON.stringify(products);
          layoutMetadata = {
            type: "products",
            products: products,
          };
        } else if (functionName === "browse_categories") {
          const categories = await browseCategories();
          toolResult = JSON.stringify(categories);
        } else if (functionName === "get_delivery_quote") {
          const quote = await getDeliveryQuote(functionArgs.city, functionArgs.delivery_date);
          toolResult = JSON.stringify(quote);
          layoutMetadata = {
            type: "checkout_quote",
            quoteData: quote,
          };
        } else if (functionName === "create_guest_checkout") {
          const checkout = await createGuestCheckout({
            cart: functionArgs.cart,
            recipient: functionArgs.recipient,
            delivery: functionArgs.delivery,
            sender: functionArgs.sender,
            gift_message: functionArgs.gift_message,
          });
          toolResult = JSON.stringify(checkout);
          layoutMetadata = {
            type: "payment_link",
            checkoutData: checkout,
          };
        } else {
          throw new Error(`Unknown tool: ${functionName}`);
        }
      } catch (err: any) {
        console.error(`Tool execution failed [${functionName}]:`, err);
        toolResult = JSON.stringify({ error: err.message || "Execution error" });
      }

      // Add tool output to conversation history
      conversationHistory.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: functionName,
        content: toolResult,
      });
    }

    // Call OpenAI again with the tool execution outputs
    console.log("Sending tool results back to OpenAI...");
    const secondResponse = await openai.chat.completions.create({
      model,
      messages: conversationHistory,
    });

    const secondChoice = secondResponse.choices[0];
    return {
      message: secondChoice.message,
      metadata: layoutMetadata,
      rawToolCalls: toolCalls
        .filter((t) => t.type === "function")
        .map((t: any) => ({
          id: t.id,
          name: t.function?.name || "",
          arguments: t.function?.arguments || "{}",
        })),
    };
  }

  // If no tool calls, return response directly
  return {
    message: responseMessage,
    metadata: {}
  };
}
