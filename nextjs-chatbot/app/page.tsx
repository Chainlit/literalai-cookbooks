"use client";

import { useChat } from "ai/react";
import { useState } from "react";

export default function Chat() {
  const [threadId] = useState(crypto.randomUUID());
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { threadId },
  });

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}>
          {m.role === "user" ? "User: " : "AI: "}
          {m.content}
        </p>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
