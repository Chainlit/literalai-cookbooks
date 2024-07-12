export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { LiteralClient } from "@literalai/client";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const literalClient = new LiteralClient();
literalClient.instrumentation.openai();

export async function POST(req: NextRequest) {
  const { text, runId } = await req.json();

  if (!text) {
    return new NextResponse("No text provided", { status: 400 });
  }

  if (!runId) {
    return new NextResponse("No runId provided", { status: 400 });
  }

  // Get the prompt from the Literal API
  const promptName = "Emojifier Prompt";
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  // Fetch the run and convert it to a Step instance
  const run = await literalClient.api.getStep(runId);

  if (!run) {
    return new NextResponse("Run not found", { status: 404 });
  }

  const response = run.wrap(async () => {
    const completion = await openai.chat.completions.create({
      ...prompt.settings,
      messages: [...promptMessages, { role: "user", content: text }],
    });

    return completion.choices[0].message.content;
  });

  return Response.json({
    emojifiedText: response,
  });
}
