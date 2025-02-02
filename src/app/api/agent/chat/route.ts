// src/app/api/agent/chat/route.ts
import { NextResponse } from "next/server";
import { agentChat } from "@/agent";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const responseText = await agentChat(prompt);
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Error in agent/chat API route:", error);
    return NextResponse.error();
  }
}