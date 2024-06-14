"use server";

import { openai } from "@ai-sdk/openai";
import { Step, Thread } from "@literalai/client";
import {
  CoreMessage,
  streamText as streamTextWithoutMonitoring,
  tool,
} from "ai";
import { z } from "zod";

import { literalClient } from "@/lib/literal";

import { queryDatabase } from "./sql-query";

const streamText = literalClient.instrumentation.vercel.instrument(
  streamTextWithoutMonitoring
);

export const streamChatWithData = async (
  literalAiParent: Thread | Step,
  history: CoreMessage[]
) => {
  const queryDatabaseSimple = async (query: string, columnNames?: string[]) => {
    const step = await literalAiParent
      .step({ type: "tool", name: "Query Database" })
      .send();
    const { result } = await queryDatabase<any>(step, query, columnNames);
    return result;
  };

  const result = await streamText({
    literalAiParent,
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
          const result = await queryDatabaseSimple(
            query,
            columns.map((c) => c.name)
          );
          return {
            name: "DataTable",
            props: { columns, rows: result },
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
          const result = await queryDatabaseSimple(query, [column]);
          return {
            name: "List",
            props: { values: result.map((row) => row[column]) },
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
          const result = await queryDatabaseSimple(query, [
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
          };
        },
      }),
    },
  });

  return result.fullStream;
};
