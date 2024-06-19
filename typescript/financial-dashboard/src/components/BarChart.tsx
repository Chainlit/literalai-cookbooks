"use client";

import {
  Bar,
  BarChart as BaseBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  entries: {
    name: string;
    value: number;
  }[];
  onContextChange?: (context: any) => void;
};

export const BarChart: React.FC<Props> = ({ entries, onContextChange }) => {
  return (
    <ResponsiveContainer width="100%" height={300} className="bg-background">
      <BaseBarChart data={entries}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="value"
          onClick={(data) => {
            onContextChange?.({
              label: `Clicked ${data.payload.name}`,
              lasClicked: data.payload,
            });
          }}
        />
      </BaseBarChart>
    </ResponsiveContainer>
  );
};
BarChart.displayName = "BarChart";
