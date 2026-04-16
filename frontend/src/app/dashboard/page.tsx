"use client";

import { useState, useCallback, useEffect } from "react";
import Summary from "@/components/dashboard/Summary";
import PLAnalysis from "@/components/dashboard/PLAnalysis";
import BSAnalysis from "@/components/dashboard/BSAnalysis";
import JournalAnalysis from "@/components/dashboard/JournalAnalysis";
import ScenarioAnalysis from "@/components/dashboard/ScenarioAnalysis";
import { fetchMonths, type PeriodType, type BSCompareType } from "@/lib/api";

const TABS = [
  { key: "summary", label: "Summary" },
  { key: "pl", label: "손익분석" },
  { key: "bs", label: "재무상태분석" },
  { key: "journal", label: "전표분석" },
  { key: "scenario", label: "시나리오분석" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [period, setPeriod] = useState<PeriodType>("ytd");
  const [bsCompare, setBsCompare] = useState<BSCompareType>("year_start");
  const [month, setMonth] = useState<string>("2025-09");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [printAll, setPrintAll] = useState(false);

  useEffect(() => {
    fetchMonths()
      .then((data) => {
        if (data.months && data.months.length > 0) {
          setAvailableMonths(data.months);
          setMonth(data.months[data.months.length - 1]);
        }
      })
      .catch(() => {
        const months: string[] = [];
        for (let y = 2024; y <= 2025; y++) {
          for (let m = 1; m <= 12; m++) {
            months.push(`${y}-${String(m).padStart(2, "0")}`);
          }
        }
        setAvailableMonths(months);
      });
  }, []);

  // Listen for "export all" event from layout
  useEffect(() => {
    const handler = () => {
      setPrintAll(true);
    };
    window.addEventListener("easyview:export-all", handler);
    return () => window.removeEventListener("easyview:export-all", handler);
  }, []);

  // When printAll is set, wait for render then print
  useEffect(() => {
    if (!printAll) return;

    // Wait for all tabs to render
    const timer = setTimeout(() => {
      window.print();
      // After print dialog closes, restore single-tab view
      setPrintAll(false);
      window.dispatchEvent(new CustomEvent("easyview:export-done"));
    }, 1500);

    return () => clearTimeout(timer);
  }, [printAll]);

  const [initialSubTab, setInitialSubTab] = useState<number | undefined>(undefined);

  const handleNavigate = useCallback((tabKey: TabKey, subTab?: number) => {
    setInitialSubTab(subTab);
    setActiveTab(tabKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // When printAll mode, render all tabs sequentially
  if (printAll) {
    return (
      <div className="space-y-0">
        {/* Print header */}
        <div className="print-header mb-6 hidden print:block text-center">
          <h1 className="text-xl font-bold text-[#222C40]">
            PwC Easy View 3.0 — Full Report
          </h1>
        </div>

        {/* All tabs rendered sequentially with page breaks */}
        <div>
          <div className="bg-[#222C40] rounded-t-lg px-6 py-3 mb-4">
            <span className="text-white text-sm font-semibold">Summary</span>
          </div>
          <div className="mb-4">
            <Summary
              period={period}
              bsCompare={bsCompare}
              month={month}
              onPeriodChange={setPeriod}
              onBsCompareChange={setBsCompare}
              onMonthChange={setMonth}
              availableMonths={availableMonths}
              onNavigate={handleNavigate}
            />
          </div>
        </div>

        <div className="break-before-page">
          <div className="bg-[#222C40] rounded-t-lg px-6 py-3 mb-4">
            <span className="text-white text-sm font-semibold">손익분석</span>
          </div>
          <div className="mb-4">
            <PLAnalysis
              period={period}
              month={month}
              onPeriodChange={setPeriod}
              onMonthChange={setMonth}
              availableMonths={availableMonths}
            />
          </div>
        </div>

        <div className="break-before-page">
          <div className="bg-[#222C40] rounded-t-lg px-6 py-3 mb-4">
            <span className="text-white text-sm font-semibold">재무상태분석</span>
          </div>
          <div className="mb-4">
            <BSAnalysis
              period={period}
              bsCompare={bsCompare}
              month={month}
              onMonthChange={setMonth}
              availableMonths={availableMonths}
            />
          </div>
        </div>

        <div className="break-before-page">
          <div className="bg-[#222C40] rounded-t-lg px-6 py-3 mb-4">
            <span className="text-white text-sm font-semibold">전표분석</span>
          </div>
          <div className="mb-4">
            <JournalAnalysis period={period} month={month} />
          </div>
        </div>

        <div className="break-before-page">
          <div className="bg-[#222C40] rounded-t-lg px-6 py-3 mb-4">
            <span className="text-white text-sm font-semibold">시나리오분석</span>
          </div>
          <div className="mb-4">
            <ScenarioAnalysis period={period} month={month} />
          </div>
        </div>

        {/* Loading overlay while rendering */}
        <div className="fixed inset-0 bg-white/80 z-[100] flex items-center justify-center print:hidden">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-3 border-[#FD5108] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-medium text-[#222C40]">
              전체 리포트 준비 중...
            </p>
            <p className="text-xs text-[#4B535E] mt-1">
              모든 탭을 렌더링하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal single-tab view
  return (
    <div>
      {/* Main Tab Navigation - sticky below header */}
      <div className="sticky top-14 z-40 -mx-6 px-6 pt-6 pb-0 bg-[#F5F7F8]">
        <div className="bg-[#222C40] rounded-t-lg overflow-hidden">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleNavigate(tab.key)}
                className={`relative px-6 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FD5108]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="space-y-6 mt-0">
        {activeTab === "summary" && (
          <Summary
            period={period}
            bsCompare={bsCompare}
            month={month}
            onPeriodChange={setPeriod}
            onBsCompareChange={setBsCompare}
            onMonthChange={setMonth}
            availableMonths={availableMonths}
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === "pl" && (
          <PLAnalysis
            period={period}
            month={month}
            onPeriodChange={setPeriod}
            onMonthChange={setMonth}
            availableMonths={availableMonths}
            initialSubTab={initialSubTab}
          />
        )}
        {activeTab === "bs" && (
          <BSAnalysis
            period={period}
            bsCompare={bsCompare}
            month={month}
            onMonthChange={setMonth}
            availableMonths={availableMonths}
            initialSubTab={initialSubTab}
          />
        )}
        {activeTab === "journal" && (
          <JournalAnalysis period={period} month={month} />
        )}
        {activeTab === "scenario" && (
          <ScenarioAnalysis period={period} month={month} initialSubTab={initialSubTab} />
        )}
      </div>
    </div>
  );
}
