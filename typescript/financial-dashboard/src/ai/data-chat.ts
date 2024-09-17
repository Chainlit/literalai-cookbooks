"use server";

import { openai } from "@ai-sdk/openai";
import {
  CoreMessage,
  jsonSchema,
  streamText as streamTextWithoutMonitoring,
  tool,
} from "ai";
import { createStreamableValue } from "ai/rsc";

import { literalClient } from "@/lib/literal";

import { queryDatabase } from "./sql-query";

const streamText = literalClient.instrumentation.vercel.instrument(
  streamTextWithoutMonitoring
);

type BotMessage =
  | { type: "text"; content: string }
  | { type: "loading"; placeholder: string }
  | { type: "component"; name: string; props: unknown };

export const streamChatWithData = async (history: CoreMessage[]) => {
  let streamValue: BotMessage[] = [];
  const stream = createStreamableValue(streamValue);

  const appendDelta = (delta: string) => {
    const lastMessage = streamValue[streamValue.length - 1];
    if (lastMessage?.type === "text") {
      streamValue = [...streamValue];
      streamValue[streamValue.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + delta,
      };
    } else {
      streamValue = [...streamValue, { type: "text", content: delta }];
    }
    stream.update(streamValue);
  };

  const appendPlaceholder = () => {
    const placeholder = Math.random().toString(36).substring(3, 7);
    streamValue = [...streamValue, { type: "loading", placeholder }];
    stream.update(streamValue);
    return placeholder;
  };

  const appendComponent = (
    placeholder: string,
    name: string,
    props: unknown
  ) => {
    const index = streamValue.findIndex((message) => {
      return message.type === "loading" && message.placeholder === placeholder;
    });
    if (index < 0) {
      streamValue = [...streamValue, { type: "component", name, props }];
    } else {
      streamValue = [...streamValue];
      streamValue[index] = { type: "component", name, props };
    }
    stream.update(streamValue);
  };

  const { name, templateMessages, settings, tools } = await import(
    "./prompt.json"
  );

  const prompt = await literalClient.api.getOrCreatePrompt(
    name,
    templateMessages as any,
    settings,
    tools
  );

  let messages = prompt.formatMessages();
  messages = [...messages, ...history];

  const displayTableJson = tools.find((tool) => tool.name === "displayTable");

  const displayTableTool = tool({
    description: displayTableJson?.description || "",
    parameters: jsonSchema<{
      query: string;
    }>(displayTableJson?.parameters),
    execute: async ({ query }) => {
      const placeholder = appendPlaceholder();
      // todo: wrap
      const queryResult = await queryDatabase(query);

      const columns = Object.keys(queryResult.result[0]).map((key) => ({
        name: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
      }));

      return {
        placeholder,
        name: "DataTable",
        props: { columns: columns, rows: queryResult.result },
      };
    },
  });

  const availableTools = {
    displayTable: displayTableTool,
  };

  const result = await streamText({
    model: openai(settings.model),
    messages: messages,
    temperature: settings.temperature,
    toolChoice: settings.toolChoice as any,
    tools: availableTools,
  });

  (async () => {
    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case "text-delta": {
          appendDelta(chunk.textDelta);
          break;
        }
        case "tool-result": {
          if (chunk.result) {
            const { placeholder, name, props } = chunk.result;
            appendComponent(placeholder, name, props);
          }
          break;
        }
      }
    }
    //TODO: assistant message could only show: table shown corresponding to following sql query
    await Promise.all(
      streamValue.map((message) =>
        literalClient
          .step({
            type: "assistant_message",
            name: "Bot Message",
            output: message,
          })
          .send()
      )
    );
    stream.done();
  })();

  return stream.value;
};
