import "dotenv/config";

import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs/promises";
import readline from "node:readline/promises";

import { LiteralClient } from "@literalai/client";

import {
  ContextChatEngine,
  Document,
  Settings,
  VectorStoreIndex,
} from "llamaindex";

const client = new LiteralClient();

client.instrumentation.llamaIndex.instrument();

// Update chunk size
Settings.chunkSize = 512;

async function main() {
  const documentContent = await fs.readFile("document.txt", "utf-8");
  const document = new Document({ text: documentContent });
  const index = await VectorStoreIndex.fromDocuments([document]);
  const retriever = index.asRetriever({ topK: { TEXT: 5, IMAGE: 5 } });
  const chatEngine = new ContextChatEngine({ retriever });
  const rl = readline.createInterface({ input, output });

  const thread = await client.thread({ name: "Llama Index Example" }).upsert();
  await client.instrumentation.llamaIndex.withThread(thread, async () => {
    while (true) {
      const query = await rl.question("Query: ");
      const stream = await chatEngine.chat({ message: query, stream: true });
      for await (const chunk of stream) {
        process.stdout.write(chunk.response);
      }
      process.stdout.write('\n');
    }
  });
}

main().catch(console.error);
