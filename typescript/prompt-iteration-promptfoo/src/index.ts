import { Dataset, IGenerationMessage } from "@literalai/client";

import "dotenv/config";

import promptTemplate_1 from "../promptTemplate_1.json";
import promptTemplate_2 from "../promptTemplate_2.json";
import { evaluateWithPromptfoo } from "./promptFooHelpers";
import { runApplication } from "./wildlifeAssistant";

import { literalAiClient } from "./init";
const DATASET_NAME = "Animal Facts Dataset";
const PROMPT_TEMPLATE_NAME = "Animal Facts Template";
const MAX_NUMBER_OF_GENERATIONS = 3;

const createDataset = async () => {
  /**
   * Create a prompt template.
   */

  const promptTemplate = await literalAiClient.api.getOrCreatePrompt(
    PROMPT_TEMPLATE_NAME,
    promptTemplate_1 as IGenerationMessage[]
  );

  const existingDataset = await literalAiClient.api.getDataset({
    name: DATASET_NAME,
  });

  if (existingDataset) return { dataset: existingDataset, promptTemplate };

  /**
   * Create a dataset.
   */
  const dataset: Dataset = await literalAiClient.api.createDataset({
    name: DATASET_NAME,
    description: "Dataset to evaluate our prompt template.",
    type: "generation",
  });

  /**
   * Small application to create 10 Generations.
   */
  await runApplication(promptTemplate);

  /**
   * Get the generations that were created.
   */
  const generations = (
    await literalAiClient.api.getGenerations({
      first: MAX_NUMBER_OF_GENERATIONS,
      filters: [
        {
          field: "promptLineage",
          operator: "eq",
          value: PROMPT_TEMPLATE_NAME,
        },
      ],
    })
  ).data;

  /**
   * Add the generations to the dataset. Adapt the expected output.
   */
  await dataset.addGenerations(generations.map(({ id }) => id));

  return { dataset, promptTemplate };
};

const main = async () => {
  /**
   * Evaluate the prompt template with promptfoo and create experiment on Literal AI.
   */
  const { dataset, promptTemplate } = await createDataset();

  await evaluateWithPromptfoo(
    "Animal Facts Experiment",
    dataset,
    promptTemplate
  );

  /**
   * Use another prompt template and evaluate anew.
   * Visualize on Literal AI.
   */
  const promptTemplateEnhanced = await literalAiClient.api.getOrCreatePrompt(
    PROMPT_TEMPLATE_NAME,
    promptTemplate_2 as IGenerationMessage[]
  );

  await evaluateWithPromptfoo(
    "Wild life Experiment",
    dataset,
    promptTemplateEnhanced
  );
};

main();
