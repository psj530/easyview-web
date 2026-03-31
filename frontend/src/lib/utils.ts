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
 * Format a change rate with sign and color hint
 */
export function formatChangeRate(value: number | null | undefined): string {
  if (value == null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Return a Tailwind text color class based on change direction
 */
export function changeColor(value: number): string {
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-blue-600";
  return "text-gray-500";
}
