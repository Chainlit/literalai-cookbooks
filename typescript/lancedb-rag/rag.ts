import fs from "node:fs";
import { OpenAIEmbeddingFunction, connect, type Connection } from "vectordb";

const DATA_URL = `https://datasets-server.huggingface.co/rows?dataset=jamescalam%2Fyoutube-transcriptions&config=default&split=train&offset=0&length=100`;

const RAW_DATA_PATH = "data/raw-data.json";

type RawRow = {
  id: string;
  title: string;
  published: string;
  url: string;
  video_id: string;
  channel_id: string;
  text: string;
  start: number;
  end: number;
};

/**
 * Get raw data
 * Download them if from the Hugging Face Datasets server
 * Then store locally for latter use.
 */
export const getRawData = async (): Promise<{ rows: { row: RawRow }[] }> => {
  if (fs.existsSync(RAW_DATA_PATH)) {
    const rawData = fs.readFileSync(RAW_DATA_PATH, "utf8");
    return JSON.parse(rawData);
  }
  const response = await fetch(DATA_URL);
  const content = await response.text();
  fs.writeFileSync(RAW_DATA_PATH, content, "utf8");
  return JSON.parse(content);
};

/**
 * Create the embeddings table
 */
export const createEmbeddingsTable = async (
  db: Connection,
  embedFunction: OpenAIEmbeddingFunction
) => {
  // read the input file into a JSON array
  const rawData = await getRawData();
  const lines = rawData.rows.map((r) => r.row);
  const data = contextualize(lines, 20, "video_id");
  return await db.createTable("vectors", data, embedFunction);
};

/**
 * Each transcript has a small text column, we include previous transcripts in order to
 * have more context information when creating embeddings
 */
export const contextualize = (
  rows: RawRow[],
  contextSize: number,
  groupColumn: keyof RawRow
) => {
  const grouped: Record<string, RawRow[]> = {};
  rows.forEach((row) => {
    if (!grouped[row[groupColumn]]) {
      grouped[row[groupColumn]] = [];
    }
    grouped[row[groupColumn]].push(row);
  });

  const data = Object.keys(grouped).flatMap((key) =>
    grouped[key].map((row, i) => {
      const start = i - contextSize > 0 ? i - contextSize : 0;
      const context = grouped[key]
        .slice(start, i + 1)
        .map((r) => r.text)
        .join(" ");
      return { ...row, context };
    })
  );
  return data;
};

/**
 * Get the embeddings table
 * Create it if it does not exist
 */
export const getEmbeddingsTable = async (apiKey: string) => {
  // Connects to LanceDB
  const db = await connect("data/youtube-lancedb");

  // The embedding function will create embeddings for the 'context' column
  const embedFunction = new OpenAIEmbeddingFunction("context", apiKey);

  // Open the vectors table or create one if it does not exist
  if ((await db.tableNames()).includes("vectors")) {
    return await db.openTable("vectors", embedFunction);
  } else {
    return await createEmbeddingsTable(db, embedFunction);
  }
};

/**
 * Create a prompt by aggregating all relevant contexts
 */
export const createPrompt = (query: string, context: { context: string }[]) => {
  let prompt =
    "Answer the question based on the context below.\n\n" +
    "Context:\n" +
    context
      .map((c) => c.context)
      .join("\n\n---\n\n")
      .substring(0, 3750);
  prompt = prompt + `\n\nQuestion: ${query}\nAnswer:`;
  return prompt;
};
