import { OpenAI } from "openai/index.mjs";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { LiteralClient } from "@literalai/client";

const openai = new OpenAI();
const literalClient = new LiteralClient();
literalClient.instrumentation.openai();

export async function POST(req: Request) {
  const { messages: chatMessages, threadId, runId } = await req.json();

  // Get the prompt from the Literal API
  // It will always be the latest version of the prompt model and settings.
  const promptName = "Simple Chatbot";
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  // Wrap the interaction in the thread
  return literalClient
    .thread({ id: threadId, name: "Simple Chatbot" })
    .wrap(async () => {
      // Save user message in the Thread
      await literalClient
        .step({
          type: "user_message",
          name: "User",
          output: { content: chatMessages[chatMessages.length - 1].content },
        })
        .send();

      // Wrap the AI completion step in a Run
      return literalClient
        .run({
          id: runId,
          name: "My Assistant Run",
          input: { content: [...promptMessages, ...chatMessages] },
        })
        .wrap(async (run) => {
          const result = await openai.chat.completions.create({
            stream: true,
            messages: [...promptMessages, ...chatMessages],
            ...prompt.settings,
          });

          // We want the response as a stream
          const stream = OpenAIStream(result, {
            onCompletion: async (completion) => {
              run.output = { content: completion };
              // Because this function will execute outside of the scope of the wrapper
              // We have to update the run object manually
              await run.send();
            },
          });

          // Respond with the stream to allow streaming display on the frontend
          return new StreamingTextResponse(stream);
        });
    });
}
