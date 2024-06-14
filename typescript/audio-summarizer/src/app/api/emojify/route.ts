import { LiteralClient } from "@literalai/client";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI();
const literalClient = new LiteralClient();

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
  const runData = await literalClient.api.getStep(runId);
  if (!runData) {
    return new NextResponse("Run not found", { status: 404 });
  }
  const run = literalClient.step(runData);

  // Call the LLM and instrument the result so it is logged with all parameters in the run
  const completion = await openai.chat.completions.create({
    ...prompt.settings,
    messages: [...promptMessages, { role: "user", content: text }],
  });
  await literalClient.instrumentation.openai(completion, run);

  // We patch the run to add the end time so it shows the correct duration
  // We also add the output to the run
  run.endTime = new Date().toISOString();
  run.output = {
    role: "assistant",
    content: completion.choices[0].message.content,
  };
  run.send();

  return Response.json({
    emojifiedText: completion.choices[0].message.content,
  });
}
