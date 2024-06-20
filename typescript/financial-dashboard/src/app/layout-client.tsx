"use client";

import { ReactNode } from "react";
import Link from "next/link";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandIcon, HomeIcon } from "lucide-react";

import { AiCopilotButton } from "@/components/molecules/ai-copilot/AiCopilotButton";
import { AiCopilotProvider } from "@/components/molecules/ai-copilot/AiCopilotProvider";

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export default function RootLayoutClient({ children }: Props) {
  return (
    <AiCopilotProvider>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="flex flex-col gap-6 text-lg font-medium md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold md:text-base"
          >
            <CommandIcon className="size-5" />
            <h1>Acme Inc.</h1>
          </Link>
        </nav>

        <span className="flex-1"></span>

        <AiCopilotButton />
      </header>

      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AiCopilotProvider>
  );
}
