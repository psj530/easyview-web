"use client";

import "@/components/charts/ChartSetup";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

interface LineChartProps {
  data: ChartData<"line">;
  options?: ChartOptions<"line">;
  height?: number;
}

const defaultOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: { font: { size: 11 }, boxWidth: 12 },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      grid: { color: "#E8E8E8" },
      ticks: { font: { size: 10 } },
    },
  },
};

export default function LineChart({ data, options, height = 300 }: LineChartProps) {
  const merged = { ...defaultOptions, ...options };
  return (
    <div style={{ height }}>
      <Line data={data} options={merged} />
    </div>
  );
}
