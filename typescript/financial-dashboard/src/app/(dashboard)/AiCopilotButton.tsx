import { useRef, useState } from "react";

import { continueConversation } from "@/actions/continue-conversation";
import { CoreMessage } from "ai";
import { readStreamableValue } from "ai/rsc";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";

import { BarChart } from "@/components/BarChart";
import { DataTable } from "@/components/DataTable";
import { List } from "@/components/List";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  context?: unknown;
};

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

export const AiCopilotButton: React.FC<Props> = ({ context }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [threadId] = useState<string>(crypto.randomUUID());
  const [history, setHistory] = useState<Message[]>([]);

  const scrollContainer = useRef<HTMLDivElement>(null);

  const handle = async () => {
    const userMessage: Message = {
      role: "user",
      content: query,
    };
    const messages = formatMessages([...history, userMessage], context);

    setQuery("");
    setHistory([...history, userMessage]);

    const reponse = await continueConversation(messages, threadId);

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
              data: chunk.result.data,
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="size-8" title="Ask AI">
          <SparklesIcon className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <section
          ref={scrollContainer}
          className="max-h-[300px] overflow-y-auto overflow-x-hidden border-b p-1 empty:hidden"
        >
          {history.map((message, index) => (
            <div
              key={index}
              className="relative cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <h6 className="text-xs text-muted-foreground">{message.role}</h6>
              {message.content ? <p>{message.content}</p> : null}
              {message.display}
            </div>
          ))}
        </section>
        <form
          className="flex items-center gap-2 px-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            handle();
          }}
        >
          <SparklesIcon className="size-4 shrink-0 opacity-50" />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ask AI..."
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
      </PopoverContent>
    </Popover>
  );
};
