"use client";

import { useEffect, useState } from "react";
import {
  fetchPL,
  fetchSales,
  type PLItem,
  type MonthlyData,
  type QuarterlyPL,
  type SalesAnalysis,
} from "@/lib/api";
import { formatMillions, formatChangeRate, changeColor, formatNumber, formatPercent } from "@/lib/utils";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import DoughnutChart from "@/components/charts/DoughnutChart";

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const SUB_TABS = ["PL요약", "PL계정분석", "매출분석", "손익항목"];

export default function PLAnalysis() {
  const [subTab, setSubTab] = useState(0);
  const [plItems, setPlItems] = useState<PLItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData | null>(null);
  const [monthlyOP, setMonthlyOP] = useState<MonthlyData | null>(null);
  const [quarterlyPL, setQuarterlyPL] = useState<QuarterlyPL | null>(null);
  const [sales, setSales] = useState<SalesAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPL(), fetchSales()])
      .then(([plData, salesData]) => {
        setPlItems(plData.plItems);
        setMonthlyRevenue(plData.monthlyRevenue);
        setMonthlyOP(plData.monthlyOperatingProfit);
        setQuarterlyPL(plData.quarterlyPL);
        setSales(salesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-pwc-gray">데이터를 불러오는 중...</div>;

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex gap-1 bg-white rounded-md shadow-xs border border-pwc-gray-light p-1">
        {SUB_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setSubTab(i)}
            className={`px-4 py-2 text-xs rounded font-medium transition-colors ${
              subTab === i
                ? "bg-pwc-orange text-white"
                : "text-pwc-gray-dark hover:bg-pwc-gray-bg"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {subTab === 0 && <PLSummaryTab plItems={plItems} monthlyRevenue={monthlyRevenue} />}
      {subTab === 1 && <PLAccountTab plItems={plItems} />}
      {subTab === 2 && <SalesTab sales={sales} />}
      {subTab === 3 && <PLItemsTab quarterlyPL={quarterlyPL} />}
    </div>
  );
}

function PLSummaryTab({
  plItems,
  monthlyRevenue,
}: {
  plItems: PLItem[];
  monthlyRevenue: MonthlyData | null;
}) {
  return (
    <div className="space-y-6">
      {/* Monthly Revenue Chart */}
      {monthlyRevenue && (
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
          <div className="text-sm font-semibold text-pwc-black mb-4">월별 매출 추이 (백만원)</div>
          <BarChart
            data={{
              labels: MONTHS,
              datasets: [
                {
                  label: "당기",
                  data: monthlyRevenue.current,
                  backgroundColor: "#D04A02",
                },
                {
                  label: "전기",
                  data: monthlyRevenue.prior,
                  backgroundColor: "#E8E8E8",
                },
              ],
            }}
          />
        </div>
      )}

      {/* PL Full Table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">손익계산서</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">계정과목</th>
                <th className="text-right">당기</th>
                <th className="text-right">전기</th>
                <th className="text-right">증감액</th>
                <th className="text-right">증감률</th>
              </tr>
            </thead>
            <tbody>
              {plItems.map((item, i) => (
                <tr
                  key={i}
                  className={`${item.highlight ? "bg-orange-50" : ""} ${item.bold ? "font-semibold" : ""}`}
                >
                  <td style={{ paddingLeft: 12 + item.level * 16 }}>{item.account}</td>
                  <td className="num">{formatMillions(item.current)}</td>
                  <td className="num">{formatMillions(item.prior)}</td>
                  <td className="num">{formatMillions(item.change)}</td>
                  <td className={`num ${changeColor(item.changeRate)}`}>
                    {formatChangeRate(item.changeRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PLAccountTab({ plItems }: { plItems: PLItem[] }) {
  const sgaItems = plItems.filter((item) => item.level === 1 && plItems.findIndex(p => p.account === "판매비와관리비") < plItems.indexOf(item));
  const topExpenses = [...sgaItems].sort((a, b) => b.current - a.current).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">판관비 Top 10 계정</div>
        <BarChart
          data={{
            labels: topExpenses.map((e) => e.account),
            datasets: [
              {
                label: "당기",
                data: topExpenses.map((e) => Math.round(e.current / 1_000_000)),
                backgroundColor: "#D04A02",
              },
              {
                label: "전기",
                data: topExpenses.map((e) => Math.round(e.prior / 1_000_000)),
                backgroundColor: "#E8E8E8",
              },
            ],
          }}
          height={350}
        />
      </div>

      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">판관비 계정 상세</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">계정</th>
                <th className="text-right">당기</th>
                <th className="text-right">전기</th>
                <th className="text-right">증감액</th>
                <th className="text-right">증감률</th>
              </tr>
            </thead>
            <tbody>
              {sgaItems.map((item, i) => (
                <tr key={i}>
                  <td>{item.account}</td>
                  <td className="num">{formatMillions(item.current)}</td>
                  <td className="num">{formatMillions(item.prior)}</td>
                  <td className="num">{formatMillions(item.change)}</td>
                  <td className={`num ${changeColor(item.changeRate)}`}>
                    {formatChangeRate(item.changeRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SalesTab({ sales }: { sales: SalesAnalysis | null }) {
  if (!sales) return null;

  const colors = [
    "#D04A02", "#E87722", "#FFB347", "#7D7D7D", "#464646",
    "#A33B01", "#C76B2E", "#D4956A", "#B0B0B0", "#555555",
  ];

  return (
    <div className="space-y-6">
      {/* Customer count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5 text-center">
          <div className="text-xs text-pwc-gray mb-1">당기 거래처 수</div>
          <div className="text-2xl font-bold text-pwc-orange">{sales.customerCount.current}</div>
        </div>
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5 text-center">
          <div className="text-xs text-pwc-gray mb-1">전기 거래처 수</div>
          <div className="text-2xl font-bold text-pwc-black">{sales.customerCount.prior}</div>
        </div>
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5 text-center">
          <div className="text-xs text-pwc-gray mb-1">증감</div>
          <div className={`text-2xl font-bold ${changeColor(sales.customerCount.change)}`}>
            {sales.customerCount.change > 0 ? "+" : ""}{sales.customerCount.change}
            <span className="text-sm ml-1">({formatChangeRate(sales.customerCount.changeRate)})</span>
          </div>
        </div>
      </div>

      {/* Customer share doughnut */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">매출 거래처 비중 Top 10</div>
        <DoughnutChart
          data={{
            labels: sales.topCustomerShare.map((c) => c.name),
            datasets: [
              {
                data: sales.topCustomerShare.map((c) => c.share),
                backgroundColor: colors,
              },
            ],
          }}
          height={300}
        />
      </div>

      {/* Increase / Decrease tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
          <div className="text-sm font-semibold text-pwc-black mb-3">매출 증가 Top 10 거래처</div>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">거래처</th>
                <th className="text-right">증감액</th>
              </tr>
            </thead>
            <tbody>
              {sales.topIncreaseCustomers.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td className="num text-red-600">{formatMillions(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
          <div className="text-sm font-semibold text-pwc-black mb-3">매출 감소 Top 10 거래처</div>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">거래처</th>
                <th className="text-right">증감액</th>
              </tr>
            </thead>
            <tbody>
              {sales.topDecreaseCustomers.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td className="num text-blue-600">{formatMillions(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PLItemsTab({ quarterlyPL }: { quarterlyPL: QuarterlyPL | null }) {
  if (!quarterlyPL) return null;

  return (
    <div className="space-y-6">
      {/* Quarterly chart */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">분기별 손익 추이 (백만원)</div>
        <BarChart
          data={{
            labels: quarterlyPL.headers.slice(1),
            datasets: quarterlyPL.rows.map((row, idx) => ({
              label: row.account,
              data: row.values.map((v) => Math.round(v / 1_000_000)),
              backgroundColor: ["#D04A02", "#7D7D7D", "#E87722", "#464646"][idx] || "#B0B0B0",
            })),
          }}
          height={350}
        />
      </div>

      {/* Quarterly table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">분기별 손익 상세</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {quarterlyPL.headers.map((h, i) => (
                  <th key={i} className={i === 0 ? "text-left" : "text-right"}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quarterlyPL.rows.map((row, i) => (
                <tr key={i} className={`${row.highlight ? "bg-orange-50" : ""} ${row.bold ? "font-semibold" : ""}`}>
                  <td>{row.account}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="num">
                      {formatMillions(v)}
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
