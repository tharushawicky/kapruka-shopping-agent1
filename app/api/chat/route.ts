import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";

export async function POST(req: Request) {
  try {
    const { messages, cart } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages must be an array" },
        { status: 400 }
      );
    }

    const cartItems = cart || [];

    // Call the OpenAI + MCP Agent loop
    const result = await runAgent(messages, cartItems);

    return NextResponse.json({
      role: "assistant",
      content: result.message.content || "",
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error("API Chat route error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while processing the request." },
      { status: 500 }
    );
  }
}
