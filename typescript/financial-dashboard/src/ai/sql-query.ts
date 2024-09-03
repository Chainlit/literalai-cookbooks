"use server";

import { rawDatabase as db } from "@/db";
import { openai } from "@ai-sdk/openai";
import {
  generateText as generateTextWithoutMonitoring,
  type CoreMessage,
} from "ai";
import { type Database } from "better-sqlite3";

import { literalClient } from "@/lib/literal";
// import sqlPrompt from "./sqlprompt.json";


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
  
  // Option 1: Import the sqlPrompt directly from the JSON file
  // const { name, templateMessages, settings } = await import('./sqlprompt.json');
  // const prompt = await literalClient.api.getOrCreatePrompt(
  //   name, templateMessages as any, settings 
  // );

  // Option 2: Get the prompt from the Literal API
  const startTime = performance.now();
  const prompt = await literalClient.api.getPrompt('SqlExpert');
  const endTime = performance.now();
  console.log(`Time to fetch prompt: ${endTime - startTime} ms`);
  console.log(prompt);


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
          model: openai(prompt.settings.model),
          messages,
          temperature: prompt.settings.temperature,
        });

        const text = await generation.text;

        const query = text.match(/```sql\n((?:.|\n)+)\n```/)?.[1] ?? text;

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