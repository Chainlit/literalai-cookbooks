"use server";

import { CoreMessage } from "ai";

import { streamChatWithData } from "./ai/data-chat";
import { literalClient } from "./lib/literal";

export const continueConversationWithData = async (
  history: CoreMessage[],
  threadId: string
) => {
  const firstUserMessage = history.find(msg => msg.role === 'user')?.content ?? "New conversation";
  return literalClient.thread({ id: threadId, name: firstUserMessage }).wrap(async () => {
    await literalClient
      .step({
        type: "user_message",
        name: "User",
        output: history[history.length - 1],
      })
      .send();

    const stream = await streamChatWithData(history);
    return stream;
  });
};

export const evaluateRun = async (runId: string, value: number) => {
  await literalClient.api.createScore({
    stepId: runId,
    name: "user-feedback",
    type: "HUMAN",
    value,
  });
};
