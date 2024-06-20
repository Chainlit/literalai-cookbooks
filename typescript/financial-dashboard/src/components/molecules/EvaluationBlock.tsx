import { useState } from "react";

import { evaluateRun } from "@/actions";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";

type Props = {
  runId: string;
};

export const EvaluationBlock: React.FC<Props> = ({ runId }) => {
  const [score, setScore] = useState(0);

  const evaluate = async (runId: string, value: number) => {
    try {
      await evaluateRun(runId, value);
      setScore(value);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="absolute right-1 top-1 space-x-1">
      <Button
        size="icon"
        variant="ghost"
        className={cn("size-4", score === -1 ? "" : "opacity-20")}
        onClick={() => evaluate(runId, -1)}
      >
        <ThumbsDownIcon className="size-3" />
        <span className="sr-only">Evaluate Bad</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className={cn("size-4", score === +1 ? "" : "opacity-20")}
        onClick={() => evaluate(runId, +1)}
      >
        <ThumbsUpIcon className="size-3" />
        <span className="sr-only">Evaluate Good</span>
      </Button>
    </div>
  );
};
