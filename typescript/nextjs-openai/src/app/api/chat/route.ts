import { OpenAI } from "openai/index.mjs";
import { OpenAIStream, StreamingTextResponse } from "ai";

import { LiteralClient } from "@literalai/client";

const openai = new OpenAI();
const literalClient = new LiteralClient();

export async function POST(req: Request) {
  const { messages: chatMessages, threadId } = await req.json();

  // Get the prompt from the Literal API
  // It will always be the latest version of the prompt
  // model and settings.
  const promptName = "Simple Chatbot";
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  // Create or retrieve the thread
  const thread = await literalClient
    .thread({ id: threadId, name: "Simple Chatbot" })
    .upsert();

  // Save user message
  await thread
    .step({
      type: "user_message",
      name: "User",
      output: { content: chatMessages[chatMessages.length - 1].content },
    })
    .send();

  const result = await openai.chat.completions.create({
    stream: true,
    messages: [...promptMessages, ...chatMessages],
    ...prompt.settings,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(result);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
