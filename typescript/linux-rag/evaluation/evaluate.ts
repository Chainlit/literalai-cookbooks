import "dotenv/config";
import { withCSV } from "with-csv";
import { LiteralClient } from "@literalai/client";
import { generateText, convertToCoreMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";
import cliProgress from "cli-progress";
import crypto from "crypto";
import { chunk } from "lodash";

import { getRagTool } from "@/llm/tools";

const literalClient = new LiteralClient();

const evaluationRun = "RAG vs 3.5";
const promptName = "Linux RAG";

const openai = createOpenAI();

async function getDataset() {
  const existingDataset = await literalClient.api.getDataset({
    name: evaluationRun,
  });

  if (existingDataset) {
    return existingDataset;
  }

  return literalClient.api.createDataset({
    name: evaluationRun,
    type: "generation",
  });
}

async function evaluate() {
  const dataset = await getDataset();

  const prompt = await literalClient.api.getPrompt(promptName);
  if (!prompt) throw new Error("Prompt not found");
  const promptMessages = prompt.formatMessages();

  const threadId = crypto.randomUUID();
  const thread = await literalClient
    .thread({ id: threadId, name: `Evaluation ${evaluationRun}` })
    .upsert();

  const questions = await withCSV("evaluation/questions.csv")
    .columns(["question", "answer"])
    .rows();

  const progress = new cliProgress.SingleBar({}, cliProgress.Presets.rect);
  progress.start(questions.length, 0);

  const concurrency = 5;

  const questionChunks = chunk(questions, concurrency);

  for (const chunk of questionChunks) {
    await Promise.all(
      chunk.map(async ({ question, answer }) => {
        const messages = [
          ...promptMessages,
          { role: "user", content: question },
        ];

        const evaluationRunStep = await thread
          .step({
            type: "run",
            name: question,
            input: {
              content: messages,
            },
          })
          .send();

        await evaluationRunStep
          .step({
            type: "llm",
            name: "Gold standard",
            output: { content: answer },
            tags: ["eval-gold"],
          })
          .send();

        const { text: vanillaGPT3Answer } = await generateText({
          model: openai(prompt.settings.model as OpenAI.ChatModel),
          system: promptMessages[0].content as string,
          messages: convertToCoreMessages([
            { role: "user", content: question },
          ]),
        });

        await evaluationRunStep
          .step({
            type: "llm",
            name: "Vanilla GPT-3.5 answer",
            output: { content: vanillaGPT3Answer },
            tags: ["eval-gpt-3.5"],
            generation: {
              type: "COMPLETION",
              messages: [
                {
                  role: "system",
                  content: promptMessages[0].content as string,
                },
                { role: "user", content: question },
                { role: "assistant", content: vanillaGPT3Answer },
              ],
            },
          })
          .send();

        const { text: ragAnswer } = await generateText({
          model: openai(prompt.settings.model as OpenAI.ChatModel),
          system: promptMessages[0].content as string,
          messages: convertToCoreMessages([
            { role: "user", content: question },
          ]),
          toolChoice: "auto",
          tools: {
            rag: getRagTool(evaluationRunStep),
          },
          maxToolRoundtrips: 3,
        });

        await evaluationRunStep
          .step({
            type: "llm",
            name: "RAG answer",
            output: { content: ragAnswer },
            tags: ["eval-rag"],
            generation: {
              type: "COMPLETION",
              messages: [
                {
                  role: "system",
                  content: promptMessages[0].content as string,
                },
                { role: "user", content: question },
              ],
              messageCompletion: { role: "assistant", content: ragAnswer },
            },
          })
          .send();

        progress.increment(1);
      })
    );
  }

  progress.stop();
}

evaluate()
  .then(() => console.log("Evaluation complete"))
  .catch(console.error);
