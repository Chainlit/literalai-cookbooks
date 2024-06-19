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
    const {
      data: [{ embedding }],
    } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const results = await index.namespace("articles").query({
      topK: top_k,
      vector: embedding,
      includeMetadata: true,
    });

    const ids = map(results.matches, "id");
    const documents = map(results.matches, "metadata.text");

    await run
      .step({
        type: "retrieval",
        name: "Arch-wiki retrieval",
        input: { question, top_k },
        output: { fetchedDocuments: ids },
      })
      .send();

    return { ids, documents };
  },
});
