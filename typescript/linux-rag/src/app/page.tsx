"use client";

import { useChat } from "@ai-sdk/react";
import { capitalize } from "lodash";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [threadId] = useState(crypto.randomUUID());
  const [runId, setRunId] = useState(crypto.randomUUID());

  // useChat is a very helpful function that will handle the streaming
  // communication with the server and hold all necessary states.
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "api/chat",
    maxToolRoundtrips: 3,
    body: { threadId, runId },
  });

  return (
    <main className="min-h-screen">
      <section className="mx-auto w-2/3 mt-10 mb-16">
        {messages.map((message) => (
          <article key={message.id} className="flex gap-3 my-3">
            {message.toolInvocations?.length && (
              <div className="border border-green-400 p-2">
                {message.toolInvocations.map((toolInvocation) => (
                  <div key={toolInvocation.toolCallId}>
                    {!("result" in toolInvocation) && (
                      <span>
                        🔧 Using tool {toolInvocation.toolName} :{" "}
                        <i>{toolInvocation.args.question}</i>
                      </span>
                    )}
                    &nbsp;
                    {"result" in toolInvocation && (
                      <>
                        <span className="tool">
                          🚛 Tool <b>{capitalize(toolInvocation.toolName)}</b>{" "}
                          returned&nbsp;
                          <b>{toolInvocation.result.ids.length}</b>
                          &nbsp;result(s) for query{" "}
                          <i>{toolInvocation.args.question}</i>.
                        </span>

                        <div className="tooltip absolute right-2 -mt-16 bg-green-200 p-3 rounded-md">
                          <p className=" font-bold">
                            The following results were used for this response :
                          </p>
                          <ul className="list-disc list-inside">
                            {toolInvocation.result.ids.map((id: string) => (
                              <li key={id}>{id}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!message.toolInvocations?.length && (
              <>
                <div className="border border-gray-500 p-1">
                  {message.role === "user" ? "🧑‍💻" : "🤖"}
                </div>
                <div className="ml-2 p-2">
                  <ReactMarkdown className="prose">
                    {message.content}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </article>
        ))}
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
              onChange={(event) => {
                // We create a new run for each new user message
                setRunId(crypto.randomUUID());
                handleInputChange(event);
              }}
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
