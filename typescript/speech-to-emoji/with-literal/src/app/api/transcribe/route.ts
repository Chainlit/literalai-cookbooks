export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import {
  Attachment,
  IGenerationMessage,
  LiteralClient,
} from "@literalai/client";
import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { ReadableStream } from "stream/web";
import { Readable } from "stream";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const literalClient = new LiteralClient();

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const formAudio = data.get("audio") as File;
  const runId = data.get("runId") as string;

  if (!formAudio) {
    return new NextResponse("No audio file provided", { status: 400 });
  }

  // This is necessary to convert the Blob to a ReadableStream that can be uploaded to Literal
  const nodeStream = Readable.fromWeb(
    formAudio.stream() as ReadableStream<any>
  );

  // Create or retrieve the thread
  const transcribedText = await literalClient
    .thread({ name: "Speech to Emoji Thread" })
    .wrap(async () => {
      // Upload the file to Literal and add it as an attachment
      const { objectKey } = await literalClient.api.uploadFile({
        content: nodeStream,
        threadId: literalClient.getCurrentThread().id,
        mime: "audio/webm",
      });
      const attachment = new Attachment({
        name: "Audio file",
        objectKey,
        mime: "audio/webm",
      });

      // Wrap the transcription in the run
      return literalClient
        .run({
          id: runId,
          name: "Speech to Emoji",
          input: {
            input: { content: "Audio file" },
            attachments: [attachment],
          },
        })
        .wrap(async () => {
          // Create a step for the transcription
          const transcribedText = await literalClient
            .step({
              type: "llm",
              name: "whisper-1",
              input: { role: "user", content: "See attached audio file" },
              attachments: [attachment],
            })
            .wrap(async () => {
              // Convert the file to a format that OpenAI can process
              const webmArrayBuffer = await formAudio.arrayBuffer();
              const audioFile = await toFile(
                webmArrayBuffer,
                `${formAudio.name}.webm`
              );

              // Call the OpenAI API to transcribe the audio
              const { text: transcribedText } =
                await openai.audio.transcriptions.create({
                  file: audioFile,
                  model: "whisper-1",
                  language: "en",
                });

              literalClient.getCurrentStep().output = {
                role: "assistant",
                content: transcribedText,
              };
              literalClient.getCurrentStep().generation = {
                type: "CHAT",
                provider: "openai",
                model: "whisper-1",
                messages: [
                  { role: "user", content: "See attached audio file" },
                ],
                messageCompletion: {
                  role: "assistant",
                  content: transcribedText,
                },
              };

              return transcribedText;
            });

          literalClient.getCurrentStep().endTime = new Date().toISOString();

          return transcribedText;
        });
    });

  return Response.json({ transcribedText });
}
