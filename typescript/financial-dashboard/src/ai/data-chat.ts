"use server";

import { openai } from "@ai-sdk/openai";
import {
  CoreMessage,
  streamText as streamTextWithoutMonitoring,
  tool,
} from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

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
  return literalClient
    .run({ name: "Answer", input: { history } })
    .wrap(async () => {
      const queryDatabaseSimple = async (
        query: string,
        columnNames?: string[]
      ) => {
        const { result } = await queryDatabase<any>(query, columnNames);
        return result;
      };

      const querySchema = z
        .string()
        .describe(
          [
            "A natural language query to text to a data expert.",
            "Use any context provided if possible.",
            "Do not write SQL, the data expert will handle it.",
            "You can only read data. Insert, update or delete is not allowed.",
          ].join("\n")
        );

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
          return (
            message.type === "loading" && message.placeholder === placeholder
          );
        });
        if (index < 0) {
          streamValue = [...streamValue, { type: "component", name, props }];
        } else {
          streamValue = [...streamValue];
          streamValue[index] = { type: "component", name, props };
        }
        stream.update(streamValue);
      };

      
      const result = await streamText({
        model: openai("gpt-4o"),
        system: [
          "You are a copilot on a data dashboard for a company selling GPUs.",
          "You will help the user query the data and view is as charts and tables.",
          "You will also help the user understand the data by generating text.",
        ].join("\n"),
        messages: history,
        temperature: 0.5,
        toolChoice: "auto",
        tools: {
          displayTable: tool({
            description: [
              "Display a table of data.",
              "Use for large data sets with multiple columns.",
              "Do not use when you expect one row or one column.",
            ].join("\n"),
            parameters: z.object({
              query: querySchema,
              outputColumns: z
                .array(
                  z.object({
                    name: z
                      .string()
                      .describe("the name of the column in the JSON result"),
                    label: z
                      .string()
                      .describe("the label to display in the table"),
                  })
                )
                .describe(
                  [
                    "The columns to display in the table.",
                    'Example: [{"name": "name", "label": "Name"}, {"name": "age", "label": "Age"}]',
                  ].join("\n")
                ),
            }),
            execute: async ({ query, outputColumns }) => {
              const placeholder = appendPlaceholder();
              const result = await queryDatabaseSimple(
                query,
                outputColumns.map((c) => c.name)
              );
              return {
                placeholder,
                name: "DataTable",
                props: { columns: outputColumns, rows: result },
              };
            },
          }),
          displayList: tool({
            description: [
              "Display a values.",
              "Use to answer to a query that returns a list of names or values.",
              "Do not use when some other information could be useful.",
            ].join("\n"),
            parameters: z.object({
              query: querySchema,
              outputColumn: z
                .string()
                .describe("the name of the column in the JSON result"),
            }),
            execute: async ({ query, outputColumn }) => {
              const placeholder = appendPlaceholder();
              const result = await queryDatabaseSimple(query, [outputColumn]);
              return {
                placeholder,
                name: "DataList",
                props: { values: result.map((row) => row[outputColumn]) },
              };
            },
          }),
          displayBarChart: tool({
            description: [
              "Display a list of labelled numeric values as a bar chart.",
              "Use for data sets with numeric values.",
              "You need to get 2 columns and include a label.",
            ].join("\n"),
            parameters: z.object({
              query: querySchema,
              labelOutputColumn: z
                .string()
                .describe(
                  "the name of the column with the label in the JSON result"
                ),
              valueOutputColumn: z
                .string()
                .describe(
                  "the name of the column with the value in the JSON result"
                ),
            }),
            execute: async ({
              query,
              labelOutputColumn,
              valueOutputColumn,
            }) => {
              const placeholder = appendPlaceholder();
              const result = await queryDatabaseSimple(query, [
                labelOutputColumn,
                valueOutputColumn,
              ]);

              return {
                placeholder,
                name: "DataBarChart",
                props: {
                  entries: result.map((row) => ({
                    name: row[labelOutputColumn],
                    value: row[valueOutputColumn],
                  })),
                },
              };
            },
          }),
          displaySingleValue: tool({
            description: [
              "Display a single data point.",
              "Use to answer very simple question, with a value or a name.",
            ].join("\n"),
            parameters: z.object({
              query: querySchema,
            }),
            execute: async ({ query }) => {
              const result = await queryDatabaseSimple(query);
              const subResult = await streamText({
                model: openai("gpt-4o"),
                messages: [
                  ...history,
                  {
                    role: "system",
                    content: "With result: " + JSON.stringify(result),
                  },
                ],
              });

              for await (const chunk of subResult.textStream) {
                appendDelta(chunk);
              }
              return null;
            },
          }),
        },
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
    });
};
