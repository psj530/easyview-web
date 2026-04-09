"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PwCLogo from "@/components/PwCLogo";
import { useAuth } from "@/contexts/AuthContext";
import { getToken, type Company } from "@/lib/auth";

interface FileSlot {
  key: string;
  label: string;
  description: string;
  required: boolean;
  accept: string;
  file: File | null;
}

type Phase = "upload" | "processing" | "done";

const PROCESSING_STEPS = [
  { label: "파일 업로드 중...", duration: 0 },
  { label: "데이터 포맷 검증 중...", duration: 1500 },
  { label: "Easy View Template에 맞게 데이터 가공 중...", duration: 2500 },
  { label: "재무제표 항목 매핑 중...", duration: 2000 },
  { label: "시나리오 분석 수행 중...", duration: 1500 },
  { label: "리포트 생성 완료!", duration: 1000 },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export default function UploadPage() {
  const router = useRouter();
  const { user, companies, logout } = useAuth();

  // 결산은 통상 익월에 진행되므로 기본값은 전월
  const prevMonth = new Date().getMonth(); // 0-indexed = 이번달-1
  const [selectedYear, setSelectedYear] = useState(
    prevMonth === 0 ? currentYear - 1 : currentYear
  );
  const [selectedMonth, setSelectedMonth] = useState(
    prevMonth === 0 ? 12 : prevMonth
  );
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [error, setError] = useState("");

  const [phase, setPhase] = useState<Phase>("upload");
  const [processingStep, setProcessingStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    status: string;
    message: string;
    summary?: { revenue: number; plItems: number };
  } | null>(null);

  const [fileSlots, setFileSlots] = useState<FileSlot[]>([
    {
      key: "je",
      label: "분개장 (JE) / 계정별원장 (GL)",
      description:
        "Journal Entry 또는 General Ledger 파일을 업로드합니다. (CSV, Excel, TXT)",
      required: true,
      accept: ".csv,.xlsx,.xls,.txt",
      file: null,
    },
    {
      key: "tb",
      label: "시산표 (TB)",
      description: "Trial Balance 파일을 업로드합니다. (CSV, Excel, TXT)",
      required: true,
      accept: ".csv,.xlsx,.xls,.txt",
      file: null,
    },
    {
      key: "bs",
      label: "재무제표 (BS / PL)",
      description:
        "재무상태표(Balance Sheet) 및 손익계산서(Profit or Loss) — 선택사항",
      required: false,
      accept: ".csv,.xlsx,.xls,.txt,.pdf",
      file: null,
    },
    {
      key: "etc",
      label: "기타파일",
      description: "CoA, PKG, Customer List 등 추가 참고자료 — 선택사항",
      required: false,
      accept: ".csv,.xlsx,.xls,.txt,.pdf,.zip",
      file: null,
    },
  ]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileChange = useCallback(
    (index: number, file: File | null) => {
      setFileSlots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], file };
        return next;
      });
      setError("");
    },
    []
  );

  // Processing animation steps
  useEffect(() => {
    if (phase !== "processing") return;
    if (processingStep >= PROCESSING_STEPS.length - 1) return;

    const step = PROCESSING_STEPS[processingStep];
    const timer = setTimeout(() => {
      setProcessingStep((s) => s + 1);
    }, step.duration);

    return () => clearTimeout(timer);
  }, [phase, processingStep]);

  const handleGenerate = async () => {
    if (!selectedCompany) {
      setError("회사를 선택해주세요.");
      return;
    }

    const jeFile = fileSlots[0].file;
    const tbFile = fileSlots[1].file;

    if (!jeFile || !tbFile) {
      setError("분개장(JE/GL)과 시산표(TB)는 필수 업로드 파일입니다.");
      return;
    }

    setError("");
    setPhase("processing");
    setProcessingStep(0);

    try {
      const formData = new FormData();
      formData.append("je_file", jeFile);
      formData.append("tb_file", tbFile);
      if (fileSlots[2].file) formData.append("bs_file", fileSlots[2].file);
      if (fileSlots[3].file) formData.append("etc_file", fileSlots[3].file);

      const monthStr = selectedMonth.toString().padStart(2, "0");
      const token = getToken();

      const res = await fetch(
        `/api/upload/v2?company_code=${selectedCompany.code}&year=${selectedYear}&month=${monthStr}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const text = await res.text();
        let detail = "리포트 생성에 실패했습니다.";
        try {
          const json = JSON.parse(text);
          detail = json.detail || detail;
        } catch {
          detail = text || `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(detail);
      }

      const result = await res.json();

      // Ensure all animation steps complete before showing result
      const elapsed = PROCESSING_STEPS.slice(0, processingStep + 1).reduce(
        (s, st) => s + st.duration,
        0
      );
      const remaining = PROCESSING_STEPS.reduce((s, st) => s + st.duration, 0);
      const wait = Math.max(0, remaining - elapsed);

      setTimeout(() => {
        setUploadResult(result);
        setProcessingStep(PROCESSING_STEPS.length - 1);
        setPhase("done");
      }, wait);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "리포트 생성 중 오류가 발생했습니다."
      );
      setPhase("upload");
    }
  };

  // ===== Processing overlay =====
  if (phase === "processing") {
    const progress = Math.min(
      ((processingStep + 1) / PROCESSING_STEPS.length) * 100,
      100
    );
    const currentLabel = PROCESSING_STEPS[processingStep]?.label || "";

    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <header className="bg-white border-b border-[#E8E8E8] shadow-xs">
          <div className="max-w-6xl mx-auto px-6 flex items-center h-14">
            <div className="flex items-center gap-3">
              <PwCLogo height={22} color="#2D2D2D" />
              <span className="text-[#D04A02] text-lg font-light">|</span>
              <span className="text-[#2D2D2D] text-base font-semibold">
                Easy View
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg text-center">
            {/* Animated spinner */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <svg className="w-24 h-24 animate-spin" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#E8E8E8"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#D04A02"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progress) / 100}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#D04A02]">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">
              리포트 변환 중
            </h2>
            <p className="text-sm text-[#7D7D7D] mb-8">
              {selectedCompany?.name} — {selectedYear}년 {selectedMonth}월
            </p>

            {/* Step list */}
            <div className="bg-white rounded-lg shadow-xs border border-[#E8E8E8] p-6 text-left">
              {PROCESSING_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 py-2 ${
                    i <= processingStep ? "opacity-100" : "opacity-30"
                  } transition-opacity duration-500`}
                >
                  {i < processingStep ? (
                    <svg
                      className="w-5 h-5 text-green-500 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : i === processingStep ? (
                    <svg
                      className="w-5 h-5 text-[#D04A02] animate-spin shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#E8E8E8] shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      i === processingStep
                        ? "text-[#D04A02] font-medium"
                        : i < processingStep
                          ? "text-[#464646]"
                          : "text-[#ABABAB]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ===== Done overlay =====
  if (phase === "done" && uploadResult) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <header className="bg-white border-b border-[#E8E8E8] shadow-xs">
          <div className="max-w-6xl mx-auto px-6 flex items-center h-14">
            <div className="flex items-center gap-3">
              <PwCLogo height={22} color="#2D2D2D" />
              <span className="text-[#D04A02] text-lg font-light">|</span>
              <span className="text-[#2D2D2D] text-base font-semibold">
                Easy View
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-lg text-center">
            {/* Success icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">
              리포트 생성 완료
            </h2>
            <p className="text-sm text-[#7D7D7D] mb-2">
              {uploadResult.message}
            </p>

            {uploadResult.summary && (
              <div className="flex justify-center gap-6 mt-4 mb-8">
                <div className="bg-white rounded-lg border border-[#E8E8E8] px-5 py-3">
                  <p className="text-xs text-[#7D7D7D]">매출액</p>
                  <p className="text-lg font-bold text-[#2D2D2D]">
                    {Math.round(uploadResult.summary.revenue / 1e8).toLocaleString("ko-KR")}억원
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-[#E8E8E8] px-5 py-3">
                  <p className="text-xs text-[#7D7D7D]">손익 항목</p>
                  <p className="text-lg font-bold text-[#2D2D2D]">
                    {uploadResult.summary.plItems}개
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/dashboard")}
              className="px-10 py-3 bg-[#D04A02] text-white font-semibold rounded-md hover:bg-[#B83F02] transition-colors text-sm"
            >
              Easy View 리포트 보기
            </button>

            <button
              onClick={() => {
                setPhase("upload");
                setUploadResult(null);
              }}
              className="block mx-auto mt-3 text-sm text-[#7D7D7D] hover:text-[#D04A02] transition-colors"
            >
              다른 데이터 업로드
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ===== Upload form =====
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
              <Link href="/reports" className="px-3 py-1.5 text-xs font-medium rounded text-[#464646] hover:bg-[#F5F5F5] transition-colors">
                리포트
              </Link>
              <Link href="/upload" className="px-3 py-1.5 text-xs font-medium rounded bg-[#2D2D2D] text-white">
                새 리포트
              </Link>
              <Link href="/" className="px-3 py-1.5 text-xs font-medium rounded text-[#7D7D7D] hover:bg-[#F5F5F5] transition-colors">
                서비스 소개
              </Link>
            </nav>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7D7D7D]">
                <span className="text-[#2D2D2D] font-medium">{user.name}</span>
                <span className="text-[#E8E8E8] mx-2">|</span>
                <span className="text-[#7D7D7D]">{user.department}</span>
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

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2D2D2D]">
            데이터 업로드
          </h1>
          <p className="text-sm text-[#7D7D7D] mt-1">
            원본 재무 데이터를 업로드하면 Easy View Template에 맞게 자동으로
            가공하여 리포트를 생성합니다.
          </p>
          <a
            href="https://incredible-satin-eaa.notion.site/worldwide-easy-view?pvs=74"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#D04A02] hover:text-[#B83F02] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            데이터 추출 및 업로드 방법 안내
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Period & Company selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Period selection */}
            <div className="bg-white rounded-lg shadow-xs border border-[#E8E8E8] overflow-hidden">
              <div className="border-b border-[#E8E8E8] px-5 py-3.5 bg-[#FAFAFA]">
                <h2 className="text-sm font-semibold text-[#2D2D2D]">
                  결산 기간
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#464646] mb-1.5">
                    연도
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E8E8E8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D04A02] focus:border-transparent"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#464646] mb-1.5">
                    월
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {months.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMonth(m)}
                        className={`py-2 text-sm rounded-md border transition-colors ${
                          selectedMonth === m
                            ? "bg-[#D04A02] text-white border-[#D04A02]"
                            : "bg-white text-[#464646] border-[#E8E8E8] hover:border-[#D04A02] hover:text-[#D04A02]"
                        }`}
                      >
                        {m}월
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 text-center">
                  <span className="inline-block bg-[#F5F5F5] rounded-md px-4 py-2 text-sm font-medium text-[#2D2D2D]">
                    {selectedYear}년 {selectedMonth}월
                  </span>
                </div>
              </div>
            </div>

            {/* Company selection */}
            <div className="bg-white rounded-lg shadow-xs border border-[#E8E8E8] overflow-hidden">
              <div className="border-b border-[#E8E8E8] px-5 py-3.5 bg-[#FAFAFA]">
                <h2 className="text-sm font-semibold text-[#2D2D2D]">
                  대상 회사
                </h2>
              </div>
              <div className="p-5">
                {companies.length === 0 ? (
                  <p className="text-sm text-[#7D7D7D]">
                    접근 가능한 회사가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company)}
                        className={`w-full text-left px-4 py-3 rounded-md border transition-all ${
                          selectedCompany?.id === company.id
                            ? "bg-[#FFF5F0] border-[#D04A02] ring-1 ring-[#D04A02]"
                            : "bg-white border-[#E8E8E8] hover:border-[#D04A02]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                selectedCompany?.id === company.id
                                  ? "text-[#D04A02]"
                                  : "text-[#2D2D2D]"
                              }`}
                            >
                              {company.name}
                            </p>
                            <p className="text-xs text-[#7D7D7D] mt-0.5">
                              {company.code}
                            </p>
                          </div>
                          {selectedCompany?.id === company.id && (
                            <svg
                              className="w-5 h-5 text-[#D04A02]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: File upload area */}
          <div className="lg:col-span-2 space-y-4">
            {fileSlots.map((slot, index) => (
              <div
                key={slot.key}
                className="bg-white rounded-lg shadow-xs border border-[#E8E8E8] overflow-hidden"
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#2D2D2D]">
                          {slot.label}
                        </h3>
                        {slot.required ? (
                          <span className="text-xs font-medium text-white bg-[#D04A02] px-2 py-0.5 rounded">
                            필수
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#7D7D7D] bg-[#F5F5F5] px-2 py-0.5 rounded">
                            선택
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7D7D7D] mt-1">
                        {slot.description}
                      </p>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className={`border-2 border-dashed rounded-lg px-6 py-5 text-center cursor-pointer transition-colors ${
                      slot.file
                        ? "border-green-300 bg-green-50"
                        : "border-[#E8E8E8] hover:border-[#D04A02] hover:bg-[#FFF9F5]"
                    }`}
                  >
                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept={slot.accept}
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(index, e.target.files?.[0] || null)
                      }
                    />
                    {slot.file ? (
                      <div className="flex items-center justify-center gap-3">
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-700">
                            {slot.file.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(slot.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileChange(index, null);
                          }}
                          className="ml-3 text-xs text-red-500 hover:text-red-700"
                        >
                          제거
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="w-8 h-8 text-[#D04A02] mx-auto mb-2 opacity-40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        <p className="text-sm text-[#7D7D7D]">
                          클릭하여 파일을 선택하세요
                        </p>
                        <p className="text-xs text-[#ABABAB] mt-1">
                          {slot.accept.split(",").join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Generate button */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleGenerate}
                disabled={!selectedCompany}
                className="px-8 py-3 bg-[#D04A02] text-white font-semibold rounded-md hover:bg-[#B83F02] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Report 생성하기
              </button>
              <p className="text-xs text-[#7D7D7D]">
                분개장(JE/GL)과 시산표(TB)는 필수 파일입니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] bg-white py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-[#7D7D7D]">
            &copy; 2024-2026 PwC Samil. Easy View 3.0 — Confidential
          </p>
          <div className="flex items-center gap-2 text-xs text-[#ABABAB]">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>삼일회계법인 보안 정책에 의해 보호됨</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
