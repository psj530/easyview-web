"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PwCLogo from "@/components/PwCLogo";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/lib/auth";

interface Report {
  id: number;
  company_code: string;
  company_name: string;
  year: number;
  month: number;
  created_by_name: string;
  revenue: number;
  pl_items: number;
  created_at: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch("/api/reports", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatRevenue = (v: number) => {
    if (!v) return "-";
    return (v / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 0 }) + "억";
  };

  const formatDate = (s: string) => {
    const d = new Date(s + "Z");
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleView = (report: Report) => {
    // TODO: load specific report data in the future
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E8] shadow-xs sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <Link href="/reports" className="flex items-center gap-3">
              <PwCLogo height={22} color="#2D2D2D" />
              <span className="text-[#D04A02] text-lg font-light">|</span>
              <span className="text-[#2D2D2D] text-base font-semibold">
                Easy View
              </span>
            </Link>
            <nav className="flex items-center gap-1 ml-4">
              <Link
                href="/reports"
                className="px-3 py-1.5 text-xs font-medium rounded bg-[#2D2D2D] text-white"
              >
                리포트
              </Link>
              <Link
                href="/upload"
                className="px-3 py-1.5 text-xs font-medium rounded text-[#464646] hover:bg-[#F5F5F5] transition-colors"
              >
                새 리포트
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 text-xs font-medium rounded text-[#7D7D7D] hover:bg-[#F5F5F5] transition-colors"
              >
                서비스 소개
              </Link>
            </nav>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7D7D7D]">
                <span className="text-[#2D2D2D] font-medium">{user.name}</span>
                <span className="text-[#E8E8E8] mx-2">|</span>
                <span>{user.department}</span>
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs text-[#7D7D7D] hover:text-[#D04A02] border border-[#E8E8E8] rounded hover:border-[#D04A02] transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">리포트 목록</h1>
            <p className="text-sm text-[#7D7D7D] mt-1">
              생성된 Easy View 리포트를 확인하거나, 새 리포트를 생성하세요.
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#D04A02] text-white text-sm font-semibold rounded-md hover:bg-[#B83F02] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 리포트 생성
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="w-8 h-8 text-[#D04A02] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-[#E8E8E8]">
            <svg className="w-16 h-16 text-[#E8E8E8] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[#7D7D7D] mb-4">아직 생성된 리포트가 없습니다.</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D04A02] text-white text-sm font-semibold rounded-md hover:bg-[#B83F02] transition-colors"
            >
              첫 리포트 생성하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg border border-[#E8E8E8] hover:border-[#D04A02]/30 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex items-center">
                  {/* Left accent */}
                  <div className="w-1.5 self-stretch bg-[#D04A02]" />

                  <div className="flex-1 flex items-center justify-between px-6 py-5">
                    {/* Report info */}
                    <div className="flex items-center gap-6">
                      {/* Period badge */}
                      <div className="text-center min-w-[70px]">
                        <p className="text-2xl font-bold text-[#2D2D2D]">
                          {report.month}월
                        </p>
                        <p className="text-xs text-[#7D7D7D]">
                          {report.year}년
                        </p>
                      </div>

                      <div className="h-10 w-px bg-[#E8E8E8]" />

                      {/* Company & details */}
                      <div>
                        <h3 className="text-base font-semibold text-[#2D2D2D]">
                          {report.company_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-[#7D7D7D]">
                            매출 {formatRevenue(report.revenue)}
                          </span>
                          <span className="text-xs text-[#ABABAB]">·</span>
                          <span className="text-xs text-[#7D7D7D]">
                            손익항목 {report.pl_items}개
                          </span>
                          <span className="text-xs text-[#ABABAB]">·</span>
                          <span className="text-xs text-[#ABABAB]">
                            {report.created_by_name} · {formatDate(report.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleView(report)}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-[#D04A02] border border-[#D04A02] rounded-md hover:bg-[#D04A02] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      리포트 보기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] bg-white py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-[#7D7D7D]">
            &copy; 2024-2026 PwC Samil. Easy View 3.0 — Confidential
          </p>
          <div className="flex items-center gap-2 text-xs text-[#ABABAB]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>삼일회계법인 보안 정책에 의해 보호됨</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
