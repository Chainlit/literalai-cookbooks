"use client";

import React, { Fragment, useState } from "react";

import {
  continueConversation,
  type Message,
} from "@/actions/continue-conversation";
import {
  runUserQuery,
  type UserQueryResult,
} from "@/actions/user-query-runner";
import { readStreamableValue } from "ai/rsc";

import { BotMessage, UserMessage } from "@/components/atoms/messages";
import { BarChart } from "@/components/BarChart";
import { List } from "@/components/List";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default function Home() {
  return <ChatVersion2 />;
}

function ChatVersion1() {
  const [query, setQuery] = useState(
    "The average total order value for all orders of each user"
  );
  const [response, setResponse] = useState<UserQueryResult>();

  return (
    <main>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const response = await runUserQuery(query);
          setResponse(response);
        }}
      >
        <input
          type="text"
          name="query"
          className="border"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <button type="submit">Run</button>
      </form>

      {response ? (
        <>
          <hr />

          <code>
            <pre>{response.query}</pre>
          </code>

          <hr />

          <code>
            <pre>{JSON.stringify(response.result, null, 2)}</pre>
          </code>
        </>
      ) : null}
    </main>
  );
}

function ChatVersion2() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  return (
    <>
      {conversation.map((message, index) => (
        <Fragment key={index}>
          {message.role === "user" ? (
            <UserMessage className="mb-2">{message.content}</UserMessage>
          ) : null}
          {message.role === "assistant" ? (
            <BotMessage className="mb-2">
              {message.content}
              {message.display}
            </BotMessage>
          ) : null}
        </Fragment>
      ))}

      <form
        className="mt-4 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();

          const reponse = await continueConversation([
            // exclude React components from being sent back to the server:
            ...conversation.map(({ display, ...message }) => message),
            { role: "user", content: input },
          ]);

          const components = [List, Table, BarChart];

          setInput("");
          setConversation(() => [
            ...conversation,
            { role: "user", content: input },
          ]);

          let content = "";
          let display: React.ReactNode = null;
          let data: any = undefined;
          for await (const chunk of readStreamableValue(reponse)) {
            switch (chunk?.type) {
              case "text": {
                content += chunk.delta;
                break;
              }
              case "component": {
                data = chunk.data;
                const Component = components.find(
                  (component) => component.name === chunk.name
                );
                if (Component) {
                  display = <Component {...chunk.props} />;
                }
                break;
              }
            }
            setConversation(() => [
              ...conversation,
              { role: "user", content: input },
              { role: "assistant", content, display, data },
            ]);
          }
        }}
      >
        <Input
          className="flex-1"
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />
        <Button type="submit">Send Message</Button>
      </form>
    </>
  );
}
