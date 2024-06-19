"use client";

import clsx from "clsx";
import { useState } from "react";
import { AudioRecorder } from "react-audio-voice-recorder";

export default function Home() {
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
      <section className="m-auto w-1/4 h-full min-h-screen flex flex-col items-center justify-center gap-5">
        {!audioUrl && !isTranscribing && (
          <>
            <p className="font-mono">
              1️⃣ Click the 🎙️ to record a message
              <br />
              2️⃣ Click the 💾 button to save it
              <br />
              3️⃣ Get EMOJIFIED 🎉
            </p>
            <AudioRecorder
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
        {isTranscribing && <p>Transcribing...</p>}

        {transcribedText && (
          <pre
            className={clsx(
              "border rounded-md border-red-300 mt-5 p-3 bg-red-100 text-pretty",
              {
                "text-4xl leading-[3.5rem]": !!emojifiedText,
                "animate-pulse": isEmojifying,
              }
            )}
            title={transcribedText}
          >
            {emojifiedText ? emojifiedText : transcribedText}
          </pre>
        )}
      </section>
      <footer className="fixed top-0 left-0 font-mono">
        Made with 💝 by the fine people @{" "}
        <a href="https://literalai.com/">Literal AI</a>
      </footer>
    </main>
  );
}
