"use client";

import { useEffect, useRef, useState } from "react";

import { continueConversationWithData } from "@/actions";
import { CoreMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { ArrowRightIcon, CornerDownRightIcon, XIcon } from "lucide-react";

import { DataBarChart } from "@/components/atoms/DataBarChart";
import { DataList } from "@/components/atoms/DataList";
import { DataTable } from "@/components/atoms/DataTable";
import { EvaluationBlock } from "@/components/molecules/EvaluationBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import { useAiCopilotContext } from "./AiCopilotProvider";

type Message = {
  role: "user" | "assistant" | "system";
  runId?: string;
  content?: string;
  display?: React.ReactNode;
  data?: unknown;
};

const formatMessages = (
  messages: Message[],
  context?: unknown
): CoreMessage[] => {
  const formatted: CoreMessage[] = [];
  for (const message of messages) {
    if (message.content) {
      formatted.push({
        role: message.role,
        content: message.content,
      });
    }
    if (message.data) {
      formatted.push({
        role: "system",
        content: `With data:\n${JSON.stringify(message.data)}`,
      });
    }
  }
  if (context) {
    formatted.push({
      role: "system",
      content: `With context:\n${JSON.stringify(context)}`,
    });
  }
  return formatted;
};

const SampleQuestions = [
  "Can you explain this context?",
  "What products sell the most?",
  "Who is our best client?",
];

export const AiCopilotSheet: React.FC = () => {
  const { open, setOpen, context, setContext, setActive } =
    useAiCopilotContext();

  useEffect(() => {
    console.log("AiCopilotSheet mounted");
    // Declare that there is an active AI Copilot
    setActive(true);
    // Unset active AI Copilot when component unmounts
    return () => {
      setActive(false);
    };
  }, [setActive]);

  const contextLabel =
    context instanceof Object && "label" in context
      ? String(context.label)
      : null;

  const [threadId] = useState<string>(crypto.randomUUID());
  const [history, setHistory] = useState<Message[]>([]);
  const [query, setQuery] = useState("");

  const scrollContainer = useRef<HTMLDivElement>(null);

  const handle = async (content = query) => {
    const userMessage: Message = {
      role: "user",
      content,
    };
    const messages = formatMessages([...history, userMessage], context);

    setQuery("");
    setHistory([...history, userMessage]);

    const reponse = await continueConversationWithData(messages, threadId);

    for await (const chunk of readStreamableValue(reponse)) {
      // TODO: fix the runId issue
      // item.runId is undefined
      let tempRunId = "11111";

      const botMessages: Message[] = (chunk ?? []).map((item) => {
        console.log("botMessages");
        console.log(item);
        switch (item.type) {
          case "text":
            return {
              role: "assistant",
              content: item.content,
              runId: tempRunId,
            };
          case "loading":
            return {
              role: "assistant",
              display: <>Loading...</>,
            };
          case "component": {
            const components = [DataList, DataTable, DataBarChart];
            const Component = components.find(
              (component) => component.name === item.name
            );
            if (Component) {
              return {
                role: "assistant",
                data: `Display component ${item.name}`,
                runId: tempRunId,
                display: (
                  <Component
                    {...(item.props as any)}
                    onContextChange={setContext}
                  />
                ),
              };
            } else {
              return {
                role: "assistant",
                content: `Component ${item.name} not found`,
                runId: tempRunId,
              };
            }
          }
        }
      });
      setHistory([...history, userMessage, ...botMessages]);
      scrollContainer.current?.scrollTo({
        top: scrollContainer.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <SoftSheet open={open} setOpen={setOpen}>
      <section
        ref={scrollContainer}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {history.map((message, index) => (
          <div
            key={index}
            className="relative cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <h6 className="text-xs text-muted-foreground">{message.role}</h6>
            {message.runId ? <EvaluationBlock runId={message.runId} /> : null}
            {message.content ? (
              <p className="whitespace-break-spaces">{message.content}</p>
            ) : null}
            {message.display}
          </div>
        ))}
      </section>

      {history.length < 1 && query.length < 1 ? (
        <section className="space-y-2">
          {SampleQuestions.map((question) => (
            <Button
              key={question}
              size="sm"
              variant="outline"
              className="border-dashed border-slate-300 text-slate-600 dark:border-zinc-700 dark:text-zinc-300"
              onClick={() => handle(question)}
            >
              {question}
            </Button>
          ))}
        </section>
      ) : null}

      {history.length > 0 ? (
        <Button
          size="sm"
          variant="link"
          className="h-5 self-start text-xs opacity-50"
          onClick={() => setHistory([])}
        >
          Clear
        </Button>
      ) : null}

      <form
        className="relative flex shrink-0 flex-col items-center"
        onSubmit={(ev) => {
          ev.preventDefault();
          handle();
        }}
      >
        {contextLabel ? (
          <p className="flex h-7 w-full shrink-0 items-center gap-1 rounded-t-md bg-rose-50 px-3 text-xs text-rose-600 dark:bg-rose-900 dark:text-rose-100">
            <CornerDownRightIcon className="size-3" /> With {contextLabel}
            <span className="flex-1"></span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-5 rounded-full hover:bg-rose-500/10 hover:text-rose-700"
              onClick={() => setContext(null)}
            >
              <XIcon className="size-3" />
            </Button>
          </p>
        ) : null}
        <Input
          placeholder="Ask AI..."
          className={cn("block", contextLabel ? "rounded-t-none" : "")}
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute bottom-2 right-2 size-6 shrink-0 rounded-full"
        >
          <ArrowRightIcon className="size-4 shrink-0" />
        </Button>
      </form>
      <p className="text-center text-xs opacity-50">
        <strong>Disclaimer:</strong>
        This is just a demo. It may behave unexpectedly.
      </p>
    </SoftSheet>
  );
};

type SoftSheetProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  children?: React.ReactNode;
};

const SoftSheet: React.FC<SoftSheetProps> = ({ open, setOpen, children }) => (
  <div
    data-state={open ? "open" : "closed"}
    className="relative transition-all ease-in-out data-[state=closed]:w-0 data-[state=open]:w-96 data-[state=closed]:duration-300 data-[state=open]:duration-500"
  >
    <div
      data-state={open ? "open" : "closed"}
      className="absolute inset-y-0 left-0 right-0 top-0 flex h-full w-96 flex-col gap-4 border-l bg-background p-6 shadow-lg transition-all ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500"
    >
      {children}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
      >
        <XIcon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  </div>
);
