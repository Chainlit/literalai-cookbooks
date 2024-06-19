"use server";

import { CoreMessage } from "ai";
import { createStreamableValue } from "ai/rsc";

import { streamChatWithData } from "./ai/data-chat";
import { literalClient } from "./lib/literal";

export const continueConversationWithData = async (
  history: CoreMessage[],
  threadId: string
) => {
  const thread = await literalClient
    .thread({ id: threadId, name: "Showroom" })
    .upsert();

  const run = await thread.step({ type: "run", name: "Answer" }).send();

  const stream = await streamChatWithData(run, history);
  return stream;
};
