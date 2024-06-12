'use client';

import {

  CartesianGrid,
  BarChart as BaseBarChart,
  Bar,
  Legend,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";

type Props = {
  entries: {
    name: string;
    value: number;
  }[];
};

export const BarChart: React.FC<Props> = ({ entries }) => {
  return (
    <BaseBarChart width={730} height={250} data={entries}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" />
    </BaseBarChart>
  );
};
BarChart.displayName = "BarChart";