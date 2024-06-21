"use client";

import { ReactNode } from "react";
import Link from "next/link";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandIcon, GithubIcon } from "lucide-react";
import { ThemeProvider } from "next-themes";

import { AiCopilotButton } from "@/components/molecules/ai-copilot/AiCopilotButton";
import { AiCopilotProvider } from "@/components/molecules/ai-copilot/AiCopilotProvider";
import { DarkModeToggle } from "@/components/molecules/DarkModeToggle";
import { Button } from "@/components/ui/button";

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
              <Button size="sm" variant="ghost" asChild>
                <a
                  href="https://github.com/Chainlit/literal-cookbook"
                  target="_blank"
                >
                  <svg
                    className="size-4 mr-2"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>Github</span>
                </a>
              </Button>
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
