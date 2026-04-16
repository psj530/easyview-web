"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchScenarios, type Scenarios, type PeriodType } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

/* ---------- Types ---------- */

interface ScenarioAnalysisProps {
  period: PeriodType;
  month: string;
  initialSubTab?: number;
}

const SCENARIO_TABS = [
  {
    key: "scenario1" as const,
    label: "S1. 동일금액 중복",
    risk: "동일한 금액이 동일 계정과목에 반복적으로 기표되어 중복 지급의 위험이 있는 전표",
  },
  {
    key: "scenario2" as const,
    label: "S2. 현금지급후 부채인식",
    risk: "현금이 먼저 지급된 후 부채가 인식되어, 허위 부채 계상 또는 자금 유출 위험이 있는 전표",
  },
  {
    key: "scenario3" as const,
    label: "S3. 주말 현금지급",
    risk: "주말 또는 공휴일에 현금이 지급되어 비정상적인 자금 유출 위험이 있는 전표",
  },
  {
    key: "scenario4" as const,
    label: "S4. 고액 현금지급",
    risk: "일정 기준 금액 이상의 고액 현금이 지급되어 횡령 또는 비정상 거래 위험이 있는 전표",
  },
  {
    key: "scenario5" as const,
    label: "S5. 현금지급 및 비용인식",
    risk: "현금 지급과 비용 인식이 동시에 발생하여 허위 비용 처리의 위험이 있는 전표",
  },
  {
    key: "scenario6" as const,
    label: "S6. Seldom Customer",
    risk: "거래 빈도가 극히 낮은 거래처로, 가공 거래처 또는 비정상 거래의 위험이 있는 거래처",
  },
];

/* ---------- Date Helpers ---------- */

function getDefaultDateRange(month: string): { from3m: string; fromMonth: string; to: string } {
  // month = "2025-09"
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Current month start
  const fromMonth = `${y}-${String(m).padStart(2, "0")}-01`;

  // 3 months back
  let m3 = m - 2;
  let y3 = y;
  if (m3 <= 0) { m3 += 12; y3 -= 1; }
  const from3m = `${y3}-${String(m3).padStart(2, "0")}-01`;

  return { from3m, fromMonth, to };
}

type FilterMode = "3m" | "month" | "all";

/* ---------- Main Component ---------- */

