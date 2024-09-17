import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts";
import type { CategoricalChartFunc } from "recharts/types/chart/generateCategoricalChart";
import colors from "tailwindcss/colors";

import { ErrorBlock } from "@/components/atoms/error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency, monthFormatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";

import { AiCopilotButton } from "../../components/molecules/ai-copilot/AiCopilotButton";
import { getMonthlyRevenues } from "./queries";

type Props = React.ComponentProps<typeof Card>;

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const MonthlyRevenues: React.FC<Props> = ({ className, ...props }) => {
  const [aiActive, setAiActive] = useState(false);

  const [periodSelectionStart, setPeriodSelectionStart] = useState<
    string | null
  >(null);
  const [selectedPeriod, setSelectedPeriod] = useState<[string, string] | null>(
    null
  );

  const selectionStart: CategoricalChartFunc = (data, event) => {
    event.preventDefault();
    if (!data.activeLabel) return;
    setPeriodSelectionStart(data.activeLabel);
  };

  const selectionUpdate: CategoricalChartFunc = (data, event) => {
    event.preventDefault();
    if (!periodSelectionStart) return;
    if (!data.activeLabel) return;
    setSelectedPeriod([periodSelectionStart, data.activeLabel]);
  };

  const selectionEnd: CategoricalChartFunc = (data, event: Event) => {
    event.preventDefault();
    setPeriodSelectionStart(null);
  };

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
      className={cn(
        className,
        aiActive ? "outline outline-2 outline-rose-500/50" : ""
      )}
    >
      <CardHeader className="flex flex-row space-y-0">
        <div className="grid flex-1 gap-2">
          <CardTitle>Monthly Revenues</CardTitle>
          <CardDescription>Revenues for the last 12 months.</CardDescription>
        </div>
        <AiCopilotButton
          small
          context={{
            label: "Monthly revenues",
            description:
              "A line chart of the revenue for the last 12 months." +
              (selectedPeriod
                ? `\nThe selected period is from ${selectedPeriod[0]} to ${selectedPeriod[1]}.`
                : ""),
          }}
          onActiveChange={setAiActive}
        />
      </CardHeader>
      <CardContent>
        {error ? <ErrorBlock error={error} /> : null}
        {isLoading ? <Skeleton className="h-[400px] w-full" /> : null}
        {revenues ? (
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={revenues}
              onMouseDown={selectionStart}
              onMouseMove={selectionUpdate}
              onMouseLeave={selectionEnd}
              onMouseUp={selectionEnd}
            >
              <XAxis
                dataKey="month"
                tickFormatter={monthFormatter}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              {selectedPeriod ? (
                <ReferenceArea
                  x1={selectedPeriod[0]}
                  x2={selectedPeriod[1]}
                  fill={colors.rose[500]}
                  fillOpacity={0.1}
                />
              ) : null}
              <Line
                dataKey="revenue"
                type="monotone"
                dot={false}
                stroke={colors.rose[500]}
              />
            </LineChart>
          </ChartContainer>
        ) : null}
      </CardContent>
    </Card>
  );
};
