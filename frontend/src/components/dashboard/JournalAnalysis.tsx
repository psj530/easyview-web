"use client";

import { useEffect, useState } from "react";
import { fetchJournal, type JournalSummary } from "@/lib/api";
import { formatNumber, formatMillions } from "@/lib/utils";
import BarChart from "@/components/charts/BarChart";
import DoughnutChart from "@/components/charts/DoughnutChart";

export default function JournalAnalysis() {
  const [journal, setJournal] = useState<JournalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournal()
      .then(setJournal)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-pwc-gray">데이터를 불러오는 중...</div>;
  if (!journal) return null;

  const colors = [
    "#D04A02", "#E87722", "#FFB347", "#7D7D7D", "#464646",
    "#A33B01", "#C76B2E", "#D4956A", "#B0B0B0", "#555555",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5 text-center">
          <div className="text-xs text-pwc-gray mb-1">총 전표 수</div>
          <div className="text-2xl font-bold text-pwc-orange">
            {formatNumber(journal.totalEntries)}
          </div>
        </div>
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5 text-center">
          <div className="text-xs text-pwc-gray mb-1">총 차변 합계</div>
          <div className="text-2xl font-bold text-pwc-black">
            {formatMillions(journal.totalDebit)}
            <span className="text-xs font-normal text-pwc-gray ml-1">백만원</span>
          </div>
        </div>
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5 text-center">
          <div className="text-xs text-pwc-gray mb-1">총 대변 합계</div>
          <div className="text-2xl font-bold text-pwc-black">
            {formatMillions(journal.totalCredit)}
            <span className="text-xs font-normal text-pwc-gray ml-1">백만원</span>
          </div>
        </div>
      </div>

      {/* Top Accounts Chart */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">대변 기준 Top 계정 (백만원)</div>
        <BarChart
          data={{
            labels: journal.topAccountsByCredit.map((a) => a.account),
            datasets: [
              {
                label: "대변 금액",
                data: journal.topAccountsByCredit.map((a) => Math.round(a.amount / 1_000_000)),
                backgroundColor: "#D04A02",
              },
            ],
          }}
          height={350}
        />
      </div>

      {/* Top Accounts Table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">대변 기준 Top 계정 상세</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">순위</th>
                <th className="text-left">계정</th>
                <th className="text-right">금액 (백만원)</th>
              </tr>
            </thead>
            <tbody>
              {journal.topAccountsByCredit.map((a, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{a.account}</td>
                  <td className="num">{formatMillions(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers by Credit */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">대변 기준 거래처 비중</div>
        <DoughnutChart
          data={{
            labels: journal.topCustomersByCredit.map((c) => c.name),
            datasets: [
              {
                data: journal.topCustomersByCredit.map((c) => c.share),
                backgroundColor: colors,
              },
            ],
          }}
          height={300}
        />
      </div>

      {/* Customers table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">대변 기준 거래처 상세</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">순위</th>
                <th className="text-left">거래처</th>
                <th className="text-right">비중 (%)</th>
              </tr>
            </thead>
            <tbody>
              {journal.topCustomersByCredit.map((c, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{c.name}</td>
                  <td className="num">{c.share.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
