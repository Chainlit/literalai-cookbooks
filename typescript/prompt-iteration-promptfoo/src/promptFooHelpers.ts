import promptfoo, {
  Assertion,
  EvaluateTestSuite,
  TestCase
} from 'promptfoo';

import { Dataset, Prompt, Score } from '@literalai/client';
import EvalResult from 'promptfoo/dist/src/models/evalResult';

/**
 * Evaluate a dataset against a prompt template.
 */
export async function evaluateWithPromptfoo(
  name: string,
  dataset: Dataset,
  promptTemplate: Prompt
) {
  const params = [
    {
      type: 'similar',
      value: '{{expectedOutput}}'
    }
  ] as Assertion[];

  // Test cases checking similarity between expected & reached output embeddings.
  const testCases: TestCase[] = dataset?.items.map((item) => {
    const promptVariables = item.metadata?.variables;
    const expectedOutput = item.expectedOutput?.content;
    return {
      vars: {
        ...promptVariables,
        expectedOutput
      },
      assert: params
    };
  });

  // Evaluate suite on our prompt template for the GPT-4o provider.
  const testSuite: EvaluateTestSuite = {
    prompts: [({ vars }: any) => promptTemplate.formatMessages(vars)] as any,
    providers: ['openai:gpt-4o'],
    tests: testCases
  };

  const results = (await promptfoo.evaluate(testSuite)).results;

  return addExperimentToLiteral(
    name,
    dataset,
    promptTemplate.id,
    params,
    results
  );
}

export async function addExperimentToLiteral(
  name: string,
  dataset: Dataset,
  promptVariantId: string,
  params: Assertion[],
  results: EvalResult[]
) {
  const datasetExperiment = await dataset.createExperiment({
    name,
    promptVariantId,
    params
  });

  // For each dataset item.
  results.forEach(async (result, index) => {
    // Create corresponding Score objects.
    const scores = result.gradingResult?.componentResults?.map(
      (componentResult) => {
        return new Score({
          name: componentResult.assertion?.type || 'N/A',
          value: componentResult.score,
          comment: componentResult.reason,
          scorer:
            componentResult.assertion?.provider?.toString() ||
            result.provider.id,
          type: 'AI'
        });
      }
    );
    // Log an experiment item.
    await datasetExperiment.log({
      datasetItemId: dataset.items[index].id,
      input: { content: JSON.parse(result.prompt.raw) },
      output: { content: result.response?.output },
      scores: scores || []
    });
  });
  return datasetExperiment;
}
