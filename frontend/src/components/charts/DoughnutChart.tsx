"use client";

import "@/components/charts/ChartSetup";
import { Doughnut } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

interface DoughnutChartProps {
  data: ChartData<"doughnut">;
  options?: ChartOptions<"doughnut">;
  height?: number;
}

const defaultOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right" as const,
      labels: { font: { size: 11 }, boxWidth: 12, padding: 12 },
    },
  },
};

export default function DoughnutChart({ data, options, height = 280 }: DoughnutChartProps) {
  const merged = { ...defaultOptions, ...options };
  return (
    <div style={{ height }}>
      <Doughnut data={data} options={merged} />
    </div>
  );
}
