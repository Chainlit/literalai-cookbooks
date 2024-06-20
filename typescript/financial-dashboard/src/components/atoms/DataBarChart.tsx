"use client";

import { useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
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

export const DataBarChart: React.FC<Props> = ({ entries, onContextChange }) => {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (selected) {
      onContextChange?.({
        label: `Selected ${selected}`,
        selected,
      });
    }
  }, [selected]);

  return (
    <ResponsiveContainer width="100%" height={300} className="bg-background">
      <BarChart
        data={entries}
        onClick={(data) => {
          setSelected(data.activeLabel ?? null);
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {selected ? (
          <ReferenceArea x1={selected} x2={selected} fill="#bfdbfe" />
        ) : null}
        <Bar dataKey="value" />
      </BarChart>
    </ResponsiveContainer>
  );
};
BarChart.displayName = "BarChart";
