import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

import { Prompt, Thread } from '@literalai/client';

import { client } from './index';

const openai = new OpenAI({});

async function wildlifeAssistant(
  thread: Thread,
  messages: ChatCompletionMessageParam[]
) {
  const run = thread.step({
    name: 'Wildlife Assistant',
    type: 'run',
    input: { content: messages?.slice(-1)[0].content }
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages ?? []
  });

  await client.instrumentation.openai(completion, run);

  run.output = completion.choices[0].message;

  await run.send();

  await run
    .step({
      output: completion.choices[0].message,
      type: 'assistant_message',
      name: 'Animal Fact'
    })
    .send();
}

export async function runApplication(promptTemplate: Prompt) {
  const animals = ['platypus', 'bass', 'otter'];

  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    const thread = await client.thread({ name: animal }).upsert();

    const messages: ChatCompletionMessageParam[] =
      promptTemplate?.format({ animal }) || [];

    await thread
      .step({
        output: { content: messages?.slice(-1)[0].content },
        type: 'user_message',
        name: 'User'
      })
      .send();

    await wildlifeAssistant(thread, messages);
  }
}
