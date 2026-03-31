"use client";

import "@/components/charts/ChartSetup";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

interface BarChartProps {
  data: ChartData<"bar">;
  options?: ChartOptions<"bar">;
  height?: number;
}

const defaultOptions: ChartOptions<"bar"> = {
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

export default function BarChart({ data, options, height = 300 }: BarChartProps) {
  const merged = { ...defaultOptions, ...options };
  return (
    <div style={{ height }}>
      <Bar data={data} options={merged} />
    </div>
  );
}
