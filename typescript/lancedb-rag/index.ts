import "dotenv/config";

import readline from "node:readline/promises";
import OpenAI from "openai";

import { LiteralClient } from "@literalai/client";
import { createPrompt, getEmbeddingsTable } from "./rag";

// Use OpenAI Completion API to generate and answer based on the context that LanceDB provides
const openai = new OpenAI();

// Initialize the Literal Client
const literalClient = new LiteralClient();

// Instrument the OpenAI API calls
literalClient.instrumentation.openai();

const run = async () => {
  // You need to provide an OpenAI API key, here we read it from the OPENAI_API_KEY environment variable
  const apiKey = process.env.OPENAI_API_KEY!;

  // Get the embeddings table
  const tbl = await getEmbeddingsTable(apiKey);

  await literalClient.thread({ name: "LanceDB RAG" }).wrap(async () => {
    // Create a readline interface to interact with the user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      while (true) {
        const query = await rl.question("Prompt: ");

        const modelResponse = await literalClient
          .run({ name: "Run" })
          .wrap(async () => {
            const results = await literalClient
              .step({
                name: "Retrieve",
                type: "retrieval",
                input: { query },
              })
              .wrap(() =>
                tbl
                  .search(query)
                  .select(["title", "text", "context"])
                  .limit(3)
                  .execute()
              );

            const response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: createPrompt(query, results as any),
                },
              ],
              max_tokens: 400,
              temperature: 0,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            });

            return response.choices[0].message;
          });

        console.log(modelResponse.content);
        console.log();
      }
    } catch (err) {
      console.log("Error: ", err);
    } finally {
      rl.close();
    }
  });
};

run();
