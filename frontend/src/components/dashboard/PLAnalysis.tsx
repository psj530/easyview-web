"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  fetchPL,
  fetchSales,
  fetchPLJournal,
  type PLItem,
  type MonthlyData,
  type MonthlyRateData,
  type QuarterlyPL,
  type SalesAnalysis,
  type PeriodType,
  type PLTrendAccount,
  type JournalEntry,
} from "@/lib/api";
import {
  formatMillions,
  formatNumber,
  formatChangeRate,
  formatPercent,
  changeColor,
  CHART_COLORS,
  MONTH_LABELS,
  formatMonthLabel,
} from "@/lib/utils";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import DoughnutChart from "@/components/charts/DoughnutChart";

/* ---------- Types ---------- */

interface PLAnalysisProps {
  period: PeriodType;
  month: string;
  onPeriodChange: (p: PeriodType) => void;
  onMonthChange: (m: string) => void;
  availableMonths: string[];
  initialSubTab?: number;
}

const SUB_TABS = [
  "PL 요약",
  "PL 추이분석",
  "PL 계정분석",
  "매출분석",
  "손익항목",
];

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: "전년누적", value: "ytd" },
  { label: "전년동월", value: "yoy_month" },
  { label: "전월비교", value: "mom" },
];

/* ---------- Main Component ---------- */

