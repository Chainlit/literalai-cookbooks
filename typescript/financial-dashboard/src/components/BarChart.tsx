"use client";

import {
  Bar,
  BarChart as BaseBarChart,
  CartesianGrid,
  Legend,
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
    <BaseBarChart width={730} height={250} data={entries}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="value"
        onClick={(data) => {
          onContextChange?.({ lasClicked: data.payload });
        }}
      />
    </BaseBarChart>
  );
};
BarChart.displayName = "BarChart";
