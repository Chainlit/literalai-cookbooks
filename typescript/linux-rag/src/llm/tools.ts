import { CoreTool } from "ai";
import { z } from "zod";
import "dotenv/config";
import { Step } from "@literalai/client";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { map } from "lodash";

const DOCUMENTS_TABLE = "documents";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index("arch-wiki");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const getRagTool = (run: Step): CoreTool => ({
  description:
    "Retrieves great content to answer questions about Linux system setup and maintenance",
  parameters: z.object({
    question: z.string(),
    top_k: z
      .number()
      .optional()
      .describe(
        "Number of documents to retrieve. Minimum 10 for good results."
      ),
  }),
  execute: async ({ question, top_k = 5 }) => {
    const toolStep = await run
      .step({
        type: "tool",
        name: "Document retrieval tool",
        input: { question, top_k },
        startTime: new Date().toISOString(),
      })
      .send();

    const startEmbedding = new Date();

    const {
      data: [{ embedding }],
    } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    await toolStep
      .step({
        type: "embedding",
        name: "Embedding user query",
        metadata: { model: "text-embedding-3-small" },
        input: { question },
        startTime: startEmbedding.toISOString(),
        endTime: new Date().toISOString(),
      })
      .send();

    const startRetrieving = new Date();

    const results = await index.namespace("articles").query({
      topK: top_k,
      vector: embedding,
      includeMetadata: true,
    });

    const ids = map(results.matches, "id");
    const documents = map(results.matches, "metadata.text");

    await toolStep
      .step({
        type: "retrieval",
        name: "Retrieving relevant documents",
        input: { question, top_k },
        output: { fetchedDocuments: ids },
        startTime: startRetrieving.toISOString(),
        endTime: new Date().toISOString(),
      })
      .send();

    toolStep.endTime = new Date().toISOString();
    toolStep.output = { ids, documents };
    toolStep.send();

    return { ids, documents };
  },
});
