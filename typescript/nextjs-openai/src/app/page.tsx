"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";

const Badge = ({ message }: { message: Message }) => {
  if (message.role === "user") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        fill="currentColor"
        className="size-4"
      >
        <path d="M230.92 212c-15.23-26.33-38.7-45.21-66.09-54.16a72 72 0 1 0-73.66 0c-27.39 8.94-50.86 27.82-66.09 54.16a8 8 0 1 0 13.85 8c18.84-32.56 52.14-52 89.07-52s70.23 19.44 89.07 52a8 8 0 1 0 13.85-8ZM72 96a56 56 0 1 1 56 56 56.06 56.06 0 0 1-56-56Z"></path>
      </svg>
    );
  }

  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
    >
      <title>OpenAI icon</title>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
    </svg>
  );
};

export default function Home() {
  const [threadId] = useState(crypto.randomUUID());
  const [upvotedMessages, setUpvotedMessages] = useState<string[]>([]);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "api/chat",
    body: { threadId },
    onFinish: (message) => {
      fetch("api/register-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message, messagesHistory: messages }),
      });
    },
    // This option will make `useChat` generate a UUID for each message which is a valid Literal Step ID
    generateId: () => crypto.randomUUID(),
  });

  const handleScore = (message: Message, upvote: boolean) => {
    fetch("api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: message.id, score: upvote ? 1 : 0 }),
    }).then(() => {
      if (upvote) {
        setUpvotedMessages([...upvotedMessages, message.id]);
      }
    });
  };

  return (
    <main className="min-h-screen">
      <section className="mx-auto sm:max-w-2xl sm:px-4 pb-[100px] pt-4 md:pt-10 divide-y divide-gray-400">
        {messages.map((message) => (
          <article
            key={message.id}
            className="flex justify-between gap-2 relative p-4 md:px-0"
          >
            <div>
              <div className="md:absolute shrink-0 flex items-center justify-center rounded-full size-6 top-4 -left-10 border border-gray-500">
                <Badge message={message} />
              </div>
              <div>{message.content}</div>
            </div>
            {message.role === "assistant" && (
              <button
                onClick={() => handleScore(message, true)}
                disabled={upvotedMessages.includes(message.id)}
                className={
                  upvotedMessages.includes(message.id) ? "" : "grayscale"
                }
              >
                👍
              </button>
            )}
          </article>
        ))}
      </section>

      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 mx-auto sm:max-w-2xl sm:px-4"
      >
        <div className="bg-gray-300 border-gray-400 text-gray-800 border-t px-4 py-2 sm:py-4 shadow-lg sm:rounded-t-xl sm:border-x">
          <div className="border-gray-500 bg-gray-200 relative flex max-h-60 w-full grow items-center overflow-hidden sm:rounded-md sm:border">
            <input
              placeholder="Send a message."
              className="focus-within:outline-none min-h-[60px] px-4 py-[1.3rem] resize-none sm:text-sm w-full"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              name="prompt"
              value={input}
              onChange={handleInputChange}
              id="input"
            />
            <button
              className="mr-3 shrink-0 inline-flex items-center justify-center  hover:bg-gray-300/90 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 size-9"
              type="submit"
              disabled={!input}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                fill="currentColor"
                className="size-4"
              >
                <path d="M200 32v144a8 8 0 0 1-8 8H67.31l34.35 34.34a8 8 0 0 1-11.32 11.32l-48-48a8 8 0 0 1 0-11.32l48-48a8 8 0 0 1 11.32 11.32L67.31 168H184V32a8 8 0 0 1 16 0Z"></path>
              </svg>
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
