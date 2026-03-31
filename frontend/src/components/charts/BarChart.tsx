"use client";

import "@/components/charts/ChartSetup";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";

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
      labels: { font: { size: 11 }, boxWidth: 12, padding: 8 },
    },
    tooltip: {
      backgroundColor: "#2D2D2D",
      titleFont: { size: 11 },
      bodyFont: { size: 11 },
      padding: 8,
      cornerRadius: 4,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      grid: { color: "#E8E8E8" },
      ticks: { font: { size: 10 } },
    },
  },
};

export default function BarChart({
  data,
  options,
  height = 300,
}: BarChartProps) {
  const merged = useMemo(() => {
    if (!options) return defaultOptions;
    return {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins,
      },
      scales: {
        ...defaultOptions.scales,
        ...options.scales,
      },
    };
  }, [options]);

  return (
    <div style={{ height }}>
      <Bar data={data} options={merged} />
    </div>
  );
}
