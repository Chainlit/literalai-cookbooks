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

  const stream = await streamChatWithData(thread, history);

  return createStreamableValue(stream).value;
};
