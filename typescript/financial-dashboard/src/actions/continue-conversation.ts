"use server";

import type { ReactNode } from "react";

import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

import { literalClient } from "../lib/literal";
import { runUserQuery } from "./user-query-runner";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  display?: ReactNode;
  data?: any;
}

export type StreamablePart =
  | { type: "text"; delta: string }
  | { type: "component"; name: string; props: any; data?: any };

export async function continueConversation(
  history: Message[],
  threadId: string
) {
  console.log(history);

  const thread = await literalClient
    .thread({ id: threadId, name: "Showroom" })
    .upsert();

  const result = await literalClient.instrumentation.vercel.instrument(
    streamText
  )({
    literalAiParent: thread,
    model: openai("gpt-4o"),
    system:
      "You are a friendly data assistant. You will help the user view their data at charts and tables.",
    messages: history,
    temperature: 0.5,
    toolChoice: "auto",
    tools: {
      displayTable: tool({
        description: "Display a table of data.",
        parameters: z.object({
          query: z
            .string()
            .describe(
              "The query to pass to another llm, keep it in natural language."
            ),
          columns: z.array(
            z.object({
              name: z.string().describe("the name of the column in the result"),
              label: z.string().describe("the label to display in the table"),
            })
          ),
        }),
        execute: async ({ query, columns }) => {
          const { result } = await runUserQuery<any>(
            query,
            threadId,
            columns.map((c) => c.name)
          );
          return {
            name: "DataTable",
            props: { columns, rows: result },
            data: result,
          };
        },
      }),
      displayList: tool({
        description: "Display a list of values.",
        parameters: z.object({
          query: z
            .string()
            .describe(
              "The query to pass to another llm, keep it in natural language."
            ),
          column: z.string().describe("the name of the column in the result"),
        }),
        execute: async ({ query, column }) => {
          const { result } = await runUserQuery<any>(query, threadId, [column]);
          return {
            name: "List",
            props: { values: result.map((row) => row[column]) },
            data: result,
          };
        },
      }),
      displayBarChart: tool({
        description:
          "Display a list of values labelled numeric values as a bar chart.",
        parameters: z.object({
          query: z
            .string()
            .describe(
              "The query to pass to another llm, keep it in natural language."
            ),
          labelColumn: z
            .string()
            .describe("the name of the column with the label in the result"),
          valueColumn: z
            .string()
            .describe("the name of the column with the value in the result"),
        }),
        execute: async ({ query, labelColumn, valueColumn }) => {
          const { result } = await runUserQuery<any>(query, threadId, [
            labelColumn,
            valueColumn,
          ]);

          return {
            name: "BarChart",
            props: {
              entries: result.map((row) => ({
                name: row[labelColumn],
                value: row[valueColumn],
              })),
            },
            data: result,
          };
        },
      }),
    },
  });

  const stream = createStreamableValue<StreamablePart>();

  // Non blocking
  (async () => {
    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case "text-delta": {
          stream.update({ type: "text", delta: chunk.textDelta });
          break;
        }
        case "tool-result": {
          stream.update({ type: "component", ...chunk.result });
          break;
        }
      }
    }
    stream.done();
  })();

  return stream.value;
}
