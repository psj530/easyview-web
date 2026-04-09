"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchJournal,
  fetchJournalSearch,
  type JournalSummary,
  type JournalEntry,
  type PeriodType,
} from "@/lib/api";
import {
  formatNumber,
  formatMillions,
  CHART_COLORS,
} from "@/lib/utils";
import BarChart from "@/components/charts/BarChart";
import DoughnutChart from "@/components/charts/DoughnutChart";

/* ---------- Types ---------- */

interface JournalAnalysisProps {
  period: PeriodType;
  month: string;
}

const SUB_TABS = ["전표분석내역", "전표검색"];

type AnalysisTarget = "entries" | "debit" | "credit";

/* ---------- Main Component ---------- */

export default function JournalAnalysis({
  period,
  month,
}: JournalAnalysisProps) {
  const [subTab, setSubTab] = useState(0);

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-2 flex flex-wrap items-center gap-2 sticky top-[104px] z-30">
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
      </div>

      {subTab === 0 && (
        <JournalAnalysisTab period={period} month={month} />
      )}
      {subTab === 1 && <JournalSearchTab />}
    </div>
  );
}

/* ---------- 전표분석내역 ---------- */

function JournalAnalysisTab({
  period,
  month,
}: {
  period: PeriodType;
  month: string;
}) {
  const [journal, setJournal] = useState<JournalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2025-09-30");
  const [target, setTarget] = useState<AnalysisTarget>("credit");

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchJournal({ period, month, startDate, endDate, target })
      .then(setJournal)
      .catch((err) => {
        console.error(err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [period, month, startDate, endDate, target]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (!journal) return null;

  const targetLabels: Record<AnalysisTarget, string> = {
    entries: "전표수",
    debit: "차변",
    credit: "대변",
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">기간:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
          />
        </div>
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {(["entries", "debit", "credit"] as AnalysisTarget[]).map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                target === t
                  ? "bg-[#D04A02] text-white"
                  : "bg-white text-[#464646] hover:bg-gray-50"
              }`}
            >
              {targetLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        전표분석
      </div>

      {/* Summary Cards + Daily Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Summary Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 text-center">
            <div className="text-xs text-gray-500 mb-1">전표수</div>
            <div className="text-2xl font-bold text-[#D04A02]">
              {formatNumber(journal.totalEntries)}
            </div>
          </div>
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 text-center">
            <div className="text-xs text-gray-500 mb-1">차변합계</div>
            <div className="text-lg font-bold text-[#2D2D2D]">
              {formatMillions(journal.totalDebit)}
              <span className="text-xs font-normal text-gray-400 ml-1">
                백만원
              </span>
            </div>
          </div>
          <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5 text-center">
            <div className="text-xs text-gray-500 mb-1">대변합계</div>
            <div className="text-lg font-bold text-[#2D2D2D]">
              {formatMillions(journal.totalCredit)}
              <span className="text-xs font-normal text-gray-400 ml-1">
                백만원
              </span>
            </div>
          </div>
        </div>

        {/* Right: Daily Credit Chart */}
        <div className="lg:col-span-2 bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            일자별 대변합계액
          </div>
          {journal.dailyCredits && journal.dailyCredits.length > 0 ? (
            <BarChart
              data={{
                labels: journal.dailyCredits.map((d) => d.date),
                datasets: [
                  {
                    label: "대변합계",
                    data: journal.dailyCredits.map((d) =>
                      Math.round(d.amount / 1_000_000)
                    ),
                    backgroundColor: "#D04A02",
                    borderRadius: 1,
                  },
                ],
              }}
              height={280}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 8 }, maxRotation: 45 },
                  },
                  y: { grid: { color: "#F0F0F0" } },
                },
              }}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-xs text-gray-400">
              일별 데이터 없음
            </div>
          )}
        </div>
      </div>

      {/* Account + Customer Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account-level horizontal bar */}
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            계정과목별 대변합계액
          </div>
          <BarChart
            data={{
              labels: journal.topAccountsByCredit.map((a) => a.account),
              datasets: [
                {
                  label: "대변 금액",
                  data: journal.topAccountsByCredit.map((a) =>
                    Math.round(a.amount / 1_000_000)
                  ),
                  backgroundColor: "#D04A02",
                  borderRadius: 2,
                },
              ],
            }}
            height={350}
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

        {/* Top 10 Customer Doughnut */}
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="text-sm font-semibold text-[#2D2D2D] mb-4">
            대변합계액 기준 상위 10개 거래처
          </div>
          <div className="flex gap-5 items-center">
            <div className="w-56 flex-shrink-0">
              <DoughnutChart
                data={{
                  labels: journal.topCustomersByCredit.map((c) => c.name),
                  datasets: [
                    {
                      data: journal.topCustomersByCredit.map((c) => c.share),
                      backgroundColor: CHART_COLORS,
                    },
                  ],
                }}
                height={220}
                options={{
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="space-y-1 flex-1">
              {journal.topCustomersByCredit.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
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
        </div>
      </div>
    </div>
  );
}

/* ---------- 전표검색 ---------- */

function JournalSearchTab() {
  const [searchParams, setSearchParams] = useState({
    startDate: "2024-01-01",
    endDate: "2025-09-30",
    account: "",
    customer: "",
    memo: "",
  });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(() => {
    setLoading(true);
    setSearched(true);
    fetchJournalSearch({ ...searchParams, page, pageSize: 50 })
      .then((data) => {
        setEntries(data.entries);
        setTotalCount(data.totalCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchParams, page]);

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        전표검색
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              시작일
            </label>
            <input
              type="date"
              value={searchParams.startDate}
              onChange={(e) => updateParam("startDate", e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              종료일
            </label>
            <input
              type="date"
              value={searchParams.endDate}
              onChange={(e) => updateParam("endDate", e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              계정과목
            </label>
            <input
              type="text"
              value={searchParams.account}
              onChange={(e) => updateParam("account", e.target.value)}
              placeholder="계정과목 검색"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              거래처
            </label>
            <input
              type="text"
              value={searchParams.customer}
              onChange={(e) => updateParam("customer", e.target.value)}
              placeholder="거래처 검색"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">
              적요
            </label>
            <input
              type="text"
              value={searchParams.memo}
              onChange={(e) => updateParam("memo", e.target.value)}
              placeholder="적요 검색"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-1.5 text-xs font-medium text-white bg-[#D04A02] rounded hover:bg-[#B83F02] transition-colors"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          검색 중...
        </div>
      )}

      {searched && !loading && (
        <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-[#2D2D2D]">
              검색 결과
            </div>
            <div className="text-xs text-gray-500">
              총 {formatNumber(totalCount)}건
            </div>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
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
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-gray-400"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="px-3 py-1.5 font-mono whitespace-nowrap">
                        {entry.voucherNo}
                      </td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 50 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  handleSearch();
                }}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs text-gray-500">
                {page} / {Math.ceil(totalCount / 50)}
              </span>
              <button
                onClick={() => {
                  setPage((p) => p + 1);
                  handleSearch();
                }}
                disabled={page >= Math.ceil(totalCount / 50)}
                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
