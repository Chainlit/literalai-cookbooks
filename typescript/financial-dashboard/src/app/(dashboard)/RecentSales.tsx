"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ErrorBlock } from "@/components/atoms/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import { formatCurrency } from "../../lib/formatter";
import { AiCopilotButton } from "./AiCopilotButton";
import { getRecentSales } from "./queries";

export const RecentSales: React.FC = () => {
  const [aiActive, setAiActive] = useState(false);

  const {
    data: sales,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["recentSales"],
    queryFn: () => getRecentSales(),
  });

  return (
    <Card className={cn(aiActive ? "outline outline-blue-300" : "")}>
      <CardHeader className="flex flex-row gap-3 space-y-0">
        <CardTitle className="flex-1">Recent Sales</CardTitle>
        <AiCopilotButton
          context={{ label: "recent sales", sales }}
          onActiveChange={setAiActive}
        />
      </CardHeader>
      <CardContent className="grid gap-8">
        {error ? <ErrorBlock error={error} /> : null}
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </>
        ) : null}
        {sales
          ? sales.map((sale, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="hidden size-9 rounded-full bg-zinc-200 sm:block" />
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {sale.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sale.userEmail}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {formatCurrency(sale.totalAmount)}
                </div>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
};
