import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();

export async function POST(req: Request) {
  const { threadId, message, messagesHistory } = await req.json();

  const promptName = "Simple Chatbot";
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  // Create or retrieve the thread
  const thread = await literalClient
    .thread({ id: threadId, name: "Simple Chatbot" })
    .upsert();

  // Create a step for the ai run
  const run = await thread
    .step({
      type: "run",
      name: "My Assistant Run",
      input: { content: [...promptMessages, ...messagesHistory] },
    })
    .send();

  // Save assistant message
  await run
    .step({
      id: message.id,
      type: "assistant_message",
      name: "Bot",
      output: { content: message.content },
    })
    .send();

  return Response.json({ ok: true });
}
