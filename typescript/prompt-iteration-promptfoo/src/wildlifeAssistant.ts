import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";

import { Prompt } from "@literalai/client";

import { client } from "./index";

const openai = new OpenAI();

async function wildlifeAssistant(messages: ChatCompletionMessageParam[]) {
  return client
    .run({
      name: "Wildlife Assistant",
      input: { content: messages?.slice(-1)[0].content },
    })
    .wrap(async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      await client.instrumentation.openai(completion, client.getCurrentStep());
    });
}

export async function runApplication(promptTemplate: Prompt) {
  const animals = ["platypus", "bass", "otter"];

  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];

    const messages: ChatCompletionMessageParam[] =
      promptTemplate?.formatMessages({ animal }) || [];

    console.log("Starting thread for animal: ", animal);

    await client.thread({ name: animal }).wrap(async () => {
      await client
        .step({
          output: { content: messages?.slice(-1)[0].content },
          type: "user_message",
          name: "User",
        })
        .send();

      return client
        .step({
          type: "user_message",
          name: "User",
        })
        .wrap(() => wildlifeAssistant(messages));
    });
  }
}
