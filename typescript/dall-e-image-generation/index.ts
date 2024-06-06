import "dotenv/config";

import fs from "node:fs/promises";
import readline from "node:readline/promises";
import OpenAI from "openai";

import { Attachment, LiteralClient } from "@literalai/client";

const run = async () => {
  // Initialize the OpenAI to use Dall-E
  const openai = new OpenAI();

  // Initialize the Literal Client
  const literalClient = new LiteralClient();
  const thread = await literalClient.thread({ name: "Simple Dall-E" }).upsert();

  // Create a readline interface to interact with the user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    while (true) {
      const query = await rl.question("Prompt: ");

      const startTime = new Date();

      const response = await openai.images.generate({
        prompt: query,
        size: "256x256",
        n: 1,
      });

      const endTime = new Date();

      const openAiUrl = response.data[0].url!;
      const localPath = `images/${Date.now()}.png`;

      // Download the image from OpenAI
      await download(openAiUrl, localPath);

      // Upload the image to Literal AI
      const { objectKey, url: literalAiUrl } =
        await literalClient.api.uploadFile({
          path: localPath,
          mime: "image/png",
          threadId: thread.id,
        });

      const attachment = new Attachment({
        name: "result",
        objectKey,
        mime: "image/png",
      });

      // Create a step in Literal AI
      await thread
        .step({
          name: "Generation",
          type: "llm",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          input: { query },
          output: response,
          attachments: [attachment],
        })
        .send();

      console.log(literalAiUrl);
      console.log();
    }
  } catch (err) {
    console.log("Error: ", err);
  } finally {
    rl.close();
  }
  process.exit(1);
};

const download = async (uri: string, filepath: string) => {
  const res = await fetch(uri);
  const content = await res.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(content));
};

run();
