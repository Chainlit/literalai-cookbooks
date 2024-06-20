"use client";

import clsx from "clsx";
import { useState } from "react";
import { AudioRecorder, useAudioRecorder } from "react-audio-voice-recorder";

export default function Home() {
  const recorderControls = useAudioRecorder();
  const [runId] = useState(crypto.randomUUID());
  const [audioUrl, setAudioUrl] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEmojifying, setIsEmojifying] = useState(false);
  const [emojifiedText, setEmojifiedText] = useState("");

  function handleAudio(audioBlob: Blob) {
    setIsTranscribing(true);
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);

    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("runId", runId);

    fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setTranscribedText(data.transcribedText);
        setIsTranscribing(false);
        setIsEmojifying(true);

        fetch("/api/emojify", {
          method: "POST",
          body: JSON.stringify({ text: data.transcribedText, runId }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            setIsEmojifying(false);
            setEmojifiedText(data.emojifiedText);
          });
      });
  }

  return (
    <main className="w-screen h-full">
      <section className="mx-auto w-10/12 md:w-1/3 h-full min-h-screen flex flex-col items-center justify-center gap-5">
        <h1 className="text-center text-4xl">Speech to Emoji 🗣️➡️🎨</h1>
        {!audioUrl && !isTranscribing && (
          <>
            <p className="font-mono">
              1️⃣ Click the 🎙️ to record a message
              <br />
              2️⃣ Click the 💾/⬛ button to save it
              <br />
              3️⃣ Get EMOJIFIED 🎉
            </p>
            <AudioRecorder
              recorderControls={recorderControls}
              classes={{
                AudioRecorderClass:
                  "!w-full !h-1/2 flex items-center justify-center !bg-green-200 mt-5",
              }}
              onRecordingComplete={handleAudio}
              audioTrackConstraints={{
                noiseSuppression: true,
                echoCancellation: true,
              }}
              showVisualizer={true}
            />
            {recorderControls.isRecording && (
              <p>Click the 💾/⬛ button when you&apos;re done ;)</p>
            )}
          </>
        )}
        {audioUrl && (
          <audio
            src={audioUrl}
            controls
            className={clsx(
              "w-full px-5 py-1 border bg-green-200 border-green-400 rounded-full",
              {
                "animate-pulse bg-orange-200 border-orange-400": isTranscribing,
              }
            )}
          />
        )}

        {(isTranscribing || transcribedText) && (
          <pre
            className={clsx(
              "border rounded-md border-red-300 mt-5 p-3 bg-red-100 text-pretty",
              {
                "animate-pulse": isEmojifying,
              }
            )}
          >
            {isTranscribing ? "Transcribing audio..." : transcribedText}
          </pre>
        )}

        {(isEmojifying || emojifiedText) && (
          <>
            <p className="text-4xl">⬇️</p>
            <pre
              className={clsx(
                "border rounded-md border-red-300 p-3 bg-red-100 text-pretty",
                {
                  "text-4xl leading-[3.5rem]": !!emojifiedText,
                  "animate-pulse": isEmojifying,
                }
              )}
            >
              {isEmojifying ? "Summarizing text..." : emojifiedText}
            </pre>{" "}
          </>
        )}

        <footer className="w-full font-mono text-right">
          Made with 💝 &{" "}
          <a
            href="https://literalai.com/"
            className="decoration-dotted underline underline-offset-4"
          >
            Literal AI
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="literal.svg"
              alt="Literal AI"
              className="w-5 h-5 inline ml-1"
            />
          </a>
        </footer>
      </section>
      <footer className="fixed bottom-3 right-3 mono">
        Want to build this app?{" "}
        <a
          href="https://github.com/Chainlit/literal-cookbook/tree/main/typescript/speech-to-emoji"
          className="decoration-dotted underline underline-offset-4"
        >
          Check out the cookbook !
        </a>
      </footer>
    </main>
  );
}
