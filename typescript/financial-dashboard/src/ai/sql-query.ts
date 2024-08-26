"use server";

import { rawDatabase as db } from "@/db";
import { openai } from "@ai-sdk/openai";
import {
  generateText as generateTextWithoutMonitoring,
  type CoreMessage,
} from "ai";
import { type Database } from "better-sqlite3";

import { literalClient } from "@/lib/literal";
import sqlPrompt from "./sqlprompt.json";

const generateText = literalClient.instrumentation.vercel.instrument(
  generateTextWithoutMonitoring
);

const getSqlSchema = (db: Database) => {
  return db
    .prepare<[], { sql: string }>(
      `
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table' AND name IN ('User', 'Order', 'OrderEntry', 'Product');
        `
    )
    .all()
    .map((row) => row.sql ?? "")
    .join("\n\n");
};

export type QueryResult<T = unknown> = {
  query: string;
  attempts: number;
  result: T[];
};

export const queryDatabase = async <T = unknown>(
  query: string,
  columnNames?: string[]
): Promise<QueryResult<T>> => {
  const { name, templateMessages, settings } = await import('./sqlprompt.json');
  const prompt = await literalClient.api.getOrCreatePrompt(
    name, templateMessages as any, settings 
  );
  const schema = getSqlSchema(db);

  let messages = prompt.formatMessages({schema:schema});

  return literalClient
    .step({
      type: "tool",
      name: "Query Database",
      input: { query, columnNames },
    })
    .wrap(async () => {
      messages = [
        ...messages,
        {
          role: "user",
          content: query,
        },
      ];

      let lastError: any = null;
      for (let attempts = 1; attempts <= 5; attempts++) {
        const generation = await generateText({
          model: openai(sqlPrompt.settings.model),
          messages,
          temperature: sqlPrompt.settings.temperature,
        });

        const text = await generation.text;

        const query = text.match(/```sql\n((?:.|\n)+)\n```/)?.[1] ?? text;
        console.log(attempts);

        try {
          const result = db.prepare(query).all() as T[];
          return { result, query, attempts };
        } catch (error) {
          messages.push(
            { role: "assistant", content: text },
            {
              role: "user",
              content: "That query is invalid. Please try again.",
            }
          );
          lastError = error;
        }
      }

      throw lastError;
    });
};