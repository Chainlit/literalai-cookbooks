import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";
import { formatDocumentsAsString } from "langchain/util/document";

import { LiteralClient } from "@literalai/client";

const literalClient = new LiteralClient();
const cb = literalClient.instrumentation.langchain.literalCallback();

const model = new ChatOpenAI({});

async function main() {
  const vectorStore = await HNSWLib.fromTexts(
    ["mitochondria is the powerhouse of the cell"],
    [{ id: 1 }],
    new OpenAIEmbeddings()
  );
  const retriever = vectorStore.asRetriever();

  const prompt =
    PromptTemplate.fromTemplate(`Answer the question based only on the following context:
{context}

Question: {question}`);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString) as any,
      question: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke("What is the powerhouse of the cell?", {
    callbacks: [cb],
    runName: "Standalone RAG Run",
  });

  console.log(result);

  await literalClient.thread({ name: "Test RAG Thread" }).wrap(async () => {
    const result = await chain.invoke("What is the powerhouse of the cell?", {
      callbacks: [cb],
    });

    console.log(result);
  });

  await literalClient.run({ name: "Test RAG Run" }).wrap(async () => {
    const result = await chain.invoke("What is the powerhouse of the cell?", {
      callbacks: [cb],
    });

    console.log(result);

    const result2 = await chain.invoke(
      "What is the air-speed velocity of an unladen swallow?",
      {
        callbacks: [cb],
      }
    );

    console.log(result2);
  });
}

main();
