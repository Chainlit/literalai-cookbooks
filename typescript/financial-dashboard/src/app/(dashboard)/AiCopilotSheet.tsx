import { useRef, useState } from "react";

import { continueConversationWithData } from "@/actions";
import { CoreMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { ArrowRightIcon } from "lucide-react";

import { BarChart } from "@/components/BarChart";
import { DataTable } from "@/components/DataTable";
import { List } from "@/components/List";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const { open, setOpen, context } = useAiCopilotContext();

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

    const botMessages: Message[] = [];
    for await (const chunk of readStreamableValue(reponse)) {
      switch (chunk?.type) {
        case "text-delta": {
          const lastMessage = botMessages[botMessages.length - 1];
          if (lastMessage?.content != null) {
            botMessages[botMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + chunk.textDelta,
            };
          } else {
            botMessages.push({
              role: "assistant",
              content: chunk.textDelta,
            });
          }
          break;
        }
        case "tool-result": {
          const components = [List, DataTable, BarChart];
          const Component = components.find(
            (component) => component.name === chunk.result.name
          );
          if (Component) {
            botMessages.push({
              role: "assistant",
              data: chunk.result,
              display: <Component {...(chunk.result.props as any)} />,
            });
          }
          break;
        }
      }
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
            className="flex items-center gap-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              handle();
            }}
          >
            <Input
              placeholder="Ask AI..."
              className="h-7 flex-1"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
            />
            <Button
              type="submit"
              variant="secondary"
              size="icon"
              className="size-7 shrink-0 rounded-full"
            >
              <ArrowRightIcon className="size-4 shrink-0" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};
