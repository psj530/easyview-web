"use client";

import { useEffect, useState, useMemo } from "react";
import {
  fetchBS,
  fetchBSAccountDetail,
  type BSItem,
  type BSTrend,
  type ActivityMetrics,
  type PeriodType,
  type BSCompareType,
  type SummaryKPI,
  type BSAccountDetail,
} from "@/lib/api";
import {
  formatMillions,
  formatNumber,
  formatPercent,
  formatChangeRate,
  changeColor,
  formatMonthLabel,
} from "@/lib/utils";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";

/* ---------- Types ---------- */

interface BSAnalysisProps {
  period: PeriodType;
  bsCompare: BSCompareType;
  month: string;
  onMonthChange: (m: string) => void;
  availableMonths: string[];
  initialSubTab?: number;
}

const SUB_TABS = ["BS 요약", "BS 추이분석", "BS 계정분석"];

/* ---------- Main Component ---------- */

export default function BSAnalysis({
  period,
  bsCompare,
  month,
  onMonthChange,
  availableMonths,
  initialSubTab,
}: BSAnalysisProps) {
  const [subTab, setSubTab] = useState(initialSubTab ?? 0);
  const [bsItems, setBsItems] = useState<BSItem[]>([]);
  const [bsTrend, setBsTrend] = useState<BSTrend | null>(null);
  const [activity, setActivity] = useState<ActivityMetrics | null>(null);
  const [equity, setEquity] = useState<SummaryKPI | null>(null);
  const [financialRatios, setFinancialRatios] = useState<{
    labels: string[];
    currentRatio: number[];
    quickRatio: number[];
    debtRatio: number[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBS({ period, month, bsCompare })
      .then((data) => {
        setBsItems(data.bsItems);
        setBsTrend(data.bsTrend);
        setActivity(data.activityMetrics);
        setEquity(data.equity || null);
        setFinancialRatios(data.financialRatios || null);
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

  return (
    <div className="space-y-6">
      {/* Sub-nav bar with month selector */}
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
      </div>

      {subTab === 0 && (
        <BSSummaryTab
          bsItems={bsItems}
          bsTrend={bsTrend}
          activity={activity}
          equity={equity}
          financialRatios={financialRatios}
        />
      )}
      {subTab === 1 && (
        <BSTrendTab bsItems={bsItems} bsTrend={bsTrend} month={month} period={period} />
      )}
      {subTab === 2 && (
        <BSAccountTab bsItems={bsItems} month={month} period={period} />
      )}
    </div>
  );
}

/* ---------- BS 요약 ---------- */

function BSSummaryTab({
  bsItems,
  bsTrend,
  activity,
  equity,
  financialRatios,
}: {
  bsItems: BSItem[];
  bsTrend: BSTrend | null;
  activity: ActivityMetrics | null;
  equity: SummaryKPI | null;
  financialRatios: {
    labels: string[];
    currentRatio: number[];
    quickRatio: number[];
    debtRatio: number[];
  } | null;
}) {
  // Extract assets, liabilities totals from bsItems
  const assetsTotal = bsItems.find(
    (b) => b.level === 0 && (b.category === "자산" || b.category === "자산총계")
  );
  const liabTotal = bsItems.find(
    (b) => b.level === 0 && (b.category === "부채" || b.category === "부채총계")
  );

  const metricCards = [
    {
      label: "자산",
      color: "#A05E37",
      current: assetsTotal?.endBal ?? 0,
      beginBal: assetsTotal?.beginBal ?? 0,
      changeRate: assetsTotal?.changeRate ?? 0,
    },
    {
      label: "부채",
      color: "#D93954",
      current: liabTotal?.endBal ?? 0,
      beginBal: liabTotal?.beginBal ?? 0,
      changeRate: liabTotal?.changeRate ?? 0,
    },
    {
      label: "자본",
      color: "#D04A02",
      current: equity?.current ?? (assetsTotal?.endBal ?? 0) - (liabTotal?.endBal ?? 0),
      beginBal: equity?.prior ?? (assetsTotal?.beginBal ?? 0) - (liabTotal?.beginBal ?? 0),
      changeRate: equity?.changeRate ?? 0,
    },
  ];

  const trendLabels = bsTrend?.labels.map(
    (l) => l.replace("20", "").replace("-", "년 ") + "월"
  ) || [];

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        자산, 부채, 자본 증감 및 추이
      </div>

      {/* Metric Cards + Trend Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: 3 Metric Cards */}
        <div className="space-y-4">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5"
            >
              <div className="text-xs text-gray-500 mb-1">{card.label}</div>
              <div
                className="text-xl font-bold mb-2"
                style={{ color: card.color }}
              >
                {formatMillions(card.current)}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  백만
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>당기 기초 금액</span>
                  <span className="tabular-nums">
                    {formatMillions(card.beginBal)}
                  </span>
                </div>
                <div className="flex justify-end">
                  <span
                    className={`font-semibold ${changeColor(card.changeRate)}`}
                  >
                    {formatChangeRate(card.changeRate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Stacked Area Charts */}
        <div className="lg:col-span-2 space-y-4">
          {bsTrend && (
            <>
              <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
                <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
                  자산추이
                </div>
                <LineChart
                  data={{
                    labels: trendLabels,
                    datasets: [
                      {
                        label: "유동",
                        data: bsTrend.assets.current,
                        backgroundColor: "rgba(235,140,0,0.4)",
                        borderColor: "#EB8C00",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 1,
                      },
                      {
                        label: "비유동",
                        data: bsTrend.assets.nonCurrent,
                        backgroundColor: "rgba(208,74,2,0.3)",
                        borderColor: "#D04A02",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 1,
                      },
                    ],
                  }}
                  height={180}
                  options={{
                    scales: {
                      y: { stacked: true, grid: { color: "#F0F0F0" } },
                      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                    },
                  }}
                />
              </div>
              <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
                <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
                  부채추이
                </div>
                <LineChart
                  data={{
                    labels: trendLabels,
                    datasets: [
                      {
                        label: "유동",
                        data: bsTrend.liabilities.current,
                        backgroundColor: "rgba(217,57,84,0.3)",
                        borderColor: "#D93954",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 1,
                      },
                      {
                        label: "비유동",
                        data: bsTrend.liabilities.nonCurrent,
                        backgroundColor: "rgba(217,57,84,0.15)",
                        borderColor: "#E88B9A",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 1,
                      },
                    ],
                  }}
                  height={180}
                  options={{
                    scales: {
                      y: { stacked: true, grid: { color: "#F0F0F0" } },
                      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                    },
                  }}
                />
              </div>
              <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
                <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
                  자본추이
                </div>
                <LineChart
                  data={{
                    labels: trendLabels,
                    datasets: [
                      {
                        label: "자본",
                        data: bsTrend.equity,
                        backgroundColor: "rgba(235,140,0,0.3)",
                        borderColor: "#EB8C00",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 1,
                      },
                    ],
                  }}
                  height={180}
                  options={{
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                      y: { grid: { color: "#F0F0F0" } },
                    },
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Financial Ratios */}
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        재무 지표
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
            당좌비율, 유동비율 추이
          </div>
          {financialRatios ? (
            <LineChart
              data={{
                labels: financialRatios.labels,
                datasets: [
                  {
                    label: "당좌비율",
                    data: financialRatios.quickRatio,
                    borderColor: "#D04A02",
                    fill: false,
                    pointBackgroundColor: "#D04A02",
                    pointRadius: 2,
                    tension: 0.3,
                  },
                  {
                    label: "유동비율",
                    data: financialRatios.currentRatio,
                    borderColor: "#EB8C00",
                    fill: false,
                    pointBackgroundColor: "#EB8C00",
                    pointRadius: 2,
                    tension: 0.3,
                  },
                ],
              }}
              height={250}
              options={{
                scales: {
                  y: {
                    ticks: {
                      callback: (v: string | number) => `${v}%`,
                    },
                    grid: { color: "#F0F0F0" },
                  },
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                },
              }}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
              데이터 없음
            </div>
          )}
        </div>
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
            부채비율 추이
          </div>
          {financialRatios ? (
            <LineChart
              data={{
                labels: financialRatios.labels,
                datasets: [
                  {
                    label: "부채비율",
                    data: financialRatios.debtRatio,
                    borderColor: "#D93954",
                    fill: false,
                    pointBackgroundColor: "#D93954",
                    pointRadius: 2,
                    tension: 0.3,
                  },
                ],
              }}
              height={250}
              options={{
                scales: {
                  y: {
                    ticks: {
                      callback: (v: string | number) => `${v}%`,
                    },
                    grid: { color: "#F0F0F0" },
                  },
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                },
              }}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
              데이터 없음
            </div>
          )}
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        활동성 지표
      </div>
      {activity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  매출채권회전일수
                </div>
                <div className="text-3xl font-bold text-[#D04A02]">
                  {activity.arTurnover.days}
                  <span className="text-sm font-normal ml-1">일</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>평균매출채권잔액</span>
                <span className="tabular-nums">
                  {formatNumber(activity.arTurnover.avgBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>일평균매출액</span>
                <span className="tabular-nums">
                  {formatNumber(activity.arTurnover.dailyRevenue)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">
                  재고자산회전일수
                </div>
                <div className="text-3xl font-bold text-[#D04A02]">
                  {activity.inventoryTurnover.days}
                  <span className="text-sm font-normal ml-1">일</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>평균재고자산잔액</span>
                <span className="tabular-nums">
                  {formatNumber(activity.inventoryTurnover.avgBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>일평균매출원가</span>
                <span className="tabular-nums">
                  {formatNumber(activity.inventoryTurnover.dailyCOGS)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- BS 추이분석 ---------- */

function BSTrendTab({
  bsItems,
  bsTrend,
  month,
  period,
}: {
  bsItems: BSItem[];
  bsTrend: BSTrend | null;
  month: string;
  period: PeriodType;
}) {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountDetail, setAccountDetail] = useState<BSAccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Level-2 accounts for the dropdown
  const accounts = useMemo(
    () => bsItems.filter((b) => b.level >= 1 && b.level <= 2).map((b) => b.category),
    [bsItems]
  );

  useEffect(() => {
    if (!selectedAccount) return;
    setDetailLoading(true);
    fetchBSAccountDetail(selectedAccount, { period, month })
      .then(setAccountDetail)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedAccount, period, month]);

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        BS 추이분석
      </div>

      {/* Account selector */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4 flex items-center gap-3">
        <label className="text-xs text-gray-500">계정 선택:</label>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white min-w-[200px]"
        >
          <option value="">계정을 선택하세요</option>
          {accounts.map((acc) => (
            <option key={acc} value={acc}>
              {acc}
            </option>
          ))}
        </select>
      </div>

      {/* Daily Balance Trend */}
      {detailLoading && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          로딩 중...
        </div>
      )}
      {accountDetail && !detailLoading && (
        <>
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
            <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
              잔액 추이 - {selectedAccount}
            </div>
            <LineChart
              data={{
                labels: accountDetail.labels,
                datasets: [
                  {
                    label: "잔액",
                    data: accountDetail.balances,
                    borderColor: "#D04A02",
                    backgroundColor: "rgba(208,74,2,0.1)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 1,
                  },
                ],
              }}
              height={300}
            />
          </div>

          {/* Counterparty composition */}
          {accountDetail.counterparties.length > 0 && (
            <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
              <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
                거래처별 구성 - {selectedAccount}
              </div>
              <BarChart
                data={{
                  labels: accountDetail.counterparties.map((c) => c.name),
                  datasets: [
                    {
                      label: "금액",
                      data: accountDetail.counterparties.map((c) =>
                        Math.round(c.amount / 1_000_000)
                      ),
                      backgroundColor: "#D04A02",
                      borderRadius: 2,
                    },
                  ],
                }}
                height={300}
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
          )}
        </>
      )}

      {!selectedAccount && (
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-10 text-center text-xs text-gray-400">
          계정을 선택하면 잔액 추이와 거래처별 구성을 확인할 수 있습니다.
        </div>
      )}
    </div>
  );
}

/* ---------- BS 계정분석 ---------- */

function BSAccountTab({
  bsItems,
  month,
  period,
}: {
  bsItems: BSItem[];
  month: string;
  period: PeriodType;
}) {
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accountDetail, setAccountDetail] = useState<BSAccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Determine max level to show
  const maxLevel = useMemo(() => {
    let max = 1;
    expandedLevels.forEach(() => {
      max = Math.max(max, 3);
    });
    return max;
  }, [expandedLevels]);

  const visibleItems = useMemo(() => {
    // Show all items, filtering by current expanded state
    return bsItems.filter((item) => {
      if (item.level <= 1) return true;
      // Show level 2+ only if parent category is expanded
      return expandedLevels.size > 0;
    });
  }, [bsItems, expandedLevels]);

  useEffect(() => {
    if (!selectedAccount) return;
    setDetailLoading(true);
    fetchBSAccountDetail(selectedAccount, { period, month })
      .then(setAccountDetail)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedAccount, period, month]);

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        계정별 증감분석
      </div>
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4">
        <p className="text-xs text-gray-500">
          재무항목에서 계정을 선택하여 상세계정, 잔액 추이 및 거래처별 증감을
          확인합니다.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setExpandedLevels(new Set())}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Drill-up
          </button>
          <button
            onClick={() => setExpandedLevels(new Set(["all"]))}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Drill-down
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BS Table */}
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            재무상태표
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-[#2D2D2D] text-white">
                  <th className="text-left px-3 py-2 font-medium">분류</th>
                  <th className="text-right px-3 py-2 font-medium">기말</th>
                  <th className="text-right px-3 py-2 font-medium">기초</th>
                  <th className="text-right px-3 py-2 font-medium">증감</th>
                </tr>
              </thead>
              <tbody>
                {bsItems
                  .filter(
                    (item) =>
                      item.level <= 1 || expandedLevels.has("all")
                  )
                  .map((item, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 cursor-pointer hover:bg-orange-50 ${
                        item.bold ? "font-semibold" : ""
                      } ${
                        selectedAccount === item.category
                          ? "bg-orange-100"
                          : ""
                      }`}
                      onClick={() => setSelectedAccount(item.category)}
                    >
                      <td
                        className="px-3 py-1.5"
                        style={{ paddingLeft: 12 + item.level * 16 }}
                      >
                        {item.category}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">
                        {formatNumber(item.endBal)}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">
                        {formatNumber(item.beginBal)}
                      </td>
                      <td
                        className={`text-right px-3 py-1.5 tabular-nums ${changeColor(
                          item.change
                        )}`}
                      >
                        {formatNumber(item.change)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {detailLoading && (
            <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-10 text-center text-xs text-gray-400">
              로딩 중...
            </div>
          )}
          {accountDetail && !detailLoading && (
            <>
              {/* Balance Trend */}
              <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
                <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
                  잔액 추이 - {selectedAccount}
                </div>
                <LineChart
                  data={{
                    labels: accountDetail.labels,
                    datasets: [
                      {
                        label: "잔액",
                        data: accountDetail.balances,
                        borderColor: "#D04A02",
                        backgroundColor: "rgba(208,74,2,0.1)",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 1,
                      },
                    ],
                  }}
                  height={220}
                />
              </div>

              {/* Counterparty Change */}
              {accountDetail.counterparties.length > 0 && (
                <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
                  <div className="text-sm font-semibold text-[#2D2D2D] mb-3">
                    거래처별 증감 - {selectedAccount}
                  </div>
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0">
                        <tr className="bg-[#2D2D2D] text-white">
                          <th className="text-left px-3 py-2 font-medium">
                            거래처
                          </th>
                          <th className="text-right px-3 py-2 font-medium">
                            금액
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountDetail.counterparties.map((c, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-100"
                          >
                            <td className="px-3 py-1.5">{c.name}</td>
                            <td
                              className={`text-right px-3 py-1.5 tabular-nums ${changeColor(
                                c.amount
                              )}`}
                            >
                              {formatNumber(c.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          {!selectedAccount && !detailLoading && (
            <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-10 text-center text-xs text-gray-400">
              좌측 테이블에서 계정을 클릭하면 상세 분석을 확인할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
