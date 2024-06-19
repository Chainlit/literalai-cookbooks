import { useRef, useState } from "react";

import { continueConversationWithData } from "@/actions";
import { CoreMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { ArrowRightIcon, CornerDownRightIcon } from "lucide-react";

import { BarChart } from "@/components/BarChart";
import { DataTable } from "@/components/DataTable";
import { List } from "@/components/List";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

import { useAiCopilotContext } from "./AiCopilotProvider";

type Message = {
  role: "user" | "assistant" | "system";
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

export const AiCopilotSheet: React.FC = () => {
  const { open, setOpen, context, setContext } = useAiCopilotContext();

  const contextLabel =
    context instanceof Object && "label" in context
      ? String(context.label)
      : null;

  const [threadId] = useState<string>(crypto.randomUUID());
  const [history, setHistory] = useState<Message[]>([]);
  const [query, setQuery] = useState("");

  const scrollContainer = useRef<HTMLDivElement>(null);

  const handle = async () => {
    const userMessage: Message = {
      role: "user",
      content: query,
    };
    const messages = formatMessages([...history, userMessage], context);

    setQuery("");
    setHistory([...history, userMessage]);

    const reponse = await continueConversationWithData(messages, threadId);

    for await (const chunk of readStreamableValue(reponse)) {
      const botMessages: Message[] = (chunk ?? []).map((item) => {
        switch (item.type) {
          case "text":
            return {
              role: "assistant",
              content: item.content,
            };
          case "loading":
            return {
              role: "assistant",
              display: <>Loading...</>,
            };
          case "component": {
            const components = [List, DataTable, BarChart];
            const Component = components.find(
              (component) => component.name === item.name
            );
            if (Component) {
              return {
                role: "assistant",
                data: `Display component ${item.name}`,
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

  const [container, setContainer] = useState<HTMLElement>();

  return (
    <>
      <div ref={(el) => setContainer(el!)} />
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent
          portalContainer={container}
          className="relative flex h-[calc(100vh_-_theme(spacing.16))] w-full flex-col"
        >
          <section
            ref={scrollContainer}
            className="w-72 flex-1 overflow-y-auto overflow-x-hidden"
          >
            {history.map((message, index) => (
              <div
                key={index}
                className="relative cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <h6 className="text-xs text-muted-foreground">
                  {message.role}
                </h6>
                {message.content ? <p>{message.content}</p> : null}
                {message.display}
              </div>
            ))}
          </section>

          <form
            className="relative flex shrink-0 flex-col items-center"
            onSubmit={(ev) => {
              ev.preventDefault();
              handle();
            }}
          >
            {contextLabel ? (
              <p className="flex h-7 w-full shrink-0 items-center gap-1 rounded-t-md bg-blue-50 px-3 text-xs text-blue-600">
                <CornerDownRightIcon className="size-3" /> With {contextLabel}
              </p>
            ) : null}
            <Input
              placeholder="Ask AI..."
              className={cn("block h-8", contextLabel ? "rounded-t-none" : "")}
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute bottom-1 right-2 size-6 shrink-0 rounded-full"
            >
              <ArrowRightIcon className="size-4 shrink-0" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};
