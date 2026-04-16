"use client";

import { useEffect, useState } from "react";
import {
  fetchSummary,
  fetchPL,
  fetchBS,
  type SummaryData,
  type PLItem,
  type BSItem,
  type PeriodType,
  type BSCompareType,
  type MonthlyData,
} from "@/lib/api";
import {
  formatMillions,
  formatPercent,
  formatChangeRate,
  changeColor,
  createSparklineSVG,
  formatMonthLabel,
} from "@/lib/utils";

/* ---------- Types ---------- */

interface SummaryProps {
  period: PeriodType;
  bsCompare: BSCompareType;
  month: string;
  onPeriodChange: (p: PeriodType) => void;
  onBsCompareChange: (b: BSCompareType) => void;
  onMonthChange: (m: string) => void;
  availableMonths: string[];
  onNavigate: (tab: "summary" | "pl" | "bs" | "journal" | "scenario", subTab?: number) => void;
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: "전년누적", value: "ytd" },
  { label: "전년동월", value: "yoy_month" },
  { label: "전월비교", value: "mom" },
];

/* ---------- Sub-components ---------- */

function KPICard({
  label,
  current,
  prior,
  changeRate,
  borderColor,
  sparkData,
  sparkColor,
  onClick,
  tooltip,
}: {
  label: string;
  current: number;
  prior: number;
  changeRate: number;
  borderColor: string;
  sparkData?: number[] | null;
  sparkColor?: string;
  onClick?: () => void;
  tooltip?: string;
}) {
  const sparkSVG =
    sparkData && sparkColor
      ? createSparklineSVG(sparkData, 180, 36, sparkColor)
      : "";

  return (
    <div
      onClick={onClick}
      title={tooltip}
      className={`bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow group" : ""
      }`}
      style={{ borderTopWidth: 3, borderTopColor: borderColor }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#464646]">{label}</span>
        {onClick && (
          <span className="text-[10px] text-[#ABABAB] opacity-0 group-hover:opacity-100 transition-opacity">
            클릭하여 상세 보기 &rarr;
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#2D2D2D] mb-1 tabular-nums">
        {formatMillions(current)}
        <span className="text-xs font-normal text-gray-400 ml-1">백만</span>
      </div>
      <div className="flex items-center gap-3 text-xs mb-2">
        <span className="text-gray-400 tabular-nums">전기: {formatMillions(prior)}</span>
        <span className={`font-semibold ${changeColor(changeRate)}`}>
          {formatChangeRate(changeRate)}
        </span>
      </div>
      {sparkSVG && (
        <div
          className="mt-1"
          dangerouslySetInnerHTML={{ __html: sparkSVG }}
        />
      )}
    </div>
  );
}

function TopItemsCard({
  title,
  items,
  borderColor,
  onClick,
}: {
  title: string;
  items: { name: string; amount: number }[];
  borderColor: string;
  onClick?: () => void;
}) {
  const maxVal = Math.max(...items.map((i) => Math.abs(i.amount)), 1);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
      style={{ borderTopWidth: 3, borderTopColor: borderColor }}
    >
      <div className="text-sm font-semibold text-[#2D2D2D] mb-3 border-l-[3px] border-[#D04A02] pl-2">
        {title}
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const pct = (Math.abs(item.amount) / maxVal) * 100;
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-[#464646] truncate mr-2">
                  {i + 1}. {item.name}
                </span>
                <span className="text-right font-medium tabular-nums whitespace-nowrap">
                  {formatMillions(item.amount)}
                  <span className="text-[10px] text-gray-400 ml-0.5">백만</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: borderColor,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IndicatorItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>
        {formatPercent(value)}
      </div>
    </div>
  );
}

function ScenarioCountCard({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4 text-center ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-red-600">{count}</div>
      <div className="text-[10px] text-gray-400">건</div>
    </div>
  );
}

/* ---------- Main Component ---------- */

export default function Summary({
  period,
  bsCompare,
  month,
  onPeriodChange,
  onBsCompareChange,
  onMonthChange,
  availableMonths,
  onNavigate,
}: SummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [plItems, setPlItems] = useState<PLItem[]>([]);
  const [bsItems, setBsItems] = useState<BSItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData | null>(null);
  const [monthlyOP, setMonthlyOP] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filter = { period, month, bsCompare };

    Promise.all([
      fetchSummary(filter),
      fetchPL(filter),
      fetchBS(filter),
    ])
      .then(([s, plData, bsData]) => {
        setSummary(s);
        setPlItems(plData.plItems);
        setMonthlyRevenue(plData.monthlyRevenue);
        setMonthlyOP(plData.monthlyOperatingProfit);
        setBsItems(bsData.bsItems);
      })
      .catch((err) => {
        console.error(err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [period, month, bsCompare]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#D04A02] border-t-transparent rounded-full mx-auto mb-3" />
          <div className="text-sm">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Filter bar - sticky below main tabs */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-2 flex flex-wrap items-center justify-between gap-2 sticky top-[104px] z-30">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#7D7D7D] font-medium">기준 연월</span>
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 bg-white text-xs"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#7D7D7D] font-medium">분석대상</span>
            <div className="flex border border-gray-300 rounded overflow-hidden">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onPeriodChange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === opt.value
                      ? "bg-[#D04A02] text-white"
                      : "bg-white text-[#464646] hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#7D7D7D] font-medium">비교대상 /재무상태</span>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => onBsCompareChange("year_start")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                bsCompare === "year_start"
                  ? "bg-[#2D2D2D] text-white"
                  : "bg-white text-[#464646] hover:bg-gray-50"
              }`}
            >연초</button>
            <button
              onClick={() => onBsCompareChange("month_start")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                bsCompare === "month_start"
                  ? "bg-[#2D2D2D] text-white"
                  : "bg-white text-[#464646] hover:bg-gray-50"
              }`}
            >월초</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="매출액"
          {...summary.revenue}
          borderColor="#D04A02"
          sparkData={monthlyRevenue?.current}
          sparkColor="#D04A02"
          onClick={() => onNavigate("pl")}
          tooltip="클릭하여 손익분석으로 이동"
        />
        <KPICard
          label="영업이익"
          {...summary.operatingProfit}
          borderColor="#E0301E"
          sparkData={monthlyOP?.current}
          sparkColor="#E0301E"
          onClick={() => onNavigate("pl")}
          tooltip="클릭하여 손익분석으로 이동"
        />
        <KPICard
          label="자산"
          {...summary.assets}
          borderColor="#A05E37"
          onClick={() => onNavigate("bs")}
          tooltip="클릭하여 재무상태분석으로 이동"
        />
        <KPICard
          label="부채"
          {...summary.liabilities}
          borderColor="#D93954"
          onClick={() => onNavigate("bs")}
          tooltip="클릭하여 재무상태분석으로 이동"
        />
      </div>

      {/* Top Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TopItemsCard
          title="매출액 증가액 상위 3개 거래처"
          items={summary.revenueTopCustomers}
          borderColor="#D04A02"
          onClick={() => onNavigate("pl", 3)}
        />
        <TopItemsCard
          title="비용 증가액 상위 3개 계정"
          items={summary.expenseTopAccounts}
          borderColor="#E0301E"
          onClick={() => onNavigate("pl", 2)}
        />
        <TopItemsCard
          title="자산 증가액 상위 3개 계정"
          items={summary.assetTopAccounts}
          borderColor="#A05E37"
          onClick={() => onNavigate("bs", 2)}
        />
        <TopItemsCard
          title="부채 증가액 상위 3개 계정"
          items={summary.liabilityTopAccounts}
          borderColor="#D93954"
          onClick={() => onNavigate("bs", 2)}
        />
      </div>

      {/* Indicators Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate("pl", 0)}
        >
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
            손익지표
          </div>
          <div className="grid grid-cols-3 gap-4">
            <IndicatorItem label="매출총이익률" value={summary.profitIndicators.grossMargin} color="#D04A02" />
            <IndicatorItem label="영업이익률" value={summary.profitIndicators.operatingMargin} color="#E0301E" />
            <IndicatorItem label="당기손익률" value={summary.profitIndicators.netMargin} color="#A05E37" />
          </div>
        </div>
        <div
          className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate("bs", 0)}
        >
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
            유동성지표
          </div>
          <div className="grid grid-cols-2 gap-4">
            <IndicatorItem label="부채비율" value={summary.liquidityIndicators.debtRatio} color="#D93954" />
            <IndicatorItem label="유동비율" value={summary.liquidityIndicators.currentRatio} color="#D04A02" />
          </div>
        </div>
      </div>

      {/* PL & BS Tables side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PL Summary Table */}
        <div
          className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate("pl", 2)}
        >
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
            손익항목
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2D2D2D] text-white">
                  <th className="text-left px-3 py-2 font-medium w-[30%]">공시용계정</th>
                  <th className="text-right px-3 py-2 font-medium w-[25%]">당기</th>
                  <th className="text-right px-3 py-2 font-medium w-[25%]">전기</th>
                  <th className="text-right px-3 py-2 font-medium w-[20%]">증감률</th>
                </tr>
              </thead>
              <tbody>
                {plItems
                  .filter((item) => item.level === 0)
                  .map((item, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${
                        item.highlight ? "bg-orange-50" : ""
                      } ${item.bold ? "font-semibold" : ""}`}
                    >
                      <td className="px-3 py-2 text-left">{item.account}</td>
                      <td className="text-right px-3 py-2 tabular-nums">
                        {item.current != null ? Math.round(item.current).toLocaleString("ko-KR") : "-"}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">
                        {item.prior != null ? Math.round(item.prior).toLocaleString("ko-KR") : "-"}
                      </td>
                      <td className={`text-right px-3 py-2 tabular-nums ${changeColor(item.changeRate)}`}>
                        {formatChangeRate(item.changeRate)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BS Summary Table */}
        <div
          className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate("bs", 2)}
        >
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
            재무항목
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2D2D2D] text-white">
                  <th className="text-left px-3 py-2 font-medium w-[25%]">분류</th>
                  <th className="text-right px-3 py-2 font-medium w-[27%]">기말</th>
                  <th className="text-right px-3 py-2 font-medium w-[27%]">기초</th>
                  <th className="text-right px-3 py-2 font-medium w-[21%]">증감률</th>
                </tr>
              </thead>
              <tbody>
                {bsItems
                  .filter((item) => item.level <= 1)
                  .map((item, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${
                        item.bold && item.level === 0 ? "font-semibold bg-[#F5F5F5]" : item.bold ? "font-semibold" : ""
                      }`}
                    >
                      <td
                        className="px-3 py-2 text-left"
                        style={{ paddingLeft: 12 + item.level * 16 }}
                      >
                        {item.category}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">
                        {item.endBal != null ? Math.round(item.endBal).toLocaleString("ko-KR") : "-"}
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">
                        {item.beginBal != null ? Math.round(item.beginBal).toLocaleString("ko-KR") : "-"}
                      </td>
                      <td className={`text-right px-3 py-2 tabular-nums ${changeColor(item.changeRate ?? 0)}`}>
                        {item.changeRate != null
                          ? formatChangeRate(item.changeRate)
                          : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Scenario Counts */}
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        시나리오 전표 수
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScenarioCountCard
          label="동일금액 중복"
          count={summary.scenarioCounts.duplicateAmount}
          onClick={() => onNavigate("scenario", 0)}
        />
        <ScenarioCountCard
          label="현금지급후 부채인식"
          count={summary.scenarioCounts.cashAfterLiability}
          onClick={() => onNavigate("scenario", 1)}
        />
        <ScenarioCountCard
          label="주말현금지급"
          count={summary.scenarioCounts.weekendCash}
          onClick={() => onNavigate("scenario", 2)}
        />
        <ScenarioCountCard
          label="현금지급 및 비용인식"
          count={summary.scenarioCounts.cashAndExpense}
          onClick={() => onNavigate("scenario", 4)}
        />
      </div>
    </div>
  );
}
