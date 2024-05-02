import "dotenv/config";

import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI();

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages,
  });

  // Create or retrieve a thread from the given threadId
  const thread = await literalClient.thread({ id: threadId }).upsert();

  const lastMessage = messages[messages.length - 1];

  await thread
    .step({
      type: "user_message",
      name: "User",
      output: { content: lastMessage.content },
    })
    .send();

  const run = thread.step({
    type: "run",
    name: "OpenAI Run",
    input: { messages },
  });

  // Instrument the openai response to track generations
  await literalClient.instrumentation.openai(response, run);

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    onCompletion: async (completion) => {
      run.output = { completion };
      await run.send();

      await thread
        .step({
          type: "assistant_message",
          name: "Chatbot",
          output: { content: completion },
        })
        .send();
    },
  });

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
