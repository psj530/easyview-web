"use client";

import { useEffect, useState } from "react";
import { fetchScenarios, type Scenarios } from "@/lib/api";
import { formatNumber, formatMillions } from "@/lib/utils";

const SCENARIO_TABS = [
  { key: "scenario1", label: "S1. 동일금액 중복" },
  { key: "scenario2", label: "S2. 부채 후 현금" },
  { key: "scenario3", label: "S3. 주말 현금" },
  { key: "scenario4", label: "S4. 고액 현금" },
  { key: "scenario5", label: "S5. 비용/현금 동시" },
  { key: "scenario6", label: "S6. Seldom Customer" },
] as const;

export default function ScenarioAnalysis() {
  const [scenarios, setScenarios] = useState<Scenarios | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-pwc-gray">데이터를 불러오는 중...</div>;
  if (!scenarios) return null;

  const scenarioKey = SCENARIO_TABS[activeTab].key;

  return (
    <div className="space-y-6">
      {/* Scenario tabs */}
      <div className="flex flex-wrap gap-1 bg-white rounded-md shadow-xs border border-pwc-gray-light p-1">
        {SCENARIO_TABS.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-2 text-xs rounded font-medium transition-colors ${
              activeTab === i
                ? "bg-pwc-orange text-white"
                : "text-pwc-gray-dark hover:bg-pwc-gray-bg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scenario info card */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-pwc-black">
              {scenarios[scenarioKey].title}
            </h3>
            <p className="text-xs text-pwc-gray mt-1">{scenarios[scenarioKey].risk}</p>
          </div>
          <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
            {"count" in scenarios[scenarioKey]
              ? `${(scenarios[scenarioKey] as { count: number }).count}건`
              : `${(scenarios[scenarioKey] as { customers: string[] }).customers.length}건`}
          </div>
        </div>

        {/* Scenario-specific content */}
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

function Scenario1Table({ data }: { data: Scenarios["scenario1"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">기간</th>
            <th className="text-left">계정</th>
            <th className="text-right">금액</th>
            <th className="text-right">차변건수</th>
          </tr>
        </thead>
        <tbody>
          {data.exceptions.map((e, i) => (
            <tr key={i}>
              <td>{e.period}</td>
              <td>{e.account}</td>
              <td className="num">{formatNumber(e.amount)}</td>
              <td className="num">{e.debitCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scenario2Table({ data }: { data: Scenarios["scenario2"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">기간</th>
            <th className="text-right">금액</th>
            <th className="text-right">건수</th>
          </tr>
        </thead>
        <tbody>
          {data.exceptions.map((e, i) => (
            <tr key={i}>
              <td>{e.period}</td>
              <td className="num">{formatNumber(e.amount)}</td>
              <td className="num">{e.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scenario3Table({ data }: { data: Scenarios["scenario3"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">전표번호</th>
            <th className="text-left">계정</th>
            <th className="text-left">거래처</th>
            <th className="text-right">대변금액</th>
            <th className="text-left">일자</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e, i) => (
            <tr key={i}>
              <td className="font-mono">{e.voucher}</td>
              <td>{e.account}</td>
              <td>{e.customer}</td>
              <td className="num">{formatNumber(e.credit)}</td>
              <td>{e.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scenario4Table({ data }: { data: Scenarios["scenario4"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">전표번호</th>
            <th className="text-left">계정</th>
            <th className="text-left">거래처</th>
            <th className="text-right">대변금액</th>
            <th className="text-left">일자</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e, i) => (
            <tr key={i}>
              <td className="font-mono">{e.voucher}</td>
              <td>{e.account}</td>
              <td>{e.customer}</td>
              <td className="num">{formatNumber(e.credit)}</td>
              <td>{e.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scenario5Table({ data }: { data: Scenarios["scenario5"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">전표번호</th>
            <th className="text-right">비용금액</th>
            <th className="text-right">현금금액</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e, i) => (
            <tr key={i}>
              <td className="font-mono">{e.voucher}</td>
              <td className="num">{formatNumber(e.expenseAmt)}</td>
              <td className="num">{formatNumber(e.cashAmt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scenario6Table({ data }: { data: Scenarios["scenario6"] }) {
  return (
    <div>
      <div className="text-xs text-pwc-gray mb-3">
        총 {data.customers.length}개 거래처
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {data.customers.map((c, i) => (
          <div
            key={i}
            className="bg-pwc-gray-bg rounded px-3 py-2 text-xs text-pwc-gray-dark truncate"
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
