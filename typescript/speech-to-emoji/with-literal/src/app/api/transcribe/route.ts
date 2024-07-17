export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { LiteralClient } from "@literalai/client";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const literalClient = new LiteralClient();

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const formAudio = data.get("audio") as File;
  const runId = data.get("runId") as string;

  if (!formAudio) {
    return new NextResponse("No audio file provided", { status: 400 });
  }

  // Create or retrieve the thread
  const transcribedText = await literalClient
    .thread({ name: "Speech to Emoji Thread" })
    .wrap(async () => {
      // Upload the file to Literal and add it as an attachment
      const attachment = await literalClient.api.createAttachment({
        content: formAudio,
        threadId: literalClient.getCurrentThread().id,
        mime: "audio/webm",
        name: "Audio file",
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
              // This step is necessary as the OpenAI API will reject our request
              // if the file isn't properly named with a recognized extension
              const form = new FormData();
              form.append("file", formAudio, "audio.webm");

              // Call the OpenAI API to transcribe the audio
              const { text: transcribedText } =
                await openai.audio.transcriptions.create({
                  file: form.get("file") as any,
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
