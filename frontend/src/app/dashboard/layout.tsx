"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { fetchMeta, type MetaData } from "@/lib/api";
import PwCLogo from "@/components/PwCLogo";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(console.error);
  }, []);

  // Listen for export complete event
  useEffect(() => {
    const handler = () => setExporting(false);
    window.addEventListener("easyview:export-done", handler);
    return () => window.removeEventListener("easyview:export-done", handler);
  }, []);

  const handleExportCurrentTab = useCallback(() => {
    window.print();
  }, []);

  const handleExportAllPDF = useCallback(() => {
    setExporting(true);
    window.dispatchEvent(new CustomEvent("easyview:export-all"));
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7F8] flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white border-b border-[#DFE3E6] shadow-xs sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <Link href="/reports" className="flex items-center gap-3">
              <PwCLogo height={22} color="#222C40" />
              <span className="text-[#FD5108] text-lg font-light">|</span>
              <span className="text-[#222C40] text-base font-semibold">
                Easy View
              </span>
            </Link>
            <nav className="flex items-center gap-1 ml-4">
              <Link href="/reports" className="px-3 py-1.5 text-xs font-medium rounded text-[#4B535E] hover:bg-[#F5F7F8] transition-colors">
                리포트
              </Link>
              <Link href="/upload" className="px-3 py-1.5 text-xs font-medium rounded text-[#4B535E] hover:bg-[#F5F7F8] transition-colors">
                새 리포트
              </Link>
              <Link href="/" className="px-3 py-1.5 text-xs font-medium rounded text-[#4B535E] hover:bg-[#F5F7F8] transition-colors">
                서비스 소개
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-5">
            {meta && (
              <div className="flex items-center gap-3 text-sm text-[#4B535E]">
                <span className="font-medium text-[#222C40]">
                  {meta.companyName}
                </span>
                <span className="text-[#E8E8E8]">|</span>
                <span>기준일: {meta.baseDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCurrentTab}
                disabled={exporting}
                className="px-3 py-1.5 text-xs font-medium text-[#4B535E] bg-[#F5F7F8] border border-[#DFE3E6] rounded hover:bg-[#DFE3E6] transition-colors disabled:opacity-50"
              >
                현재 탭 PDF
              </button>
              <button
                onClick={handleExportAllPDF}
                disabled={exporting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#FD5108] rounded hover:bg-[#D04A02] transition-colors disabled:opacity-50"
              >
                {exporting ? "내보내는 중..." : "전체 PDF"}
              </button>
            </div>
            {user && (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-[#DFE3E6]">
                <span className="text-xs text-[#4B535E]">{user.name}</span>
                <button
                  onClick={logout}
                  className="px-2 py-1 text-xs text-[#4B535E] hover:text-[#FD5108] transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
