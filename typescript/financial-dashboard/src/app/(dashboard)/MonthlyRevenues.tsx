import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorBlock } from "@/components/atoms/error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency, monthFormatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";

import { AiCopilotButton } from "./AiCopilotButton";
import { getMonthlyRevenues } from "./queries";

type Props = React.ComponentProps<typeof Card>;

export const MonthlyRevenues: React.FC<Props> = ({ className, ...props }) => {
  const [aiActive, setAiActive] = useState(false);

  const {
    data: revenues,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["monthlyRevenues"],
    queryFn: () => getMonthlyRevenues(),
  });

  return (
    <Card
      {...props}
      className={cn(className, aiActive ? "outline outline-blue-300" : "")}
    >
      <CardHeader className="flex flex-row space-y-0">
        <div className="grid flex-1 gap-2">
          <CardTitle>Monthly Revenues</CardTitle>
          <CardDescription>Revenues for the last 12 months.</CardDescription>
        </div>
        <AiCopilotButton
          context={{ label: "Monthly revenues", revenues }}
          onActiveChange={setAiActive}
        />
      </CardHeader>
      <CardContent>
        {error ? <ErrorBlock error={error} /> : null}
        {isLoading ? <Skeleton className="h-[400px] w-full" /> : null}
        {revenues ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenues}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={monthFormatter} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                labelFormatter={monthFormatter}
                formatter={formatCurrency}
              />
              <Legend />
              <Line dataKey="revenue" type="monotone" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </CardContent>
    </Card>
  );
};
