"use client";

import { useChat } from "ai/react";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

export default function Chat() {
  const [threadId] = useState(uuid());
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { threadId },
  });

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id} >
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
