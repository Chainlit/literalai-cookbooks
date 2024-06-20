"use client";

import { useEffect } from "react";

import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useAiCopilotContext } from "./AiCopilotProvider";

type Props = {
  context?: unknown;
  onActiveChange?: (active: boolean) => void;
  small?: boolean;
};

export const AiCopilotButton: React.FC<Props> = ({
  context,
  onActiveChange,
  small = false,
}) => {
  const {
    setOpen,
    open,
    setContext,
    context: currentContext,
    active: isAiCopilotActive,
  } = useAiCopilotContext();

  const active =
    open && JSON.stringify(currentContext) === JSON.stringify(context);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active]);

  const handleClick = () => {
    setContext(context);
    if (!open) setOpen(true);
  };

  if (!isAiCopilotActive) return null;

  if (small) {
    return (
      <Button
        size="icon"
        variant={active ? "default" : "outline"}
        className={cn(
          "size-8",
          active
            ? "bg-blue-500 hover:bg-blue-600"
            : "text-blue-500 hover:text-blue-600"
        )}
        title="Ask AI"
        onClick={handleClick}
      >
        <SparklesIcon className="size-5" />
      </Button>
    );
  } else {
    return (
      <Button
        variant={active ? "default" : "outline"}
        className={cn(
          "flex items-center gap-2",
          active
            ? "bg-blue-500 hover:bg-blue-600"
            : "text-blue-500 hover:text-blue-600"
        )}
        onClick={handleClick}
      >
        <SparklesIcon className="size-5" />
        Ask AI
      </Button>
    );
  }
};
