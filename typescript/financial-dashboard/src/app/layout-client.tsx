"use client";

import { ReactNode } from "react";
import Link from "next/link";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandIcon } from "lucide-react";
import { ThemeProvider } from "next-themes";

import { AiCopilotButton } from "@/components/molecules/ai-copilot/AiCopilotButton";
import { AiCopilotProvider } from "@/components/molecules/ai-copilot/AiCopilotProvider";
import { DarkModeToggle } from "@/components/molecules/DarkModeToggle";

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export default function RootLayoutClient({ children }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AiCopilotProvider>
        <QueryClientProvider client={queryClient}>
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

          {children}

          <DarkModeToggle className="fixed bottom-4 left-4 z-50 shadow-lg" />
        </QueryClientProvider>
      </AiCopilotProvider>
    </ThemeProvider>
  );
}
