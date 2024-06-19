import { encode } from "gpt-tokenizer";
import { downloadFile } from "@huggingface/hub";
import "dotenv/config";

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index("arch-wiki");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const TOKEN_LIMIT = 8_192;
const byteLimit = 40_000;

async function loadDataset() {
  try {
    const datasetFile = await downloadFile({
      repo: "datasets/Dam-Buty/arch-wiki",
      path: "sections.jsonl", // Replace with the specific file path
      credentials: { accessToken: process.env.HF_API_TOKEN! },
    });

    if (!datasetFile) {
      throw new Error("Dataset file not found.");
    }

    const datasetContent = await datasetFile.text();

    const sections = datasetContent.split("\n").map((line) => JSON.parse(line));

    return sections;
  } catch (error) {
    console.error("Error loading dataset:", error);
  }
}

function trimText(text: string) {
  const encoder = new TextEncoder();
  const textSize = encoder.encode(text).length;

  if (textSize <= byteLimit) {
    return text;
  }

  let trimmedStr = "";
  let size = 0;

  for (let char of text) {
    const charSize = encoder.encode(char).length;
    if (size + charSize > byteLimit) {
      break;
    }
    trimmedStr += char;
    size += charSize;
  }

  return trimmedStr;
}

async function ingest() {
  const sections = await loadDataset();

  if (!sections) {
    throw new Error("Couldn't import the dataset.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("🚨 OPENAI_API_KEY environment variable is required.");
  }

  for (const section of sections) {
    console.log("📜 Adding document:", section.title, section.section);

    const tokens = encode(section.content);

    if (tokens.length >= TOKEN_LIMIT) {
      console.log("🚨 Skipping document : it is too large to be embedded");
      continue;
    }

    // the title should only contain ascii characters
    const id = [section.title, section.section]
      .join(" - ")
      .replace(/[^\x00-\x7F]/g, "");

    const existingDocument = await index.namespace("articles").fetch([id]);

    if (id in existingDocument.records) {
      console.log("🏃 Skipping document : it already exists in the index");
      continue;
    }

    const {
      data: [{ embedding }],
    } = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: section.content,
    });

    await index.namespace("articles").upsert([
      {
        id,
        values: embedding,
        metadata: { text: trimText(section.content) },
      },
    ]);
  }
}

ingest()
  .then(() => {
    console.log("Ingestion complete.");
  })
  .catch((err) => {
    console.error("Ingestion failed:", err);
  });
