import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";

import { Prompt } from "@literalai/client";

import { literalAiClient } from "./init";

// Instrument the OpenAI client
literalAiClient.instrumentation.openai();

const openai = new OpenAI();

async function wildlifeAssistant(messages: ChatCompletionMessageParam[]) {
  return literalAiClient
    .run({
      name: "Wildlife Assistant",
      input: { content: messages?.slice(-1)[0].content },
    })
    .wrap(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
      });

      return completion;
    });
}

export async function runApplication(promptTemplate: Prompt) {
  const animals = ["platypus", "bass", "otter"];

  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];

    const messages: ChatCompletionMessageParam[] =
      promptTemplate?.formatMessages({ animal }) || [];

    console.log("Starting thread for animal: ", animal);

    await literalAiClient.thread({ name: animal }).wrap(async () => {
      await literalAiClient
        .step({
          output: { content: messages?.slice(-1)[0].content },
          type: "user_message",
          name: "User",
        })
        .send();

      return literalAiClient
        .step({
          type: "user_message",
          name: "User",
        })
        .wrap(() => wildlifeAssistant(messages));
    });
  }
}
