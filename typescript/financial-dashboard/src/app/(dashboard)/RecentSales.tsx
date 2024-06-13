"use client";

import { useQuery } from "@tanstack/react-query";

import { ErrorBlock } from "@/components/atoms/error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency } from "../../lib/formatter";
import { AiCopilotButton } from "./AiCopilotButton";
import { getRecentSales } from "./queries";

export const RecentSales: React.FC = () => {
  const {
    data: sales,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["recentSales"],
    queryFn: () => getRecentSales(),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row gap-3 space-y-0">
        <CardTitle className="flex-1">Recent Sales</CardTitle>
        <AiCopilotButton context={sales} />
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