export default function PLAnalysis({
  period,
  month,
  onPeriodChange,
  onMonthChange,
  availableMonths,
  initialSubTab,
}: PLAnalysisProps) {
  const [subTab, setSubTab] = useState(initialSubTab ?? 0);
  const [plItems, setPlItems] = useState<PLItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData | null>(null);
  const [monthlyOP, setMonthlyOP] = useState<MonthlyData | null>(null);
  const [monthlyNI, setMonthlyNI] = useState<MonthlyData | null>(null);
  const [monthlyGP, setMonthlyGP] = useState<MonthlyData | null>(null);
  const [grossMarginRate, setGrossMarginRate] = useState<MonthlyRateData | null>(null);
  const [opMarginRate, setOpMarginRate] = useState<MonthlyRateData | null>(null);
  const [netMarginRate, setNetMarginRate] = useState<MonthlyRateData | null>(null);
  const [quarterlyPL, setQuarterlyPL] = useState<QuarterlyPL | null>(null);
  const [sales, setSales] = useState<SalesAnalysis | null>(null);
  const [plTrend, setPlTrend] = useState<PLTrendAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filter = { period, month };

    Promise.all([fetchPL(filter), fetchSales(filter)])
      .then(([plData, salesData]) => {
        setPlItems(plData.plItems);
        setMonthlyRevenue(plData.monthlyRevenue);
        setMonthlyOP(plData.monthlyOperatingProfit);
        setMonthlyNI(plData.monthlyNetIncome);
        setMonthlyGP(plData.monthlyGrossProfit);
        setGrossMarginRate(plData.grossMarginRate || null);
        setOpMarginRate(plData.operatingMarginRate || null);
        setNetMarginRate(plData.netMarginRate || null);
        setQuarterlyPL(plData.quarterlyPL);
        setSales(salesData);
        setPlTrend(plData.plTrend || []);
      })
      .catch((err) => {
        console.error(err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [period, month]);

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

  return (
    <div className="space-y-6">
      {/* Sub-nav bar with filters - sticky below main tabs */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-2 flex flex-wrap items-center justify-between gap-2 sticky top-[104px] z-30">
        <div className="flex gap-1">
          {SUB_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setSubTab(i)}
              className={`px-4 py-2 text-xs rounded font-medium transition-colors ${
                subTab === i
                  ? "bg-[#2D2D2D] text-white"
                  : "text-[#464646] hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
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

      {subTab === 0 && (
        <PLSummaryTab
          plItems={plItems}
          monthlyRevenue={monthlyRevenue}
          monthlyOP={monthlyOP}
          grossMarginRate={grossMarginRate}
          opMarginRate={opMarginRate}
          netMarginRate={netMarginRate}
        />
      )}
      {subTab === 1 && <PLTrendTab plTrend={plTrend} plItems={plItems} />}
      {subTab === 2 && <PLAccountTab plItems={plItems} sales={sales} />}
      {subTab === 3 && (
        <SalesTab sales={sales} monthlyRevenue={monthlyRevenue} plItems={plItems} />
      )}
      {subTab === 4 && <PLItemsTab quarterlyPL={quarterlyPL} />}
    </div>
  );
}

/* ---------- PL 요약 ---------- */

function PLSummaryTab({
  plItems,
  monthlyRevenue,
  monthlyOP,
  grossMarginRate,
  opMarginRate,
  netMarginRate,
}: {
  plItems: PLItem[];
  monthlyRevenue: MonthlyData | null;
  monthlyOP: MonthlyData | null;
  grossMarginRate: MonthlyRateData | null;
  opMarginRate: MonthlyRateData | null;
  netMarginRate: MonthlyRateData | null;
}) {
  // Month selection for margin rate charts
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(() => {
    // Default: select last 3 months that have data
    const months = new Set<number>();
    if (grossMarginRate?.current) {
      for (let i = 11; i >= 0 && months.size < 3; i--) {
        if (grossMarginRate.current[i] != null) months.add(i);
      }
    }
    return months.size > 0 ? months : new Set([6, 7, 8]);
  });
  const [selectAll, setSelectAll] = useState(false);

  const toggleMonth = (idx: number) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectedMonths(new Set());
    } else {
      setSelectedMonths(new Set(Array.from({ length: 12 }, (_, i) => i)));
    }
    setSelectAll(!selectAll);
  };

  // Filter margin data to selected months
  const filterBySelected = (data: (number | null)[] | undefined) => {
    if (!data) return MONTH_LABELS.map(() => null);
    return data.map((v, i) => (selectedMonths.has(i) ? v : null));
  };
  // Extract key metrics from plItems
  const revenue = plItems.find((p) => p.account === "매출액" || p.account === "수익(매출액)");
  const grossProfit = plItems.find((p) => p.account === "매출총이익");
  const operatingProfit = plItems.find((p) => p.account === "영업이익");
  const netIncome = plItems.find((p) => p.account === "당기순이익" || p.account === "당기순손익");

  const metrics = [
    {
      label: "매출액",
      data: revenue,
      color: "#D04A02",
    },
    {
      label: "매출총이익",
      data: grossProfit,
      color: "#E0301E",
      marginLabel: "매출총이익률",
      marginValue: revenue && grossProfit ? (grossProfit.current / revenue.current) * 100 : null,
    },
    {
      label: "영업이익",
      data: operatingProfit,
      color: "#D04A02",
      marginLabel: "영업이익률",
      marginValue: revenue && operatingProfit ? (operatingProfit.current / revenue.current) * 100 : null,
    },
    {
      label: "당기순이익",
      data: netIncome,
      color: "#E0301E",
      marginLabel: "당기손익률",
      marginValue: revenue && netIncome ? (netIncome.current / revenue.current) * 100 : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        손익 요약
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5"
          >
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-xl font-bold mb-2" style={{ color: m.color }}>
              {m.data ? formatMillions(m.data.current) : "-"}
              <span className="text-xs font-normal text-gray-400 ml-1">
                백만
              </span>
            </div>
            {m.data && (
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>전기</span>
                  <span className="tabular-nums">
                    {formatMillions(m.data.prior)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>증감</span>
                  <span className="tabular-nums">
                    {formatMillions(m.data.change)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>△%</span>
                  <span
                    className={`font-semibold tabular-nums ${changeColor(
                      m.data.changeRate
                    )}`}
                  >
                    {formatChangeRate(m.data.changeRate)}
                  </span>
                </div>
              </div>
            )}
            {m.marginLabel && m.marginValue != null && (
              <div
                className="mt-2 px-2 py-1 rounded text-[10px] font-semibold text-center text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.marginLabel} {m.marginValue.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row: Revenue and Operating Profit Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthlyRevenue && (
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
              매출액 추이
            </div>
            <BarChart
              data={{
                labels: MONTH_LABELS,
                datasets: [
                  {
                    label: "당기",
                    data: monthlyRevenue.current,
                    backgroundColor: "#D04A02",
                    borderRadius: 2,
                  },
                  {
                    label: "전기",
                    data: monthlyRevenue.prior,
                    backgroundColor: "#DEDEDE",
                    borderRadius: 2,
                  },
                ],
              }}
              height={250}
            />
          </div>
        )}
        {monthlyOP && (
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
              영업이익 추이
            </div>
            <BarChart
              data={{
                labels: MONTH_LABELS,
                datasets: [
                  {
                    label: "당기",
                    data: monthlyOP.current,
                    backgroundColor: "#D04A02",
                    borderRadius: 2,
                  },
                  {
                    label: "전기",
                    data: monthlyOP.prior,
                    backgroundColor: "#DEDEDE",
                    borderRadius: 2,
                  },
                ],
              }}
              height={250}
            />
          </div>
        )}
      </div>

      {/* Margin Rate Trend Charts with Month Selector */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
          이익률 추이
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
            <input type="checkbox" checked={selectAll} onChange={toggleAll} className="w-3 h-3 accent-[#D04A02]" />
            모두 선택
          </label>
          {MONTH_LABELS.map((label, i) => (
            <label key={i} className="flex items-center gap-0.5 text-[10px] text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMonths.has(i)}
                onChange={() => toggleMonth(i)}
                className="w-3 h-3 accent-[#D04A02]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            매출총이익률 추이
          </div>
          <LineChart
            data={{
              labels: MONTH_LABELS,
              datasets: [
                {
                  label: "당기",
                  data: filterBySelected(grossMarginRate?.current),
                  borderColor: "#E0301E",
                  fill: false,
                  tension: 0.3,
                  pointBackgroundColor: "#E0301E",
                  pointRadius: 3,
                  spanGaps: true,
                },
                {
                  label: "전기",
                  data: grossMarginRate?.prior || [],
                  borderColor: "#DEDEDE",
                  fill: false,
                  tension: 0.3,
                  borderDash: [4, 4],
                  pointBackgroundColor: "#DEDEDE",
                  pointRadius: 2,
                },
              ],
            }}
            height={200}
            options={{ scales: { y: { ticks: { callback: (v: string | number) => `${v}%` } } } }}
          />
        </div>
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            영업이익률 추이
          </div>
          <LineChart
            data={{
              labels: MONTH_LABELS,
              datasets: [
                {
                  label: "당기",
                  data: filterBySelected(opMarginRate?.current),
                  borderColor: "#E0301E",
                  fill: false,
                  tension: 0.3,
                  pointBackgroundColor: "#E0301E",
                  pointRadius: 3,
                  spanGaps: true,
                },
                {
                  label: "전기",
                  data: opMarginRate?.prior || [],
                  borderColor: "#DEDEDE",
                  fill: false,
                  tension: 0.3,
                  borderDash: [4, 4],
                  pointBackgroundColor: "#DEDEDE",
                  pointRadius: 2,
                },
              ],
            }}
            height={200}
            options={{ scales: { y: { ticks: { callback: (v: string | number) => `${v}%` } } } }}
          />
        </div>
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            당기손익률 추이
          </div>
          <LineChart
            data={{
              labels: MONTH_LABELS,
              datasets: [
                {
                  label: "당기",
                  data: filterBySelected(netMarginRate?.current),
                  borderColor: "#E0301E",
                  fill: false,
                  tension: 0.3,
                  pointBackgroundColor: "#E0301E",
                  pointRadius: 3,
                  spanGaps: true,
                },
                {
                  label: "전기",
                  data: netMarginRate?.prior || [],
                  borderColor: "#DEDEDE",
                  fill: false,
                  tension: 0.3,
                  borderDash: [4, 4],
                  pointBackgroundColor: "#DEDEDE",
                  pointRadius: 2,
                },
              ],
            }}
            height={200}
            options={{ scales: { y: { ticks: { callback: (v: string | number) => `${v}%` } } } }}
          />
        </div>
      </div>

      {/* 손익 Waterfall Chart */}
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        손익 Waterfall
      </div>
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
        <div className="text-[10px] text-gray-400 mb-3">
          선택한 연월 간의 손익항목 변화 흐름을 시각적으로 볼 수 있는 그래프 입니다.
        </div>
        {(() => {
          const waterfallItems = plItems.filter(
            (p) => p.level === 0 && p.current !== 0
          );
          if (waterfallItems.length === 0) return <div className="text-xs text-gray-400 text-center py-8">데이터 없음</div>;

          const labels = waterfallItems.map((p) => p.account);
          // Build waterfall: positive = increase, negative = decrease
          const increases: (number | null)[] = [];
          const decreases: (number | null)[] = [];
          const totals: (number | null)[] = [];

          waterfallItems.forEach((item, i) => {
            const val = Math.round(item.current / 1e6);
            const isTotal = item.account === "매출액" || item.account === "매출총이익" || item.account === "영업이익" || item.account === "당기순손익" || item.account === "당기순이익";
            if (isTotal) {
              totals.push(val);
              increases.push(null);
              decreases.push(null);
            } else if (val >= 0) {
              increases.push(val);
              decreases.push(null);
              totals.push(null);
            } else {
              decreases.push(val);
              increases.push(null);
              totals.push(null);
            }
          });

          return (
            <BarChart
              data={{
                labels,
                datasets: [
                  {
                    label: "증가",
                    data: increases,
                    backgroundColor: "#EB8C00",
                    borderRadius: 2,
                  },
                  {
                    label: "감소",
                    data: decreases,
                    backgroundColor: "#2D2D2D",
                    borderRadius: 2,
                  },
                  {
                    label: "합계",
                    data: totals,
                    backgroundColor: "#D04A02",
                    borderRadius: 2,
                  },
                ],
              }}
              height={300}
              options={{
                plugins: { legend: { display: true, position: "top" as const } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                  y: { grid: { color: "#F0F0F0" } },
                },
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}

/* ---------- PL 추이분석 ---------- */

function PLTrendTab({
  plTrend,
  plItems,
}: {
  plTrend: PLTrendAccount[];
  plItems: PLItem[];
}) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const sgaAccounts = useMemo(() => {
    if (plTrend.length > 0) return plTrend;
    return [];
  }, [plTrend]);

  const currentYear = new Date().getFullYear();

  const handleChartClick = useCallback(
    (monthIndex: number, accountName: string) => {
      const monthKey = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}`;
      setSelectedMonth(monthKey);
      setSelectedAccount(accountName);
      setJournalLoading(true);
      fetchPLJournal(monthKey, "", 100)
        .then((data) => setJournalEntries(data.entries))
        .catch(console.error)
        .finally(() => setJournalLoading(false));
    },
    [currentYear]
  );

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        월별 손익 Trend
      </div>
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4">
        <p className="text-xs text-gray-500 mb-2">
          라인차트의 데이터 포인트를 클릭하면 해당월의 기표 내역을 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sgaAccounts.map((acc, i) => (
          <div
            key={i}
            className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4"
          >
            <div className="text-xs font-semibold text-[#2D2D2D] mb-2">
              {acc.account}
            </div>
            <LineChart
              data={{
                labels: MONTH_LABELS,
                datasets: [
                  {
                    label: `${currentYear}`,
                    data: acc.current,
                    borderColor: "#D04A02",
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: "#D04A02",
                    pointHoverRadius: 6,
                    borderWidth: 1.5,
                    tension: 0.3,
                  },
                  {
                    label: `${currentYear - 1}`,
                    data: acc.prior,
                    borderColor: "#DEDEDE",
                    fill: false,
                    pointRadius: 2,
                    pointBackgroundColor: "#DEDEDE",
                    borderDash: [3, 3],
                    borderWidth: 1.5,
                    tension: 0.3,
                  },
                ],
              }}
              height={140}
              options={{
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                  y: { grid: { color: "#F0F0F0" }, ticks: { font: { size: 8 } } },
                },
                onClick: (_event: unknown, elements: Array<{ index: number }>) => {
                  if (elements.length > 0) {
                    handleChartClick(elements[0].index, acc.account);
                  }
                },
              }}
            />
          </div>
        ))}
      </div>

      {/* Drill-down Journal Table */}
      {selectedMonth && (
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
              당기 기표 내역 - {selectedMonth} {selectedAccount && `(${selectedAccount})`}
            </div>
            <button
              onClick={() => {
                setSelectedMonth(null);
                setJournalEntries([]);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded"
            >
              닫기
            </button>
          </div>
          {journalLoading ? (
            <div className="flex items-center justify-center h-20 text-xs text-gray-400">
              로딩 중...
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-[#2D2D2D] text-white">
                    <th className="text-left px-3 py-2 font-medium">일자</th>
                    <th className="text-left px-3 py-2 font-medium">전표번호</th>
                    <th className="text-left px-3 py-2 font-medium">거래처</th>
                    <th className="text-left px-3 py-2 font-medium">계정과목</th>
                    <th className="text-left px-3 py-2 font-medium">적요</th>
                    <th className="text-right px-3 py-2 font-medium">차변</th>
                    <th className="text-right px-3 py-2 font-medium">대변</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        기표 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((entry, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5 whitespace-nowrap">{entry.date}</td>
                        <td className="px-3 py-1.5 font-mono whitespace-nowrap">{entry.voucherNo}</td>
                        <td className="px-3 py-1.5">{entry.customer}</td>
                        <td className="px-3 py-1.5">{entry.account}</td>
                        <td className="px-3 py-1.5 truncate max-w-[200px]">{entry.memo}</td>
                        <td className="text-right px-3 py-1.5 tabular-nums">
                          {entry.debit ? formatNumber(entry.debit) : ""}
                        </td>
                        <td className="text-right px-3 py-1.5 tabular-nums">
                          {entry.credit ? formatNumber(entry.credit) : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- PL 계정분석 ---------- */

function PLAccountTab({
  plItems,
  sales,
}: {
  plItems: PLItem[];
  sales: SalesAnalysis | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        PL 계정분석
      </div>
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4">
        <p className="text-xs text-gray-500 mb-4">
          손익항목에서 계정과목 아래 계정을 직접 선택하여 추이 및 거래처별 당기
          비중 및 거래처별 증감을 확인
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PL Items Table */}
        <div className="lg:col-span-2 bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            손익항목
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-[#2D2D2D] text-white">
                  <th className="text-left px-3 py-2 font-medium">공시용계정</th>
                  <th className="text-right px-3 py-2 font-medium">당기</th>
                  <th className="text-right px-3 py-2 font-medium">전기</th>
                  <th className="text-right px-3 py-2 font-medium">증감</th>
                  <th className="text-right px-3 py-2 font-medium">증감률</th>
                </tr>
              </thead>
              <tbody>
                {plItems.map((item, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      item.highlight ? "bg-orange-50" : ""
                    } ${item.bold ? "font-semibold" : ""}`}
                  >
                    <td
                      className="px-3 py-1.5"
                      style={{ paddingLeft: 12 + item.level * 16 }}
                    >
                      {item.account}
                    </td>
                    <td className="text-right px-3 py-1.5 tabular-nums">
                      {formatNumber(item.current)}
                    </td>
                    <td className="text-right px-3 py-1.5 tabular-nums">
                      {formatNumber(item.prior)}
                    </td>
                    <td className="text-right px-3 py-1.5 tabular-nums">
                      {formatNumber(item.change)}
                    </td>
                    <td
                      className={`text-right px-3 py-1.5 tabular-nums ${changeColor(
                        item.changeRate
                      )}`}
                    >
                      {formatChangeRate(item.changeRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Customer Share */}
        {sales && (
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
              상위 10개 거래처 비중
            </div>
            <DoughnutChart
              data={{
                labels: sales.topCustomerShare.map((c) => c.name),
                datasets: [
                  {
                    data: sales.topCustomerShare.map((c) => c.share),
                    backgroundColor: CHART_COLORS,
                  },
                ],
              }}
              height={300}
            />
            <div className="mt-3 space-y-1">
              {sales.topCustomerShare.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i] }}
                  />
                  <span className="text-gray-600 truncate flex-1">
                    {c.name}
                  </span>
                  <span className="tabular-nums font-medium">
                    {c.share.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 매출분석 ---------- */

function SalesTab({
  sales,
  monthlyRevenue,
  plItems,
}: {
  sales: SalesAnalysis | null;
  monthlyRevenue: MonthlyData | null;
  plItems: PLItem[];
}) {
  if (!sales) return null;

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        매출분석
      </div>

      {/* Header: Revenue, Customer Count, Monthly Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Summary */}
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-xs text-gray-500 mb-1">매출액</div>
          {(() => {
            const rev = plItems.find(p => p.account === "매출액");
            return rev ? (
              <>
                <div className="text-xl font-bold text-[#D04A02] mb-2">
                  {formatMillions(rev.current)}
                  <span className="text-xs font-normal text-gray-400 ml-1">백만</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>전기</span>
                    <span className="tabular-nums">{formatMillions(rev.prior)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>증감</span>
                    <span className="tabular-nums">{formatMillions(rev.change)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>△%</span>
                    <span className={`font-semibold tabular-nums ${changeColor(rev.changeRate)}`}>
                      {formatChangeRate(rev.changeRate)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xl font-bold text-[#D04A02]">-</div>
            );
          })()}
        </div>

        {/* Customer Count */}
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-xs text-gray-500 mb-1">거래처수</div>
          <div className="text-xl font-bold text-[#2D2D2D] mb-2">
            {sales.customerCount.current}
          </div>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>전기</span>
              <span className="tabular-nums">
                {sales.customerCount.prior}
              </span>
            </div>
            <div className="flex justify-between">
              <span>증감</span>
              <span className="tabular-nums">
                {sales.customerCount.change > 0 ? "+" : ""}
                {sales.customerCount.change}
              </span>
            </div>
            <div className="flex justify-between">
              <span>△%</span>
              <span
                className={`font-semibold tabular-nums ${changeColor(
                  sales.customerCount.changeRate
                )}`}
              >
                {formatChangeRate(sales.customerCount.changeRate)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        {monthlyRevenue && (
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-xs text-gray-500 mb-2">매출액 추이</div>
            <BarChart
              data={{
                labels: MONTH_LABELS,
                datasets: [
                  {
                    label: "당기",
                    data: monthlyRevenue.current,
                    backgroundColor: "#D04A02",
                    borderRadius: 2,
                  },
                  {
                    label: "전기",
                    data: monthlyRevenue.prior,
                    backgroundColor: "#DEDEDE",
                    borderRadius: 2,
                  },
                ],
              }}
              height={160}
            />
          </div>
        )}
      </div>

      {/* Doughnut + Increase/Decrease */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 10 Customer Doughnut */}
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            상위 10개 거래처 당기 비중
          </div>
          <div className="flex gap-5 items-center">
            <div className="w-52 flex-shrink-0">
              <DoughnutChart
                data={{
                  labels: sales.topCustomerShare.map((c) => c.name),
                  datasets: [
                    {
                      data: sales.topCustomerShare.map((c) => c.share),
                      backgroundColor: CHART_COLORS,
                    },
                  ],
                }}
                height={200}
                options={{
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="space-y-1 flex-1">
              {sales.topCustomerShare.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i] }}
                  />
                  <span className="text-gray-600 truncate flex-1">
                    {c.name}
                  </span>
                  <span className="tabular-nums">{c.share.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Increase / Decrease Bars */}
        <div className="space-y-4">
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
              상위 매출액 증가 거래처
            </div>
            <BarChart
              data={{
                labels: sales.topIncreaseCustomers.map((c) => c.name),
                datasets: [
                  {
                    label: "증감액",
                    data: sales.topIncreaseCustomers.map((c) =>
                      Math.round(c.amount / 1_000_000)
                    ),
                    backgroundColor: "#D04A02",
                    borderRadius: 2,
                  },
                ],
              }}
              height={160}
              options={{
                indexAxis: "y" as const,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: "#F0F0F0" } },
                  y: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
              }}
            />
          </div>
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
              상위 매출액 감소 거래처
            </div>
            <BarChart
              data={{
                labels: sales.topDecreaseCustomers.map((c) => c.name),
                datasets: [
                  {
                    label: "증감액",
                    data: sales.topDecreaseCustomers.map((c) =>
                      Math.round(c.amount / 1_000_000)
                    ),
                    backgroundColor: "#2B6CB0",
                    borderRadius: 2,
                  },
                ],
              }}
              height={160}
              options={{
                indexAxis: "y" as const,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: "#F0F0F0" } },
                  y: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Journal Entry Table */}
      {sales.journalEntries && sales.journalEntries.length > 0 && (
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4 border-l-[3px] border-[#D04A02] pl-2">
            당기/전기 기표 내역
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-[#2D2D2D] text-white">
                  <th className="text-left px-3 py-2 font-medium">일자</th>
                  <th className="text-left px-3 py-2 font-medium">전표번호</th>
                  <th className="text-left px-3 py-2 font-medium">계정과목</th>
                  <th className="text-left px-3 py-2 font-medium">거래처</th>
                  <th className="text-left px-3 py-2 font-medium">적요</th>
                  <th className="text-right px-3 py-2 font-medium">차변</th>
                  <th className="text-right px-3 py-2 font-medium">대변</th>
                </tr>
              </thead>
              <tbody>
                {sales.journalEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-1.5">{entry.date}</td>
                    <td className="px-3 py-1.5 font-mono">{entry.voucherNo}</td>
                    <td className="px-3 py-1.5">{entry.account}</td>
                    <td className="px-3 py-1.5">{entry.customer}</td>
                    <td className="px-3 py-1.5 truncate max-w-[200px]">
                      {entry.memo}
                    </td>
                    <td className="text-right px-3 py-1.5 tabular-nums">
                      {entry.debit ? formatNumber(entry.debit) : ""}
                    </td>
                    <td className="text-right px-3 py-1.5 tabular-nums">
                      {entry.credit ? formatNumber(entry.credit) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 손익항목 ---------- */

function PLItemsTab({
  quarterlyPL,
}: {
  quarterlyPL: QuarterlyPL | null;
}) {
  const [viewMode, setViewMode] = useState<"annual" | "quarterly" | "monthly">(
    "quarterly"
  );

  if (!quarterlyPL) return null;

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        손익항목
      </div>
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4">
        <p className="text-xs text-gray-500 mb-3">
          단위를 선택하여 손익계산서를 조회합니다.
        </p>
        <div className="flex border border-gray-300 rounded overflow-hidden w-fit">
          {(["annual", "quarterly", "monthly"] as const).map((mode) => {
            const labels = { annual: "연", quarterly: "분기", monthly: "월" };
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-[#D04A02] text-white"
                    : "bg-white text-[#464646] hover:bg-gray-50"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quarterly Chart */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
        <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
          분기별 손익 추이 (백만원)
        </div>
        <BarChart
          data={{
            labels: quarterlyPL.headers.slice(1),
            datasets: quarterlyPL.rows.slice(0, 4).map((row, idx) => ({
              label: row.account,
              data: row.values.map((v) => Math.round(v / 1_000_000)),
              backgroundColor: ["#D04A02", "#7D7D7D", "#E87722", "#464646"][idx] || "#B0B0B0",
              borderRadius: 2,
            })),
          }}
          height={300}
        />
      </div>

      {/* Quarterly Table */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
        <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
          분기별 손익 상세
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2D2D2D] text-white">
                {quarterlyPL.headers.map((h, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2 font-medium ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quarterlyPL.rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-100 ${
                    row.highlight ? "bg-orange-50" : ""
                  } ${row.bold ? "font-semibold" : ""}`}
                >
                  <td className="px-3 py-1.5">{row.account}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="text-right px-3 py-1.5 tabular-nums">
                      {formatNumber(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
