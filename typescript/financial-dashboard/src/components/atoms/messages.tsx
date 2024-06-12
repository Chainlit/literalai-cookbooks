import { BotIcon, UserIcon } from "lucide-react";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";

type UserMessageProps = {
  children: React.ReactNode;
  className?: string;
};

export const UserMessage: React.FC<UserMessageProps> = ({
  children,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center gap-1 pb-1 text-sm text-muted-foreground">
        <UserIcon className="size-4" />
        User
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

type BotMessageProps = {
  children: React.ReactNode;
  className?: string;
  onExplain?: () => void;
};

export const BotMessage: React.FC<BotMessageProps> = ({
  children,
  className,
  onExplain,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center gap-1 pb-1 text-sm text-muted-foreground">
        <BotIcon className="size-4" />
        Bot
        {onExplain ? (
          <>
            <span className="flex-1" />
            <Button size="sm" onClick={onExplain}>
              Explain
            </Button>
          </>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
