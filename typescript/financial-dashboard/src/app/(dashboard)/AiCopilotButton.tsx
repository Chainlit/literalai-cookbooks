import { useEffect } from "react";

import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useAiCopilotContext } from "./AiCopilotProvider";

type Props = {
  context?: unknown;
  onActiveChange?: (active: boolean) => void;
};

export const AiCopilotButton: React.FC<Props> = ({
  context,
  onActiveChange,
}) => {
  const {
    setOpen,
    open,
    setContext,
    context: currentContext,
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

  return (
    <Button
      size="icon"
      variant={active ? "default" : "outline"}
      className={cn("size-8", active ? "bg-blue-500 hover:bg-blue-600" : "")}
      title="Ask AI"
      onClick={handleClick}
    >
      <SparklesIcon className="size-5" />
    </Button>
  );
};
