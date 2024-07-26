import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import "dotenv/config";

import { LiteralClient, Prompt } from "@literalai/client";

export const client = new LiteralClient();

const openai = new OpenAI();
client.instrumentation.openai();

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

      return completion.choices[0].message.content;
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
          type: "assistant_message",
          name: "Assistant",
        })
        .wrap(() => wildlifeAssistant(messages));
    });
  }
}
