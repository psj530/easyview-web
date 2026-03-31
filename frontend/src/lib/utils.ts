/**
 * Format a number with commas (e.g. 1,234,567)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return Math.round(value).toLocaleString("ko-KR");
}

/**
 * Format a number in millions (백만원 단위)
 */
export function formatMillions(value: number | null | undefined): string {
  if (value == null) return "-";
  const millions = value / 1_000_000;
  return Math.round(millions).toLocaleString("ko-KR");
}

/**
 * Format a percentage value (e.g. 20.7%)
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value.toFixed(1)}%`;
}

/**
 * Format a change rate with arrow indicators and sign
 */
export function formatChangeRate(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value > 0) return `▲${value.toFixed(1)}%`;
  if (value < 0) return `▼${Math.abs(value).toFixed(1)}%`;
  return `0.0%`;
}

/**
 * Return a Tailwind text color class based on change direction
 */
export function changeColor(value: number): string {
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-blue-600";
  return "text-gray-500";
}

/**
 * Generate a simple SVG sparkline from an array of values
 */
export function createSparklineSVG(
  data: number[],
  width: number,
  height: number,
  color: string
): string {
  const filtered = data.filter((v) => v != null);
  if (filtered.length === 0) return "";
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const range = max - min || 1;
  const points = filtered
    .map((v, i) => {
      const x = (i / (filtered.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polyline fill="none" stroke="${color}" stroke-width="1.5" points="${points}"/></svg>`;
}

/**
 * Standard PwC color palette for charts
 */
export const CHART_COLORS = [
  "#D04A02",
  "#E87722",
  "#FFB347",
  "#7D7D7D",
  "#464646",
  "#A33B01",
  "#C76B2E",
  "#D4956A",
  "#B0B0B0",
  "#555555",
];

/**
 * Generate month label like "2025년 09월"
 */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${m}월`;
}

/**
 * Short month labels: 1월, 2월, ...
 */
export const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];
