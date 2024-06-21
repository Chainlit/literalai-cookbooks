"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ErrorBlock } from "@/components/atoms/error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import { AiCopilotButton } from "../../components/molecules/ai-copilot/AiCopilotButton";
import { formatCurrency } from "../../lib/formatter";
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
    <Card
      className={cn(
        aiActive ? "outline outline-blue-300 dark:outline-blue-800" : ""
      )}
    >
      <CardHeader className="flex flex-row gap-3 space-y-0">
        <CardTitle className="flex-1">Recent Sales</CardTitle>
        <AiCopilotButton
          small
          context={{
            label: "recent sales",
            description:
              "A list of the top 5 recent sales with total amount and user name.",
          }}
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
                <Avatar className="hidden size-9 sm:block">
                  <AvatarImage
                    src={`https://i.pravatar.cc/150?u=${sale.userEmail}`}
                    alt={sale.userName}
                  />
                  <AvatarFallback>
                    {sale.userName.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
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
