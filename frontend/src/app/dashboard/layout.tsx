"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { fetchMeta, fetchFullData, type MetaData } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [meta, setMeta] = useState<MetaData | null>(null);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(console.error);
  }, []);

  const handleExportCurrentTab = useCallback(() => {
    window.print();
  }, []);

  const handleExportAllPDF = useCallback(async () => {
    try {
      const data = await fetchFullData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `easyview_${meta?.companyName || "report"}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [meta]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Sticky Header */}
      <header className="bg-[#2D2D2D] border-b border-[#464646] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-white text-base font-bold tracking-wide">
                pwc
              </span>
              <span className="text-[#D04A02] text-lg font-light mx-1">|</span>
              <span className="text-white text-base font-semibold">
                Easy View
              </span>
            </div>
          </Link>

          {/* Right side: Company info + Export */}
          <div className="flex items-center gap-5">
            {meta && (
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="font-medium text-white">
                  {meta.companyName}
                </span>
                <span className="text-gray-500">|</span>
                <span>기준일: {meta.baseDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCurrentTab}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#464646] rounded hover:bg-[#555] transition-colors"
              >
                현재 탭
              </button>
              <button
                onClick={handleExportAllPDF}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#D04A02] rounded hover:bg-[#B83F02] transition-colors"
              >
                전체 PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