export default function ScenarioAnalysis({
  period,
  month,
  initialSubTab,
}: ScenarioAnalysisProps) {
  const [scenarios, setScenarios] = useState<Scenarios | null>(null);
  const [activeTab, setActiveTab] = useState(initialSubTab ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const defaults = useMemo(() => getDefaultDateRange(month), [month]);
  const [filterMode, setFilterMode] = useState<FilterMode>("3m");
  const [dateFrom, setDateFrom] = useState(defaults.from3m);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [autoNarrowed, setAutoNarrowed] = useState(false);

  // Reset dates when month changes
  useEffect(() => {
    const d = getDefaultDateRange(month);
    setDateFrom(d.from3m);
    setDateTo(d.to);
    setFilterMode("3m");
    setAutoNarrowed(false);
  }, [month]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchScenarios({
      period,
      month,
      dateFrom: filterMode === "all" ? undefined : dateFrom || undefined,
      dateTo: filterMode === "all" ? undefined : dateTo || undefined,
      amountMin: amountMin ? Number(amountMin) : undefined,
      amountMax: amountMax ? Number(amountMax) : undefined,
    })
      .then((data) => {
        setScenarios(data);

        // Auto-narrow: if 3m filter yields 100+ results, switch to current month
        if (filterMode === "3m" && !autoNarrowed) {
          const scenarioKey = SCENARIO_TABS[activeTab].key;
          const scenarioData = data[scenarioKey];
          let count = 0;
          if ("count" in scenarioData) count = (scenarioData as { count: number }).count;
          else if ("entries" in scenarioData) count = ((scenarioData as { entries: unknown[] }).entries || []).length;
          else if ("exceptions" in scenarioData) count = ((scenarioData as { exceptions: unknown[] }).exceptions || []).length;

          if (count > 100) {
            const d = getDefaultDateRange(month);
            setDateFrom(d.fromMonth);
            setFilterMode("month");
            setAutoNarrowed(true);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, [period, month, dateFrom, dateTo, amountMin, amountMax, filterMode, activeTab, autoNarrowed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterMode = (mode: FilterMode) => {
    const d = getDefaultDateRange(month);
    setFilterMode(mode);
    setAutoNarrowed(true); // prevent auto-narrowing after manual change
    if (mode === "3m") {
      setDateFrom(d.from3m);
      setDateTo(d.to);
    } else if (mode === "month") {
      setDateFrom(d.fromMonth);
      setDateTo(d.to);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

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

  if (!scenarios) return null;

  const scenarioMeta = SCENARIO_TABS[activeTab];
  const scenarioKey = scenarioMeta.key;

  const getCount = () => {
    const data = scenarios[scenarioKey];
    if ("count" in data) return (data as { count: number }).count;
    if ("customers" in data) return (data as { customers: string[] }).customers.length;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Scenario tabs */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-2 sticky top-[104px] z-30">
        <div className="flex flex-wrap gap-1">
          {SCENARIO_TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(i); setAutoNarrowed(false); }}
              className={`px-3 py-2 text-xs rounded font-medium transition-colors ${
                activeTab === i
                  ? "bg-[#2D2D2D] text-white"
                  : "text-[#464646] hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range, amount filters, and quick filter buttons */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-4 flex flex-wrap items-center gap-3">
        {/* Quick filter buttons */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => handleFilterMode("month")}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              filterMode === "month"
                ? "bg-[#D04A02] text-white border-[#D04A02]"
                : "bg-white text-[#464646] border-[#E8E8E8] hover:border-[#D04A02]"
            }`}
          >
            당월
          </button>
          <button
            onClick={() => handleFilterMode("3m")}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              filterMode === "3m"
                ? "bg-[#D04A02] text-white border-[#D04A02]"
                : "bg-white text-[#464646] border-[#E8E8E8] hover:border-[#D04A02]"
            }`}
          >
            직전 3개월
          </button>
          <button
            onClick={() => handleFilterMode("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              filterMode === "all"
                ? "bg-[#D04A02] text-white border-[#D04A02]"
                : "bg-white text-[#464646] border-[#E8E8E8] hover:border-[#D04A02]"
            }`}
          >
            전체기간
          </button>
        </div>

        <div className="h-5 w-px bg-[#E8E8E8]" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">기간:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setFilterMode("3m"); setAutoNarrowed(true); }}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setFilterMode("3m"); setAutoNarrowed(true); }}
            className="text-xs border border-gray-300 rounded px-2 py-1.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">금액:</label>
          <input
            type="number"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            placeholder="최소"
            className="text-xs border border-gray-300 rounded px-2 py-1.5 w-28"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="number"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            placeholder="최대"
            className="text-xs border border-gray-300 rounded px-2 py-1.5 w-28"
          />
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            handleFilterMode("3m");
            setAmountMin("");
            setAmountMax("");
            setAutoNarrowed(false);
          }}
          className="ml-auto px-3 py-1.5 text-xs text-[#7D7D7D] hover:text-[#D04A02] border border-[#E8E8E8] rounded hover:border-[#D04A02] transition-colors"
        >
          필터 초기화
        </button>
      </div>

      {/* Scenario info card */}
      <div className="bg-white rounded-md shadow-xs border border-[#E8E8E8] p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#2D2D2D]">
              {scenarios[scenarioKey].title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{scenarioMeta.risk}</p>
          </div>
          <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0">
            {getCount()}건
          </div>
        </div>

        {scenarioKey === "scenario1" && <Scenario1Table data={scenarios.scenario1} />}
        {scenarioKey === "scenario2" && <Scenario2Table data={scenarios.scenario2} />}
        {scenarioKey === "scenario3" && <Scenario3Table data={scenarios.scenario3} />}
        {scenarioKey === "scenario4" && <Scenario4Table data={scenarios.scenario4} />}
        {scenarioKey === "scenario5" && <Scenario5Table data={scenarios.scenario5} />}
        {scenarioKey === "scenario6" && <Scenario6Table data={scenarios.scenario6} />}
      </div>
    </div>
  );
}

/* ---------- Scenario Tables ---------- */

function Scenario1Table({ data }: { data: Scenarios["scenario1"] }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        Exception 요약 ({data.count}건)
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-[#2D2D2D] text-white">
              <th className="text-left px-3 py-2 font-medium">기간</th>
              <th className="text-left px-3 py-2 font-medium">계정</th>
              <th className="text-right px-3 py-2 font-medium">금액</th>
              <th className="text-right px-3 py-2 font-medium">차변건수</th>
            </tr>
          </thead>
          <tbody>
            {data.exceptions.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5">{e.period}</td>
                <td className="px-3 py-1.5">{e.account}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{formatNumber(e.amount)}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{e.debitCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scenario2Table({ data }: { data: Scenarios["scenario2"] }) {
  const entries = "entries" in data ? (data as unknown as { entries: Array<{ voucher: string; date: string; amount: number; cashAccount: string; liabilityAccount: string; customer: string }> }).entries : [];

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        상세 전표 내역 ({data.count}건)
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-[#2D2D2D] text-white">
              <th className="text-left px-3 py-2 font-medium">전표번호</th>
              <th className="text-left px-3 py-2 font-medium">일자</th>
              <th className="text-left px-3 py-2 font-medium">현금계정</th>
              <th className="text-left px-3 py-2 font-medium">부채계정</th>
              <th className="text-right px-3 py-2 font-medium">금액</th>
              <th className="text-left px-3 py-2 font-medium">거래처</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 font-mono">{e.voucher}</td>
                <td className="px-3 py-1.5">{e.date}</td>
                <td className="px-3 py-1.5">{e.cashAccount}</td>
                <td className="px-3 py-1.5">{e.liabilityAccount}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{formatNumber(e.amount)}</td>
                <td className="px-3 py-1.5">{e.customer}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">해당 기간에 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scenario3Table({ data }: { data: Scenarios["scenario3"] }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        상세 전표 내역 ({data.count}건)
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-[#2D2D2D] text-white">
              <th className="text-left px-3 py-2 font-medium">전표번호</th>
              <th className="text-left px-3 py-2 font-medium">계정</th>
              <th className="text-left px-3 py-2 font-medium">거래처</th>
              <th className="text-right px-3 py-2 font-medium">대변금액</th>
              <th className="text-left px-3 py-2 font-medium">일자</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 font-mono">{e.voucher}</td>
                <td className="px-3 py-1.5">{e.account}</td>
                <td className="px-3 py-1.5">{e.customer}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{formatNumber(e.credit)}</td>
                <td className="px-3 py-1.5">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scenario4Table({ data }: { data: Scenarios["scenario4"] }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        상세 전표 내역 ({data.count}건)
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-[#2D2D2D] text-white">
              <th className="text-left px-3 py-2 font-medium">전표번호</th>
              <th className="text-left px-3 py-2 font-medium">계정</th>
              <th className="text-left px-3 py-2 font-medium">거래처</th>
              <th className="text-right px-3 py-2 font-medium">대변금액</th>
              <th className="text-left px-3 py-2 font-medium">일자</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 font-mono">{e.voucher}</td>
                <td className="px-3 py-1.5">{e.account}</td>
                <td className="px-3 py-1.5">{e.customer}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{formatNumber(e.credit)}</td>
                <td className="px-3 py-1.5">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scenario5Table({ data }: { data: Scenarios["scenario5"] }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        상세 전표 내역 ({data.count}건)
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-[#2D2D2D] text-white">
              <th className="text-left px-3 py-2 font-medium">전표번호</th>
              <th className="text-right px-3 py-2 font-medium">비용금액</th>
              <th className="text-right px-3 py-2 font-medium">현금금액</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1.5 font-mono">{e.voucher}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{formatNumber(e.expenseAmt)}</td>
                <td className="text-right px-3 py-1.5 tabular-nums">{formatNumber(e.cashAmt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scenario6Table({ data }: { data: Scenarios["scenario6"] }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-[#2D2D2D] border-l-[3px] border-[#D04A02] pl-2">
        해당 거래처 목록 ({data.customers.length}개)
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {data.customers.map((c, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded px-3 py-2 text-xs text-[#464646] truncate border border-gray-200"
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
