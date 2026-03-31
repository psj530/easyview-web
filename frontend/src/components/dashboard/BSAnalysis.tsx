"use client";

import { useEffect, useState } from "react";
import { fetchBS, type BSItem, type BSTrend, type ActivityMetrics } from "@/lib/api";
import { formatMillions, formatPercent, changeColor } from "@/lib/utils";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";

const SUB_TABS = ["BS요약", "BS계정분석"];

export default function BSAnalysis() {
  const [subTab, setSubTab] = useState(0);
  const [bsItems, setBsItems] = useState<BSItem[]>([]);
  const [bsTrend, setBsTrend] = useState<BSTrend | null>(null);
  const [activity, setActivity] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBS()
      .then((data) => {
        setBsItems(data.bsItems);
        setBsTrend(data.bsTrend);
        setActivity(data.activityMetrics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-pwc-gray">데이터를 불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white rounded-md shadow-xs border border-pwc-gray-light p-1">
        {SUB_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setSubTab(i)}
            className={`px-4 py-2 text-xs rounded font-medium transition-colors ${
              subTab === i ? "bg-pwc-orange text-white" : "text-pwc-gray-dark hover:bg-pwc-gray-bg"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {subTab === 0 && <BSSummaryTab bsItems={bsItems} bsTrend={bsTrend} activity={activity} />}
      {subTab === 1 && <BSAccountTab bsItems={bsItems} />}
    </div>
  );
}

function BSSummaryTab({
  bsItems,
  bsTrend,
  activity,
}: {
  bsItems: BSItem[];
  bsTrend: BSTrend | null;
  activity: ActivityMetrics | null;
}) {
  return (
    <div className="space-y-6">
      {/* Activity Metrics */}
      {activity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
            <div className="text-sm font-semibold text-pwc-black mb-3">매출채권 회전일수</div>
            <div className="text-3xl font-bold text-pwc-orange mb-2">{activity.arTurnover.days}일</div>
            <div className="space-y-1 text-xs text-pwc-gray">
              <div>평균잔액: {formatMillions(activity.arTurnover.avgBalance)} 백만원</div>
              <div>일평균 매출: {formatMillions(activity.arTurnover.dailyRevenue)} 백만원</div>
            </div>
          </div>
          <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
            <div className="text-sm font-semibold text-pwc-black mb-3">재고자산 회전일수</div>
            <div className="text-3xl font-bold text-pwc-orange mb-2">{activity.inventoryTurnover.days}일</div>
            <div className="space-y-1 text-xs text-pwc-gray">
              <div>평균잔액: {formatMillions(activity.inventoryTurnover.avgBalance)} 백만원</div>
              <div>일평균 매출원가: {formatMillions(activity.inventoryTurnover.dailyCOGS)} 백만원</div>
            </div>
          </div>
        </div>
      )}

      {/* BS Trend Chart */}
      {bsTrend && (
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
          <div className="text-sm font-semibold text-pwc-black mb-4">자산/부채 월별 추이 (백만원)</div>
          <LineChart
            data={{
              labels: bsTrend.labels,
              datasets: [
                {
                  label: "유동자산",
                  data: bsTrend.assets.current,
                  borderColor: "#D04A02",
                  backgroundColor: "rgba(208,74,2,0.1)",
                  fill: false,
                  tension: 0.3,
                },
                {
                  label: "비유동자산",
                  data: bsTrend.assets.nonCurrent,
                  borderColor: "#E87722",
                  backgroundColor: "rgba(232,119,34,0.1)",
                  fill: false,
                  tension: 0.3,
                },
                {
                  label: "유동부채",
                  data: bsTrend.liabilities.current,
                  borderColor: "#7D7D7D",
                  backgroundColor: "rgba(125,125,125,0.1)",
                  fill: false,
                  tension: 0.3,
                },
                {
                  label: "비유동부채",
                  data: bsTrend.liabilities.nonCurrent,
                  borderColor: "#B0B0B0",
                  backgroundColor: "rgba(176,176,176,0.1)",
                  fill: false,
                  tension: 0.3,
                },
                {
                  label: "자본",
                  data: bsTrend.equity,
                  borderColor: "#464646",
                  backgroundColor: "rgba(70,70,70,0.1)",
                  fill: false,
                  tension: 0.3,
                  borderDash: [5, 5],
                },
              ],
            }}
            height={350}
          />
        </div>
      )}

      {/* BS Summary Table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">재무상태표 요약</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">구분</th>
                <th className="text-right">기말잔액</th>
                <th className="text-right">기초잔액</th>
                <th className="text-right">증감액</th>
              </tr>
            </thead>
            <tbody>
              {bsItems.filter(item => item.level <= 1).map((item, i) => (
                <tr key={i} className={item.bold ? "font-semibold" : ""}>
                  <td style={{ paddingLeft: 12 + item.level * 16 }}>{item.category}</td>
                  <td className="num">{formatMillions(item.endBal)}</td>
                  <td className="num">{formatMillions(item.beginBal)}</td>
                  <td className={`num ${changeColor(item.change)}`}>{formatMillions(item.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BSAccountTab({ bsItems }: { bsItems: BSItem[] }) {
  return (
    <div className="space-y-6">
      {/* Asset details chart */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">자산 계정별 잔액 (백만원)</div>
        <BarChart
          data={{
            labels: bsItems.filter(i => i.level === 2 && bsItems.findIndex(b => b.category === "자산") < bsItems.indexOf(i) && bsItems.indexOf(i) < bsItems.findIndex(b => b.category === "부채")).map(i => i.category),
            datasets: [
              {
                label: "기말",
                data: bsItems.filter(i => i.level === 2 && bsItems.findIndex(b => b.category === "자산") < bsItems.indexOf(i) && bsItems.indexOf(i) < bsItems.findIndex(b => b.category === "부채")).map(i => Math.round(i.endBal / 1_000_000)),
                backgroundColor: "#D04A02",
              },
              {
                label: "기초",
                data: bsItems.filter(i => i.level === 2 && bsItems.findIndex(b => b.category === "자산") < bsItems.indexOf(i) && bsItems.indexOf(i) < bsItems.findIndex(b => b.category === "부채")).map(i => Math.round(i.beginBal / 1_000_000)),
                backgroundColor: "#E8E8E8",
              },
            ],
          }}
          height={350}
        />
      </div>

      {/* Full BS Table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">재무상태표 상세</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">구분</th>
                <th className="text-right">기말잔액</th>
                <th className="text-right">기초잔액</th>
                <th className="text-right">증감액</th>
              </tr>
            </thead>
            <tbody>
              {bsItems.map((item, i) => (
                <tr key={i} className={item.bold ? "font-semibold" : ""}>
                  <td style={{ paddingLeft: 12 + item.level * 16 }}>{item.category}</td>
                  <td className="num">{formatMillions(item.endBal)}</td>
                  <td className="num">{formatMillions(item.beginBal)}</td>
                  <td className={`num ${changeColor(item.change)}`}>{formatMillions(item.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
