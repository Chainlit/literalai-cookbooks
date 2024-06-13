"use client";

import { AiCopilotProvider } from "./AiCopilotProvider";
import { AiCopilotSheet } from "./AiCopilotSheet";
import { MonthlyRevenues } from "./MonthlyRevenues";
import { RecentSales } from "./RecentSales";

export const Dashboard: React.FC = () => {
  return (
    <AiCopilotProvider>
      <main className="flex w-full">
        <div className="m-4 grid flex-1 items-start gap-4 md:m-10 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <MonthlyRevenues className="xl:col-span-2" />
          <RecentSales />
        </div>
        <AiCopilotSheet />
      </main>
    </AiCopilotProvider>
  );
};
