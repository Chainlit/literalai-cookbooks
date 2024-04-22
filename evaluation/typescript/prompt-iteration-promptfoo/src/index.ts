import { Dataset, IGenerationMessage, LiteralClient } from '@literalai/client';

import promptTemplate_1 from '../promptTemplate_1.json';
import promptTemplate_2 from '../promptTemplate_2.json';
import { evaluateWithPromptfoo } from './promptFooHelpers';
import { runApplication } from './wildlifeAssistant';

export const client = new LiteralClient();
import OpenAI from 'openai';
import { i } from '@literalai/client/dist/api-NNGlvKtN';
const openai = new OpenAI();

const DATASET_NAME = 'Animal Facts Dataset';
const PROMPT_TEMPLATE_NAME = 'Animal Facts Template';
const MAX_NUMBER_OF_GENERATIONS = 3;

const createDataset = async () => {
  /**
   * Create a prompt template.
   */

  const promptTemplate = await client.api.createPrompt(
    PROMPT_TEMPLATE_NAME,
    promptTemplate_1 as IGenerationMessage[]
  );

  const existingDataset = await client.api.getDataset({
    name: DATASET_NAME
  });

  if (existingDataset) return { dataset: existingDataset, promptTemplate };

  /**
   * Create a dataset.
   */
  const dataset: Dataset = await client.api.createDataset({
    name: DATASET_NAME,
    description: 'Dataset to evaluate our prompt template.',
    type: 'generation'
  });

  /**
   * Small application to create 10 Generations.
   */
  await runApplication(promptTemplate);

  /**
   * Get the generations that were created.
   */
  const generations = (
    await client.api.getGenerations({
      first: MAX_NUMBER_OF_GENERATIONS,
      filters: [
        {
          field: 'promptLineage',
          operator: 'eq',
          value: PROMPT_TEMPLATE_NAME
        }
      ]
    })
  ).data;

  /**
   * Add the generations to the dataset. Adapt the expected output.
   */
  await dataset.addGenerations(generations.map(({ id }) => id));

  return { dataset, promptTemplate };
};

const main = async () => {
  const promptName = "Default";
  // This will fetch the champion version, you can also pass a specific version
  const prompt = await client.api.getPrompt(promptName);

  console.log(prompt?.settings);
  // Optionally pass variables to the prompt
  const variables = { foo: "bar" };

  if (!prompt) {
	return console.error("Prompt not found");

  }
  const messages = prompt.format(variables);
  console.log(messages);

  // Prompt settings expose provider parameters: model, temperature, max_tokens, etc.
  Object.assign(prompt.settings, { max_tokens: 100 });

  const completion = await openai.chat.completions.create({
    messages: messages,
    ...prompt.settings
  });

  console.log(completion.choices[0].message);
};

main();
