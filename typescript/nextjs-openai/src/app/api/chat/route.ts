import { OpenAI } from "openai/index.mjs";
import { JSONValue, OpenAIStream, StreamData, StreamingTextResponse } from "ai";
import { LiteralClient } from "@literalai/client";

const openai = new OpenAI();
const literalClient = new LiteralClient();

export async function POST(req: Request) {
  const { messages: chatMessages, threadId } = await req.json();
  const data = new StreamData();

  // Get the prompt from the Literal API
  // It will always be the latest version of the prompt// model and settings.
  const promptName = "Simple Chatbot";
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  // Create or retrieve the thread
  const thread = await literalClient
    .thread({ id: threadId, name: "Simple Chatbot" })
    .upsert();

  // Save user message in the thread
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

  // Create a step for the ai run
  const run = thread.step({
    type: "run",
    name: "My Assistant Run",
    input: { content: [...promptMessages, ...chatMessages] },
  });

  literalClient.instrumentation.openai(result, run);

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(result, {
    // Here we send the chatbot's response to Literal
    // as soon as it is complete
    onCompletion: async (completion) => {
      run.output = { content: completion };
      await run.send();

      // Save assistant message
      await thread
        .step({
          type: "assistant_message",
          name: "Bot",
          output: { content: completion },
        })
        .send();
    },
    // When the message is completed, we append the stepId from
    // the run into the streaming response
    onFinal: async () => {
      data.append({ stepId: run.id } as JSONValue);
      data.close();
    },
  });

  // Respond with the stream. This will allow the frontend to display
  // the response as it is being sent out by gpt-3, rather than waiting for
  // the whole message to be complete
  return new StreamingTextResponse(stream, {}, data);
}
