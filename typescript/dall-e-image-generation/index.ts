import "dotenv/config";

import fs from "node:fs/promises";
import readline from "node:readline/promises";
import OpenAI from "openai";

import { Attachment, LiteralClient } from "@literalai/client";

// Initialize the OpenAI to use Dall-E
const openai = new OpenAI();

// Initialize the Literal Client
const literalClient = new LiteralClient();

const generateImage = async (prompt: string) => {
  return literalClient
    .step({
      name: "Generation",
      type: "llm",
      input: { prompt },
    })
    .wrap(async () => {
      const response = await openai.images.generate({
        prompt: prompt,
        size: "256x256",
        n: 1,
      });

      literalClient.getCurrentStep().endTime = new Date().toISOString();
      literalClient.getCurrentStep().output = response;

      const openAiUrl = response.data[0].url!;
      const localPath = `images/${Date.now()}.png`;

      // Download the image from OpenAI
      await download(openAiUrl, localPath);

      // Upload the image to Literal AI
      const { objectKey, url: literalAiUrl } =
        await literalClient.api.uploadFile({
          path: localPath,
          mime: "image/png",
          threadId: literalClient.getCurrentThread().id,
        });

      const attachment = new Attachment({
        name: "result",
        objectKey,
        mime: "image/png",
      });

      literalClient.getCurrentStep().attachments = [attachment];

      return literalAiUrl;
    });
};

const download = async (uri: string, filepath: string) => {
  const res = await fetch(uri);
  const content = await res.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(content));
};

const run = async () => {
  // Create a readline interface to interact with the user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await literalClient.thread({ name: "Simple Dall-E" }).wrap(async () => {
    try {
      while (true) {
        const query = await rl.question("Prompt: ");

        const url = await generateImage(query);

        console.log({ query, url });
      }
    } catch (err) {
      console.log("Error: ", err);
    } finally {
      rl.close();
    }
  });

  process.exit(1);
};

run();
