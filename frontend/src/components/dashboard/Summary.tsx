"use client";

import { useEffect, useState } from "react";
import { fetchSummary, fetchPL, fetchBS, type SummaryData, type PLItem, type BSItem } from "@/lib/api";
import { formatMillions, formatPercent, formatChangeRate, changeColor } from "@/lib/utils";

function KPICard({
  label,
  current,
  prior,
  changeRate,
}: {
  label: string;
  current: number;
  prior: number;
  changeRate: number;
}) {
  return (
    <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
      <div className="text-xs text-pwc-gray mb-1">{label}</div>
      <div className="text-2xl font-bold text-pwc-black mb-2">
        {formatMillions(current)}
        <span className="text-xs font-normal text-pwc-gray ml-1">백만원</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-pwc-gray">전기: {formatMillions(prior)}</span>
        <span className={`font-semibold ${changeColor(changeRate)}`}>
          {formatChangeRate(changeRate)}
        </span>
      </div>
    </div>
  );
}

function TopItemsCard({
  title,
  items,
}: {
  title: string;
  items: { name: string; amount: number }[];
}) {
  return (
    <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
      <div className="text-sm font-semibold text-pwc-black mb-3">{title}</div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-pwc-gray-dark truncate mr-2">
              {i + 1}. {item.name}
            </span>
            <span className="text-right font-medium tabular-nums whitespace-nowrap">
              {formatMillions(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Summary() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [plItems, setPlItems] = useState<PLItem[]>([]);
  const [bsItems, setBsItems] = useState<BSItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSummary(),
      fetchPL().then((d) => d.plItems),
      fetchBS().then((d) => d.bsItems),
    ])
      .then(([s, pl, bs]) => {
        setSummary(s);
        setPlItems(pl);
        setBsItems(bs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-pwc-gray">
        데이터를 불러오는 중...
      </div>
    );
  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="매출액" {...summary.revenue} />
        <KPICard label="영업이익" {...summary.operatingProfit} />
        <KPICard label="자산총계" {...summary.assets} />
        <KPICard label="부채총계" {...summary.liabilities} />
      </div>

      {/* Top Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TopItemsCard title="매출 증감 Top 3 거래처" items={summary.revenueTopCustomers} />
        <TopItemsCard title="판관비 증감 Top 3 계정" items={summary.expenseTopAccounts} />
        <TopItemsCard title="자산 증감 Top 3 계정" items={summary.assetTopAccounts} />
        <TopItemsCard title="부채 증감 Top 3 계정" items={summary.liabilityTopAccounts} />
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profit Indicators */}
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
          <div className="text-sm font-semibold text-pwc-black mb-4">수익성 지표</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-pwc-gray mb-1">매출총이익률</div>
              <div className="text-xl font-bold text-pwc-orange">
                {formatPercent(summary.profitIndicators.grossMargin)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-pwc-gray mb-1">영업이익률</div>
              <div className="text-xl font-bold text-pwc-orange">
                {formatPercent(summary.profitIndicators.operatingMargin)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-pwc-gray mb-1">순이익률</div>
              <div className="text-xl font-bold text-pwc-orange">
                {formatPercent(summary.profitIndicators.netMargin)}
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity + Scenario */}
        <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
          <div className="text-sm font-semibold text-pwc-black mb-4">안정성 지표 / 시나리오 현황</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-pwc-gray">부채비율</span>
                  <span className="font-semibold">{formatPercent(summary.liquidityIndicators.debtRatio)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-pwc-gray">유동비율</span>
                  <span className="font-semibold">{formatPercent(summary.liquidityIndicators.currentRatio)}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-pwc-gray">중복전표</span>
                  <span className="font-semibold text-red-600">{summary.scenarioCounts.duplicateAmount}건</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-pwc-gray">부채 후 현금</span>
                  <span className="font-semibold text-red-600">{summary.scenarioCounts.cashAfterLiability}건</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-pwc-gray">주말 현금</span>
                  <span className="font-semibold text-red-600">{summary.scenarioCounts.weekendCash}건</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-pwc-gray">현금/비용 동시</span>
                  <span className="font-semibold text-red-600">{summary.scenarioCounts.cashAndExpense}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PL Table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">손익계산서 요약</div>
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
              {plItems.filter(item => item.level === 0).map((item, i) => (
                <tr
                  key={i}
                  className={`${item.highlight ? "bg-orange-50" : ""} ${item.bold ? "font-semibold" : ""}`}
                >
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

      {/* BS Table */}
      <div className="bg-white rounded-md shadow-xs border border-pwc-gray-light p-5">
        <div className="text-sm font-semibold text-pwc-black mb-4">재무상태표 요약</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">구분</th>
                <th className="text-right">기말</th>
                <th className="text-right">기초</th>
                <th className="text-right">증감액</th>
              </tr>
            </thead>
            <tbody>
              {bsItems.filter(item => item.level <= 1).map((item, i) => (
                <tr
                  key={i}
                  className={item.bold ? "font-semibold" : ""}
                >
                  <td style={{ paddingLeft: item.level * 16 }}>{item.category}</td>
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
