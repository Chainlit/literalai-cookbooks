import { createContext, useContext, useMemo, useState } from "react";

type AiCopilotContextValue = {
  context: unknown;
  setContext: (context: unknown) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  active: boolean;
  setActive: (active: boolean) => void;
};

const AiCopilotContext = createContext<AiCopilotContextValue | null>(null);

export const AiCopilotProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [context, setContext] = useState<unknown>();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);

  const contextValue = useMemo<AiCopilotContextValue>(
    () => ({ context, setContext, open, setOpen, active, setActive }),
    [JSON.stringify(context), open, active]
  );

  return (
    <AiCopilotContext.Provider value={contextValue}>
      {children}
    </AiCopilotContext.Provider>
  );
};

export const useAiCopilotContext = () => {
  const value = useContext(AiCopilotContext);
  if (!value) {
    throw new Error(
      "useAiCopilotContext must be used within <AiCopilotProvider/>"
    );
  }
  return value;
};
