"use client";

import { useChat } from "@ai-sdk/react";
import { JSONValue } from "@ai-sdk/ui-utils";
import { useEffect, useState } from "react";

// This method is used to narrow down the type of the dataFrame object
// from JSONValue to a more specific type that we can work with.
const isValidDataFrame = (
  dataFrame: JSONValue | undefined
): dataFrame is { stepId: string } => {
  if (!dataFrame) return false;
  if (typeof dataFrame !== "object") return false;
  if (Array.isArray(dataFrame)) return false;

  return typeof dataFrame.stepId === "string";
};

export default function Home() {
  // When creating IDs for use in Literal, use crypto.randomUUID
  const [threadId] = useState(crypto.randomUUID());
  const [messageIdMapping, setMessageIdMapping] = useState<{
    [messageId: string]: string;
  }>({});
  // This state will store the IDs of the messages that the user has upvoted.
  const [upvotedMessages, setUpvotedMessages] = useState<string[]>([]);

  // useChat is a very helpful function that will handle the streaming
  // communication with the server and hold all necessary states.
  const { messages, data, input, handleInputChange, handleSubmit } = useChat({
    api: "api/chat",
    // Here we attach the thread ID so that it is accessible from our
    // API route
    body: { threadId },
  });

  // Whenever we receive data from useChat, we will try to map it to a message ID
  // in the messages history. This way we can associate the message with the step ID.
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    const dataFrame = data?.[0];

    if (!latestMessage || !dataFrame) return;

    if (isValidDataFrame(dataFrame)) {
      // Store the mapping between the message ID returned by `useChat` and the step ID returned by Literal AI
      setMessageIdMapping((prev) => ({
        ...prev,
        [latestMessage.id]: dataFrame.stepId,
      }));
    }
  }, [data, messages]);

  const handleScore = ({
    messageId,
    stepId,
    upvote,
  }: {
    messageId: string;
    stepId: string;
    upvote: boolean;
  }) => {
    fetch("api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, score: upvote ? 1 : 0 }),
    }).then(() => {
      if (upvote) {
        // Add the message ID to the list of upvoted messages
        setUpvotedMessages([...upvotedMessages, messageId]);
      }
    });
  };

  return (
    <main className="min-h-screen">
      <section className="mx-auto w-2/3 mt-10">
        {messages.map((message) => {
          const stepId = messageIdMapping[message.id];

          return (
            <article key={message.id} className="flex gap-3 my-3">
              <div className="border border-gray-500 p-1">
                {message.role === "user" ? "🧑‍💻" : "🤖"}
              </div>
              <div className="flex-1">{message.content}</div>
              {/* To avoid double scoring a chatbot's response, we will add
                a visual cue to already upvoted messages, and disable their
                scoring button */}
              {!!stepId && (
                <button
                  onClick={() =>
                    handleScore({ messageId: message.id, stepId, upvote: true })
                  }
                  disabled={upvotedMessages.includes(message.id)}
                  className={
                    upvotedMessages.includes(message.id) ? "" : "grayscale"
                  }
                >
                  👍
                </button>
              )}
            </article>
          );
        })}
      </section>

      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 mx-auto"
      >
        <div className="px-4 py-2">
          <div className="flex gap-2 w-2/3 mx-auto border border-gray-600 rounded-md">
            <input
              placeholder="Send a message."
              className="flex-1 p-2 rounded-md"
              autoComplete="off"
              value={input}
              onChange={handleInputChange}
            />
            <button
              className="bg-gray-300 rounded-md"
              type="submit"
              disabled={!input}
            >
              <span className="p-2">Send message</span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
