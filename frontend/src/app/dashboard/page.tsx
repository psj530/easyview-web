"use client";

import { useState, useCallback, useEffect } from "react";
import Summary from "@/components/dashboard/Summary";
import PLAnalysis from "@/components/dashboard/PLAnalysis";
import BSAnalysis from "@/components/dashboard/BSAnalysis";
import JournalAnalysis from "@/components/dashboard/JournalAnalysis";
import ScenarioAnalysis from "@/components/dashboard/ScenarioAnalysis";
import { fetchMonths, type PeriodType } from "@/lib/api";

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
  const [month, setMonth] = useState<string>("2025-09");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchMonths()
      .then((data) => {
        if (data.months && data.months.length > 0) {
          setAvailableMonths(data.months);
          setMonth(data.months[data.months.length - 1]);
        }
      })
      .catch(() => {
        // Fallback months
        const months: string[] = [];
        for (let y = 2024; y <= 2025; y++) {
          for (let m = 1; m <= 12; m++) {
            months.push(`${y}-${String(m).padStart(2, "0")}`);
          }
        }
        setAvailableMonths(months);
      });
  }, []);

  const handleNavigate = useCallback((tabKey: TabKey) => {
    setActiveTab(tabKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Dark background, white text, orange active underline */}
      <div className="bg-[#2D2D2D] rounded-lg overflow-hidden">
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
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#D04A02]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === "summary" && (
        <Summary
          period={period}
          month={month}
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
        />
      )}
      {activeTab === "bs" && (
        <BSAnalysis
          period={period}
          month={month}
          onMonthChange={setMonth}
          availableMonths={availableMonths}
        />
      )}
      {activeTab === "journal" && (
        <JournalAnalysis
          period={period}
          month={month}
        />
      )}
      {activeTab === "scenario" && (
        <ScenarioAnalysis
          period={period}
          month={month}
        />
      )}
    </div>
  );
}
