import { convertToCoreMessages, streamText as baseStreamText } from "ai";
import { LiteralClient, Step } from "@literalai/client";
import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";
import { getRagTool } from "@/llm/tools";

const openai = createOpenAI();
const literalClient = new LiteralClient();
const streamText =
  literalClient.instrumentation.vercel.instrument(baseStreamText);

const promptName = "Linux RAG";

export async function POST(req: Request) {
  const { messages, threadId, runId } = await req.json();
  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  if (messages.length === 1) {
    const userMessage = messages[0].content;

    await literalClient.thread({ id: threadId, name: userMessage }).upsert();
  }

  const fetchedThread = await literalClient.api.getThread(threadId);

  if (!fetchedThread) {
    throw new Error("Thread not found");
  }

  const thread = literalClient.thread(fetchedThread);

  const lastMessage = [...messages].pop();

  if (lastMessage.role === "user") {
    // Here we are intercepting a user's message
    // We create a new run and call the LLM
    const userMessage = lastMessage.content;

    await thread
      .step({
        type: "user_message",
        name: "User",
        output: { content: userMessage },
      })
      .send();

    const run = await thread
      .step({
        id: runId,
        type: "run",
        name: "RAG Agent",
        input: { content: [...promptMessages, ...messages] },
      })
      .send();

    const result = await streamText({
      model: openai(prompt.settings.model as OpenAI.ChatModel),
      system: promptMessages[0].content as string,
      messages: convertToCoreMessages(messages),
      toolChoice: "auto",
      tools: { rag: getRagTool(run) },
      literalAiParent: run,
      onFinish: async (response) => {
        // When the run is finished, we update the end time and output of the run
        run.endTime = new Date().toISOString();
        run.output = {
          role: "assistant",
          content: response.text,
        };
        await run.send();
      },
    });

    return result.toAIStreamResponse();
  } else {
    // Here the LLM has called the tool and we intercept the response from the tool
    // We fetch the run from the Literal AI API and attach it to the call to the LLM
    const fetchedRun = await literalClient.api.getStep(runId);

    if (!fetchedRun) {
      throw new Error("Run not found");
    }

    const run = literalClient.step(fetchedRun);

    const result = await streamText({
      model: openai(prompt.settings.model as OpenAI.ChatModel),
      system: promptMessages[0].content as string,
      messages: convertToCoreMessages(messages),
      toolChoice: "auto",
      tools: { rag: getRagTool(run) },
      literalAiParent: run,
      onFinish: async (response) => {
        // When the run is finished, we update the end time and output of the run
        run.endTime = new Date().toISOString();
        run.output = {
          role: "assistant",
          content: response.text,
        };
        await run.send();
      },
    });

    return result.toAIStreamResponse();
  }
}
