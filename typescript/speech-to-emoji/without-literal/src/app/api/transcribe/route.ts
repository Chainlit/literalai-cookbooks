import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai/index.mjs";
import { ReadableStream } from "stream/web";
import { Readable } from "stream";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const formAudio = data.get("audio") as File;

  if (!formAudio) {
    return new NextResponse("No audio file provided", { status: 400 });
  }

  // Convert the file to a format that OpenAI can process
  const webmArrayBuffer = await formAudio.arrayBuffer();
  const audioFile = await toFile(webmArrayBuffer, `${formAudio.name}.webm`);
  const { text: transcribedText } = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
  });

  return Response.json({ transcribedText });
}
