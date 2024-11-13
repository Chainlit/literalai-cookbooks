"use server";

import { CoreMessage, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";

import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();
const streamTextMonitored =
  literalClient.instrumentation.vercel.instrument(streamText);

export async function continueConversation(history: CoreMessage[]) {
  const stream = createStreamableValue();

  (async () => {
    const { textStream } = await streamTextMonitored({
      model: openai("gpt-4o-mini"),
      system:
        "You are a tourist guide helping people find interesting places to visit.",
      messages: history,
    });

    for await (const text of textStream) {
      stream.update(text);
    }
    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value,
  };
}
