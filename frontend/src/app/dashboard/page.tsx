"use client";

import { useState } from "react";
import Summary from "@/components/dashboard/Summary";
import PLAnalysis from "@/components/dashboard/PLAnalysis";
import BSAnalysis from "@/components/dashboard/BSAnalysis";
import JournalAnalysis from "@/components/dashboard/JournalAnalysis";
import ScenarioAnalysis from "@/components/dashboard/ScenarioAnalysis";

const TABS = [
  { label: "Summary", component: Summary },
  { label: "손익분석", component: PLAnalysis },
  { label: "재무상태분석", component: BSAnalysis },
  { label: "전표분석", component: JournalAnalysis },
  { label: "시나리오분석", component: ScenarioAnalysis },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = TABS[activeTab].component;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white rounded-md shadow-xs border border-pwc-gray-light p-1">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm rounded font-medium transition-colors ${
              activeTab === i
                ? "bg-pwc-orange text-white shadow-xs"
                : "text-pwc-gray-dark hover:bg-pwc-gray-bg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <ActiveComponent />
    </div>
  );
}
