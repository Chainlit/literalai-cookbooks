import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return new NextResponse("No text provided", { status: 400 });
  }

  // Call the LLM API
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a hyeroglyphic assistant. Your job is to summarize text into emojis.",
      },
      { role: "user", content: text },
    ],
  });

  return Response.json({
    emojifiedText: completion.choices[0].message.content,
  });
}
