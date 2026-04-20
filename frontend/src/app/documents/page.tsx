"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import PwCLogo from "@/components/PwCLogo";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/lib/auth";

// ---- Types ----
interface Category {
  id: number;
  name: string;
  description: string;
  is_required: number;
}

interface DocPost {
  id: number;
  category_id: number;
  category_name: string;
  is_required: number;
  title: string;
  file_name: string;
  file_size: number;
  company_id: number;
  company_name: string;
  author_name: string;
  view_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

interface MonthData {
  period_id: number;
  period: string;       // "2026-05"
  label: string;        // "2026년 5월"
  due_date: string;
  files: {
    id: number;
    category_id: number;
    category_name: string;
    is_required: number;
    title: string;
    file_name: string;
    file_size: number;
    author_name: string;
    created_at: string;
    period_start: string;
    period_end: string;
    request_id: number | null;
    comment_count: number;
    has_unread: boolean;
  }[];
  missing: {
    category_id: number;
    category_name: string;
    is_required: number;
    request_id: number | null;
    status: "등록됨" | "요청됨" | "재요청";
    due_date: string | null;
    email_sent_at: string | null;
    request_owner: string | null;
    requestee_email: string | null;
    requestee_name: string | null;
    message: string | null;
    comment_count: number;
    has_unread: boolean;
  }[];
}

interface CompanyMonthly {
  company_id: number;
  company_name: string;
  company_code: string;
  country: string;
  erp_system: string;
  months: MonthData[];
}

// ---- Helper components ----
function NavHeader({ user, logout }: { user: any; logout: () => void }) {
  return (
    <header className="bg-white border-b border-[#E8E8E8] shadow-xs sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-5">
          <Link href="/reports" className="flex items-center gap-3">
            <PwCLogo height={22} color="#2D2D2D" />
            <span className="text-[#F68600] text-lg font-light">|</span>
            <span className="text-[#2D2D2D] text-base font-semibold">Easy View</span>
          </Link>
          <nav className="flex items-center gap-1 ml-4">
            <Link href="/reports" className="px-3 py-1.5 text-xs font-medium rounded text-[#464646] hover:bg-[#F5F5F5] transition-colors">
              리포트
            </Link>
            <Link href="/upload" className="px-3 py-1.5 text-xs font-medium rounded text-[#464646] hover:bg-[#F5F5F5] transition-colors">
              새 리포트
            </Link>
            <Link href="/documents" className="px-3 py-1.5 text-xs font-medium rounded bg-[#2D2D2D] text-white">
              자료실
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
              <span>{user.department}</span>
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs text-[#7D7D7D] hover:text-[#F68600] border border-[#E8E8E8] rounded hover:border-[#F68600] transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ---- Email modal ----
interface EmailModalProps {
  companyName: string;
  categoryName: string;
  dueDate: string;
  requestId: number | null;
  onClose: () => void;
  onSent: () => void;
}

function EmailModal({ companyName, categoryName, dueDate, requestId, onClose, onSent }: EmailModalProps) {
  const [toName, setToName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState(`[자료 제출 요청] ${categoryName} — ${companyName}`);
  const [body, setBody] = useState(
    `안녕하세요,\n\n${companyName} 담당자님께 ${categoryName} 자료 제출을 요청드립니다.\n\n` +
    `▶ 제출 기한: ${dueDate || "미정"}\n` +
    `▶ 제출 방법: PwC Easy View 자료실 → [게시글 작성]\n\n` +
    `기한 내 제출 부탁드립니다.\n\n감사합니다.\n삼일회계법인 드림`
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!toEmail.trim()) { setError("수신자 이메일을 입력하세요."); return; }
    setSending(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`/api/documents/admin/request/${requestId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to_email: toEmail, to_name: toName, subject, body }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "발송 실패");
      onSent();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
          <h2 className="text-base font-semibold text-[#2D2D2D]">제출 요청 메일 발송</h2>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#2D2D2D]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#464646] mb-1">수신자 이름</label>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="홍길동"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F68600]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#464646] mb-1">수신자 이메일 *</label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F68600]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">제목</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F68600]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">본문</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F68600] resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8E8]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#ABABAB] transition-colors">
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2 text-sm font-semibold bg-[#F68600] text-white rounded hover:bg-[#DD7900] transition-colors disabled:opacity-50"
          >
            {sending ? "발송 중..." : "메일 발송"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ---- Shared company checklist with "전체" header ----
function CompanyChecklist({ companies, selected, onChange }: {
  companies: { id: number; name: string }[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}) {
  const allChecked = companies.length > 0 && selected.size === companies.length;
  const someChecked = selected.size > 0 && selected.size < companies.length;
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggleAll = () => {
    if (allChecked || someChecked) onChange(new Set());
    else onChange(new Set(companies.map((c) => c.id)));
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  return (
    <div className="border border-[#E8E8E8] rounded overflow-hidden">
      {/* Header row */}
      <label className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] border-b border-[#E8E8E8] cursor-pointer hover:bg-[#EFEFEF]">
        <input
          ref={allRef}
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
          className="w-4 h-4 accent-[#F68600]"
        />
        <span className="text-xs font-semibold text-[#464646]">전체</span>
        <span className="ml-auto text-xs text-[#ABABAB]">{selected.size}/{companies.length}</span>
      </label>
      {/* Company rows */}
      <div className="max-h-40 overflow-y-auto divide-y divide-[#F5F5F5]">
        {companies.map((c) => (
          <label key={c.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#FAFAFA]">
            <input
              type="checkbox"
              checked={selected.has(c.id)}
              onChange={() => toggleOne(c.id)}
              className="w-4 h-4 accent-[#F68600]"
            />
            <span className="text-sm text-[#2D2D2D]">{c.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ---- 요청 등록 modal (unified) ----
function RequestRegisterModal({ onClose, onCreated, companies, categories }: {
  onClose: () => void;
  onCreated: () => void;
  companies: { id: number; name: string }[];
  categories: Category[];
}) {
  const now = new Date();
  const [isNewPeriod, setIsNewPeriod] = useState(true);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [existingPeriods, setExistingPeriods] = useState<{ id: number; period: string; label: string; due_date?: string }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allCatChecked = selectedCategories.size === categories.length;
  const someCatChecked = selectedCategories.size > 0 && selectedCategories.size < categories.length;
  const allCatRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (allCatRef.current) allCatRef.current.indeterminate = someCatChecked;
  }, [someCatChecked]);

  useEffect(() => {
    const token = getToken();
    fetch("/api/documents/admin/periods", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = d.periods || [];
        setExistingPeriods(list);
        if (list.length > 0) setSelectedPeriod(list[list.length - 1].period);
      });
  }, []);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllCategories = () => {
    if (allCatChecked || someCatChecked) setSelectedCategories(new Set());
    else setSelectedCategories(new Set(categories.map((c) => c.id)));
  };

  const handleSubmit = async () => {
    if (selectedCompanies.size === 0) { setError("회사를 1개 이상 선택하세요."); return; }
    if (selectedCategories.size === 0) { setError("서류 종류를 1개 이상 선택하세요."); return; }
    setLoading(true);
    setError("");
    const token = getToken();
    try {
      let periodStr = "";
      let periodId: number | null = null;
      if (isNewPeriod) {
        periodStr = `${year}-${month}`;
        const label = `${year}년 ${parseInt(month)}월`;
        const res = await fetch("/api/documents/admin/periods", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ period: periodStr, label, due_date: dueDate }),
        });
        if (!res.ok) throw new Error((await res.json()).detail || "기간 생성 실패");
        const created = await res.json();
        periodId = created.id ?? null;
      } else {
        if (!selectedPeriod) { setError("기간을 선택하세요."); setLoading(false); return; }
        periodStr = selectedPeriod;
        periodId = existingPeriods.find((p) => p.period === selectedPeriod)?.id ?? null;
      }

      const companyList = companies.filter((c) => selectedCompanies.has(c.id));
      const catList = [...selectedCategories];
      await Promise.all(
        companyList.flatMap((comp) =>
          catList.map((catId) =>
            fetch("/api/documents/admin/request", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ category_id: catId, company_id: comp.id, due_date: dueDate, message: "", period_id: periodId }),
            })
          )
        )
      );
      onCreated();
    } catch (e: any) {
      setError(e.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8] flex-shrink-0">
          <h2 className="text-base font-semibold text-[#2D2D2D]">요청 등록</h2>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#2D2D2D]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* 기간 */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-[#2D2D2D] mb-2">
              <span className="text-[#F68600]">*</span> 기간
            </label>
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={() => setIsNewPeriod(true)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${isNewPeriod ? "bg-[#F68600] text-white border-[#F68600]" : "border-[#E8E8E8] text-[#7D7D7D] hover:border-[#ABABAB]"}`}
              >신규</button>
              <button
                onClick={() => setIsNewPeriod(false)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${!isNewPeriod ? "bg-[#F68600] text-white border-[#F68600]" : "border-[#E8E8E8] text-[#7D7D7D] hover:border-[#ABABAB]"}`}
              >기존</button>
            </div>
            {isNewPeriod ? (
              <div className="flex items-center gap-2">
                <select value={year} onChange={(e) => setYear(e.target.value)} className="flex-1 border border-[#E8E8E8] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F68600]">
                  {years.map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="flex-1 border border-[#E8E8E8] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F68600]">
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                    <option key={m} value={m}>{parseInt(m)}월</option>
                  ))}
                </select>
              </div>
            ) : existingPeriods.length === 0 ? (
              <p className="text-xs text-[#ABABAB]">등록된 기간이 없습니다.</p>
            ) : (
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F68600]">
                {existingPeriods.map((p) => <option key={p.id} value={p.period}>{p.label} ({p.period})</option>)}
              </select>
            )}
          </div>
          {/* 기한 */}
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-2">제출 기한 <span className="text-[#ABABAB] font-normal text-xs">(선택)</span></label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-[#E8E8E8] rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F68600]" />
          </div>
          {/* 서류 종류 */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-[#2D2D2D] mb-2">
              <span className="text-[#F68600]">*</span> 서류 종류
            </label>
            <div className="border border-[#E8E8E8] rounded overflow-hidden">
              <label className="flex items-center gap-3 px-3 py-2 bg-[#F5F5F5] border-b border-[#E8E8E8] cursor-pointer hover:bg-[#EFEFEF]">
                <input ref={allCatRef} type="checkbox" checked={allCatChecked} onChange={toggleAllCategories} className="w-4 h-4" />
                <span className="text-xs font-semibold text-[#464646]">전체</span>
                <span className="ml-auto text-xs text-[#ABABAB]">{selectedCategories.size}/{categories.length}</span>
              </label>
              <div className="max-h-52 overflow-y-auto divide-y divide-[#F5F5F5]">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#FAFAFA]">
                    <input type="checkbox" checked={selectedCategories.has(c.id)} onChange={() => toggleCategory(c.id)} className="w-4 h-4" />
                    <span className="text-sm text-[#2D2D2D] flex-1">{c.name}</span>
                    {c.is_required ? (
                      <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">필수</span>
                    ) : (
                      <span className="text-[10px] text-[#ABABAB] bg-[#F5F5F5] px-1.5 py-0.5 rounded">선택</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {/* 대상 회사 */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-[#2D2D2D] mb-2">
              <span className="text-[#F68600]">*</span> 대상 회사
            </label>
            <CompanyChecklist companies={companies} selected={selectedCompanies} onChange={setSelectedCompanies} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8E8] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#ABABAB] transition-colors">취소</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-[#F68600] text-white rounded hover:bg-[#DD7900] transition-colors disabled:opacity-50">
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ---- Document detail / comment modal ----
interface Comment {
  id: number;
  author_id: number;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

interface RequestFile {
  id: number;
  title: string;
  file_name: string;
  file_size: number;
  author_name: string;
  created_at: string;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DocumentDetailModal({ requestId, categoryName, companyName, periodLabel, dueDate, status, directFile, onClose }: {
  requestId: number | null;
  categoryName: string;
  companyName: string;
  periodLabel: string;
  dueDate: string | null;
  status: string;
  directFile?: RequestFile;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<RequestFile[]>(directFile ? [directFile] : []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestId) return;
    const token = getToken();
    fetch(`/api/documents/requests/${requestId}/comments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []));
    fetch(`/api/documents/requests/${requestId}/files`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        // Merge API results with directFile seed, avoiding duplicates
        const apiFiles: RequestFile[] = d.files || [];
        if (directFile && !apiFiles.some((f) => f.id === directFile.id)) {
          setFiles([directFile, ...apiFiles]);
        } else {
          setFiles(apiFiles.length > 0 ? apiFiles : (directFile ? [directFile] : []));
        }
      });
    fetch(`/api/documents/requests/${requestId}/comments/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const downloadFile = async (fileId: number, fileName: string) => {
    const token = getToken();
    const res = await fetch(`/api/documents/${fileId}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!input.trim() || !requestId) return;
    setSending(true);
    const token = getToken();
    const res = await fetch(`/api/documents/requests/${requestId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setInput("");
    }
    setSending(false);
  };

  const handleEdit = async (commentId: number) => {
    if (!editText.trim()) return;
    const token = getToken();
    const res = await fetch(`/api/documents/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: editText.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setComments((prev) => prev.map((c) => c.id === commentId ? updated : c));
      setEditingId(null);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    const token = getToken();
    const res = await fetch(`/api/documents/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  // Group comments by date for separators
  let lastDate = "";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E8E8E8] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#2D2D2D]">{categoryName}</h2>
            <p className="text-xs text-[#ABABAB] mt-0.5">{companyName} · {periodLabel}</p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={
                status === "요청됨" ? { background: "#EFF6FF", color: "#2563EB" } :
                status === "재요청" ? { background: "#FFF7ED", color: "#EA580C" } :
                status === "제출"   ? { background: "#F0FDF4", color: "#059669" } :
                { background: "#F5F5F5", color: "#7D7D7D" }
              }
            >{status}</span>
            {dueDate && <span className="text-xs text-[#7D7D7D]">마감 <span className="font-medium text-[#2D2D2D]">{dueDate}</span></span>}
            <button onClick={onClose} className="text-[#ABABAB] hover:text-[#2D2D2D]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Submitted files */}
        {files.length > 0 && (
          <div className="px-6 py-3 border-b border-[#F0F0F0] flex-shrink-0 space-y-1.5">
            <p className="text-[10px] font-semibold text-[#ABABAB] uppercase tracking-wider mb-2">제출 파일</p>
            {files.map((f) => (
              <button
                key={f.id}
                onClick={() => downloadFile(f.id, f.file_name)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded border border-[#E8E8E8] hover:border-[#F68600] hover:bg-[#FFF8F3] transition-colors text-left group"
              >
                <svg className="w-4 h-4 text-[#ABABAB] group-hover:text-[#F68600] flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-medium text-[#2D2D2D] truncate group-hover:text-[#F68600] transition-colors">{f.file_name || f.title}</span>
                  <span className="text-[10px] text-[#ABABAB]">{f.author_name} · {fmtDate(f.created_at)}</span>
                </span>
                <svg className="w-3.5 h-3.5 text-[#ABABAB] group-hover:text-[#F68600] flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-[#ABABAB] text-center py-12">아직 댓글이 없습니다.</p>
          )}
          {comments.map((c) => {
            const dateStr = fmtDate(c.created_at);
            const showSep = dateStr !== lastDate;
            lastDate = dateStr;
            const isOwn = user && (c.author_id === user.id || c.author_name === user.name);
            const isAdmin = c.author_role === "admin";

            return (
              <div key={c.id}>
                {/* Date separator */}
                {showSep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t border-dashed border-[#E0E0E0]" />
                    <span className="text-[11px] italic text-[#D04A02] font-medium flex-shrink-0">{dateStr}</span>
                    <div className="flex-1 border-t border-dashed border-[#E0E0E0]" />
                  </div>
                )}
                {/* Comment card */}
                <div className="group border border-[#E8E8E8] rounded overflow-hidden hover:border-[#C8C8C8] transition-colors">
                  {/* Body */}
                  <div className="px-4 pt-4 pb-3">
                    {editingId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(c.id); } }}
                          rows={3}
                          autoFocus
                          className="w-full border border-[#F68600] rounded px-3 py-2 text-sm resize-none focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-xs text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#ABABAB] transition-colors"
                          >취소</button>
                          <button
                            onClick={() => handleEdit(c.id)}
                            className="px-3 py-1 text-xs font-semibold bg-[#2D2D2D] text-white rounded hover:bg-[#464646] transition-colors"
                          >저장</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="px-4 pb-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-[#ABABAB]">
                        {c.updated_at ? fmtDateTime(c.updated_at) : fmtDateTime(c.created_at)}
                      </span>
                      {c.updated_at && (
                        <span className="text-[10px] text-[#ABABAB] bg-[#F5F5F5] px-1.5 py-0.5 rounded">(수정됨)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Edit/delete — visible on hover for own comments */}
                      {isOwn && editingId !== c.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                            className="text-[11px] text-[#ABABAB] hover:text-[#2D2D2D] transition-colors"
                          >편집</button>
                          <span className="text-[#D8D8D8] text-[10px]">|</span>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-[11px] text-[#ABABAB] hover:text-red-500 transition-colors"
                          >삭제</button>
                        </div>
                      )}
                      {/* Author name */}
                      <span className={`text-xs font-medium ${isAdmin ? "text-[#D04A02]" : "text-[#464646]"}`}>{c.author_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-[#E8E8E8] flex-shrink-0">
          {requestId ? (
            <div className="border border-[#E8E8E8] rounded-lg overflow-hidden focus-within:border-[#F68600] transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type your comment here..."
                rows={2}
                className="w-full px-4 py-3 text-sm resize-none focus:outline-none text-[#2D2D2D] placeholder-[#ABABAB]"
              />
              <div className="flex justify-end px-3 pb-2">
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="flex items-center gap-1.5 text-[#ABABAB] hover:text-[#F68600] transition-colors disabled:opacity-30"
                  title="전송 (Enter)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#ABABAB] text-center py-1">요청이 등록되지 않아 댓글을 남길 수 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}


// ---- Main page ----
export default function DocumentsPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  // Tracks per-request due date overrides in edit mode (key: request_id)
  const [editDates, setEditDates] = useState<Record<number, string>>({});
  // Tracks request_ids marked for deletion in edit mode (applied on save)
  const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set());

  // Board state
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<DocPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCompany, setFilterCompany] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterRequiredOnly, setFilterRequiredOnly] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Admin drill-down state
  const [monthlyData, setMonthlyData] = useState<CompanyMonthly[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [allCompanies, setAllCompanies] = useState<any[]>([]);

  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [emailModal, setEmailModal] = useState<{
    requestId: number;
    companyName: string;
    categoryName: string;
    dueDate: string;
  } | null>(null);
  const [detailModal, setDetailModal] = useState<{
    requestId: number | null;
    categoryName: string;
    companyName: string;
    periodLabel: string;
    dueDate: string | null;
    status: string;
    directFile?: RequestFile;
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const PER_PAGE = 20;

  // Load categories
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/documents/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(console.error);
  }, []);

  // Load companies (admin)
  useEffect(() => {
    if (!isAdmin) return;
    const token = getToken();
    fetch("/api/auth/companies", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setAllCompanies(d.companies || []))
      .catch(console.error);
  }, [isAdmin]);

  // Load available years for period filter
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/documents/years", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setAvailableYears(d.years || []))
      .catch(console.error);
  }, []);

  // Load posts
  const loadPosts = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setLoadingPosts(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
    if (filterCompany && isAdmin) params.set("company_id", String(filterCompany));
    if (filterYear) params.set("period_year", String(filterYear));
    if (filterRequiredOnly) params.set("required_only", "true");
    fetch(`/api/documents?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setPosts(d.posts || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setLoadingPosts(false));
  }, [page, filterCompany, filterYear, filterRequiredOnly, isAdmin]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Load monthly drill-down status (admin)
  const loadStatus = useCallback(() => {
    if (!isAdmin) return;
    const token = getToken();
    setLoadingStatus(true);
    fetch("/api/documents/admin/monthly-status", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setMonthlyData(d.companies || []))
      .catch(console.error)
      .finally(() => setLoadingStatus(false));
  }, [isAdmin]);

  // Clear the unread dot locally when a modal is opened — avoids a full reload + scroll jump
  const clearUnread = (requestId: number | null) => {
    if (!requestId) return;
    setMonthlyData((prev) =>
      prev.map((company) => ({
        ...company,
        months: company.months.map((month) => ({
          ...month,
          files: month.files.map((f) =>
            f.request_id === requestId ? { ...f, has_unread: false } : f
          ),
          missing: month.missing.map((m) =>
            m.request_id === requestId ? { ...m, has_unread: false } : m
          ),
        })),
      }))
    );
  };

  const toggleCompany = (id: number) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleMonth = (companyId: number, period: string) => {
    const key = `${companyId}-${period}`;
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (isAdmin) loadStatus();
  }, [isAdmin, loadStatus]);



  const handleDelete = async () => {
    if (selectedPosts.size === 0) return;
    if (!confirm(`선택한 ${selectedPosts.size}개의 게시물을 삭제하시겠습니까?`)) return;
    const token = getToken();
    try {
      await Promise.all(
        [...selectedPosts].map((id) =>
          fetch(`/api/documents/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setSelectedPosts(new Set());
      loadPosts();
      showToast("삭제되었습니다.");
    } catch {
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDownload = (post: DocPost) => {
    const token = getToken();
    const a = document.createElement("a");
    a.href = `/api/documents/${post.id}/download`;
    // Include auth via query (or use fetch + blob)
    fetch(`/api/documents/${post.id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = post.file_name || "download";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => showToast("파일 다운로드 실패", "error"));
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const toggleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map((p) => p.id)));
    }
  };

  return (
    <div className="documents-page min-h-screen bg-white flex flex-col">
      <NavHeader user={user} logout={logout} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#2D2D2D]">자료실</h1>
            <div className="relative group">
              <button className="w-5 h-5 rounded-full bg-[#E8E8E8] text-[#7D7D7D] text-xs flex items-center justify-center hover:bg-[#F68600] hover:text-white transition-colors">
                ?
              </button>
              <div className="absolute left-7 top-0 w-56 bg-[#2D2D2D] text-white text-xs rounded px-3 py-2 hidden group-hover:block z-10 shadow-lg">
                현지회사 담당자가 자료를 업로드하면, 본사에서 제출 현황을 확인하고 미제출 업체에 요청 메일을 보낼 수 있습니다.
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {/* Edit mode toggle */}
              {isEditMode ? (
                <>
                  <button
                    onClick={async () => {
                      const token = getToken();
                      await Promise.all([
                        ...Object.entries(editDates).map(([requestId, dueDate]) =>
                          fetch(`/api/documents/admin/requests/${requestId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ due_date: dueDate }),
                          })
                        ),
                        ...[...pendingDeletes].map((requestId) =>
                          fetch(`/api/documents/admin/requests/${requestId}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          })
                        ),
                      ]);
                      setEditDates({});
                      setPendingDeletes(new Set());
                      setIsEditMode(false);
                      loadStatus();
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded border bg-[#2D2D2D] text-white border-[#2D2D2D] hover:bg-[#464646] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    저장
                  </button>
                  <button
                    onClick={() => { setEditDates({}); setPendingDeletes(new Set()); setIsEditMode(false); }}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded border border-[#E8E8E8] text-[#7D7D7D] hover:border-[#ABABAB] hover:text-[#464646] transition-colors"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded border border-[#E8E8E8] text-[#464646] hover:border-[#2D2D2D] hover:text-[#2D2D2D] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  편집
                </button>
              )}
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#F68600] text-white rounded hover:bg-[#DD7900] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                요청 등록
              </button>
            </div>
          )}
        </div>

        {/* ===== Admin: company drill-down ===== */}
        {isAdmin && (
          <div className="mb-6">
            {loadingStatus ? (
              <div className="flex justify-center py-20">
                <svg className="w-7 h-7 text-[#F68600] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E8E8E8] py-16 text-center text-[#ABABAB] text-sm">
                데이터가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {monthlyData.map((company) => {
                  const isCompanyOpen = expandedCompanies.has(company.company_id);
                  const totalRequired = company.months.reduce((sum, m) => sum + m.files.length + m.missing.length, 0);
                  const totalSubmitted = company.months.reduce((sum, m) => sum + m.files.length, 0);
                  const totalMissing = company.months.reduce((sum, m) => sum + m.missing.length, 0);
                  const today = new Date().toISOString().slice(0, 10);
                  return (
                    <div key={company.company_id} className="bg-white rounded-lg border border-[#E8E8E8] overflow-hidden">
                      {/* Company row — level-1 header: orange left accent */}
                      <button
                        onClick={() => toggleCompany(company.company_id)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 bg-[#F5F5F5] hover:bg-[#EFEFEF] transition-colors text-left border-b border-[#D4D4D4]"
                      >
                        <svg
                          className={`w-4 h-4 text-[#7D7D7D] transition-transform flex-shrink-0 ${isCompanyOpen ? "rotate-90" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-bold text-[#1D1D1D]">{company.company_name}</span>
                        <span className="text-xs text-[#7D7D7D]">{company.company_code}</span>
                        {company.country && (
                          <span className="text-xs text-[#464646] bg-white border border-[#D8D8D8] px-2 py-0.5 rounded">{company.country}</span>
                        )}
                        {company.erp_system && (
                          <span className="text-xs text-[#E87722] bg-[#FFF3EE] border border-[#F5D8C0] px-2 py-0.5 rounded font-medium">{company.erp_system}</span>
                        )}
                        <div className="ml-auto flex items-center gap-4 text-xs">
                          <span className={`font-medium tabular-nums ${totalMissing > 0 ? "text-[#7D7D7D]" : "text-[#2D7D2D]"}`}>
                            {totalSubmitted}/{totalRequired}
                          </span>
                          {totalMissing > 0 ? (
                            <span className="text-[#E87722] font-semibold">미완료 {totalMissing}건</span>
                          ) : totalRequired > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[#2D7D2D] font-medium">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              완료
                            </span>
                          ) : null}
                        </div>
                      </button>

                      {/* Month list */}
                      {isCompanyOpen && (
                        <div>
                          {company.months.length === 0 ? (
                            <p className="px-10 py-4 text-xs text-[#ABABAB]">등록된 기간이 없습니다.</p>
                          ) : (
                            company.months.map((month) => {
                              const monthKey = `${company.company_id}-${month.period}`;
                              const isMonthOpen = expandedMonths.has(monthKey);
                              const periodLabel = month.period.replace("-", ".");
                              const allDone = month.missing.length === 0 && month.files.length > 0;
                              return (
                                <div key={month.period} className="border-t border-[#D4D4D4] first:border-t-0">
                                  {/* Month folder row — level-2 header */}
                                  <div className={`flex items-center pl-10 pr-4 py-2.5 transition-colors border-b border-[#EBEBEB] ${isMonthOpen ? "bg-[#FAFAFA]" : "bg-[#FAFAFA] hover:bg-[#F5F5F5]"}`}>
                                    <button
                                      onClick={() => toggleMonth(company.company_id, month.period)}
                                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                                    >
                                      <svg
                                        className={`w-3.5 h-3.5 text-[#ABABAB] transition-transform flex-shrink-0 ${isMonthOpen ? "rotate-90" : ""}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                      </svg>
                                      <span className="text-sm font-semibold text-[#464646]">{periodLabel}</span>
                                      <span className="text-xs text-[#ABABAB] tabular-nums">{month.files.length}/{month.files.length + month.missing.length}</span>
                                      {allDone && (
                                        <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">완료</span>
                                      )}
                                      {month.missing.length > 0 && (
                                        <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">미완료 {month.missing.length}건</span>
                                      )}
                                    </button>

                                    {/* Month-level actions */}
                                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                      {/* Edit mode: bulk due date for this company+period + delete this company's requests */}
                                      {isEditMode && (
                                        <>
                                          <input
                                            type="date"
                                            defaultValue={month.due_date || ""}
                                            className="border border-[#F68600] rounded px-2 py-0.5 text-xs focus:outline-none"
                                            onChange={(e) => {
                                              const newDate = e.target.value;
                                              const updates: Record<number, string> = {};
                                              for (const cat of month.missing) {
                                                if (cat.request_id) updates[cat.request_id] = newDate;
                                              }
                                              setEditDates((prev) => ({ ...prev, ...updates }));
                                            }}
                                            title="이 회사의 이 기간 마감일 일괄 변경"
                                          />
                                          <button
                                            onClick={async () => {
                                              if (!confirm(`${company.company_name} / ${periodLabel} 요청을 모두 삭제하시겠습니까?`)) return;
                                              const token = getToken();
                                              await fetch(`/api/documents/admin/company/${company.company_id}/period/${month.period_id}/requests`, {
                                                method: "DELETE",
                                                headers: { Authorization: `Bearer ${token}` },
                                              });
                                              loadStatus();
                                            }}
                                            className="p-1 text-[#CDCDCD] hover:text-red-500 transition-colors flex-shrink-0"
                                            title="이 회사의 이 기간 요청 삭제"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </>
                                      )}

                                      {/* Zip download */}
                                      {month.files.length > 0 && (
                                        <button
                                          onClick={async () => {
                                            const token = getToken();
                                            const res = await fetch(
                                              `/api/documents/admin/download-zip/${company.company_id}/${month.period}`,
                                              { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            if (!res.ok) { showToast("다운로드 실패", "error"); return; }
                                            const blob = await res.blob();
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url; a.download = `${month.period}_files.zip`; a.click();
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="flex items-center gap-1 text-xs text-[#7D7D7D] border border-[#E8E8E8] rounded px-2 py-0.5 hover:border-[#F68600] hover:text-[#F68600] transition-colors"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          ZIP
                                        </button>
                                      )}

                                      {/* Bulk request */}
                                      {month.missing.length > 0 && (
                                        <button
                                          onClick={async () => {
                                            if (!confirm(`${company.company_name} / ${periodLabel} 미제출 ${month.missing.length}건에 일괄 요청을 생성하시겠습니까?`)) return;
                                            const token = getToken();
                                            const res = await fetch(
                                              `/api/documents/admin/bulk-request/${company.company_id}/${month.period}`,
                                              { method: "POST", headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            if (!res.ok) { showToast("일괄 요청 실패", "error"); return; }
                                            const data = await res.json();
                                            showToast(`요청 ${data.created}건 생성됨`);
                                            loadStatus();
                                          }}
                                          className="flex items-center gap-1 text-xs text-[#7D7D7D] border border-[#E8E8E8] rounded px-2 py-0.5 hover:border-[#F68600] hover:text-[#F68600] transition-colors"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                          </svg>
                                          일괄 요청
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Month contents */}
                                  {isMonthOpen && (
                                    <div className="overflow-x-auto">
                                      <div style={{ minWidth: "700px" }}>
                                        {/* Column header */}
                                        <div className="flex items-center gap-3 pl-16 pr-4 py-2 bg-white border-b border-[#E0E0E0]">
                                          <span className="w-32 flex-shrink-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider">서류 구분</span>
                                          <span className="w-16 flex-shrink-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider text-center">상태</span>
                                          <span className="flex-1 min-w-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider">파일명</span>
                                          <span className="w-32 flex-shrink-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider">마감일</span>
                                          <span className="w-24 flex-shrink-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider">요청 담당자</span>
                                          <span className="w-28 flex-shrink-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider">제출 담당자</span>
                                          <span className="w-40 flex-shrink-0 text-[10px] font-bold text-[#464646] uppercase tracking-wider">액션</span>
                                        </div>

                                        {/* Submitted files */}
                                        {month.files.map((file) => (
                                          <div
                                            key={file.id}
                                            className="flex items-center gap-3 pl-16 pr-4 py-2.5 border-b border-[#EBEBEB] hover:bg-[#FAFAFA] cursor-pointer"
                                            onClick={() => {
                                              setDetailModal({
                                                requestId: file.request_id,
                                                categoryName: file.category_name,
                                                companyName: company.company_name,
                                                periodLabel: month.label,
                                                dueDate: month.due_date || null,
                                                status: "제출",
                                                directFile: { id: file.id, title: file.title, file_name: file.file_name, file_size: file.file_size, author_name: file.author_name, created_at: file.created_at },
                                              });
                                              clearUnread(file.request_id);
                                            }}
                                          >
                                            <span className="w-32 flex-shrink-0 flex items-center gap-1.5">
                                              <span className="text-xs font-medium text-[#2D2D2D]">{file.category_name}</span>
                                              {file.has_unread && (
                                                <span className="w-2 h-2 rounded-full bg-[#F68600] flex-shrink-0" title="읽지 않은 댓글" />
                                              )}
                                              {!file.has_unread && file.comment_count > 0 && (
                                                <span className="text-[10px] text-[#ABABAB] bg-[#F0F0F0] px-1.5 py-0.5 rounded-full leading-none">{file.comment_count}</span>
                                              )}
                                            </span>
                                            <span className="w-16 flex-shrink-0 inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium rounded" style={{ background: "#F0FDF4", color: "#059669" }}>
                                              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                              </svg>
                                              제출
                                            </span>
                                            <span className="flex-1 min-w-0 text-xs text-[#7D7D7D] truncate" title={file.file_name}>{file.file_name || file.title}</span>
                                            <span className="w-32 flex-shrink-0 text-xs text-[#7D7D7D]">{month.due_date || "—"}</span>
                                            <span className="w-24 flex-shrink-0 text-xs text-[#7D7D7D]">—</span>
                                            <span className="w-28 flex-shrink-0 text-xs text-[#7D7D7D]">{file.author_name}</span>
                                            <div className="w-40 flex-shrink-0 flex items-center gap-1.5">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(file as any); }}
                                                className="flex items-center gap-1 px-2 py-1 text-xs text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#F68600] hover:text-[#F68600] transition-colors whitespace-nowrap"
                                              >
                                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                다운로드
                                              </button>
                                              <button
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  if (!confirm("이 파일을 재요청 처리하시겠습니까?")) return;
                                                  const token = getToken();
                                                  const res = await fetch(`/api/documents/admin/files/${file.id}/reject`, {
                                                    method: "POST",
                                                    headers: { Authorization: `Bearer ${token}` },
                                                  });
                                                  if (!res.ok) { showToast("재요청 처리 실패", "error"); return; }
                                                  showToast("재요청 처리되었습니다.");
                                                  loadStatus();
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 text-xs text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-orange-400 hover:text-orange-500 transition-colors whitespace-nowrap"
                                              >
                                                재요청
                                              </button>
                                            </div>
                                          </div>
                                        ))}

                                        {/* Missing / rejected categories */}
                                        {month.missing.filter((cat) => !(cat.request_id && pendingDeletes.has(cat.request_id))).map((cat) => {
                                          const isOverdue = !!(cat.due_date && cat.due_date < today);
                                          return (
                                            <div
                                              key={cat.category_id}
                                              className="flex items-center gap-3 pl-16 pr-4 py-2.5 border-b border-[#EBEBEB] hover:bg-[#FAFAFA] cursor-pointer"
                                              onClick={() => {
                                                if (cat.request_id) {
                                                  setDetailModal({
                                                    requestId: cat.request_id,
                                                    categoryName: cat.category_name,
                                                    companyName: company.company_name,
                                                    periodLabel: month.label,
                                                    dueDate: cat.due_date,
                                                    status: cat.status,
                                                  });
                                                  clearUnread(cat.request_id);
                                                }
                                              }}
                                            >
                                              <span className="w-32 flex-shrink-0">
                                                <span className="flex items-center gap-1.5">
                                                  <span className="text-xs font-medium text-[#2D2D2D]">{cat.category_name}</span>
                                                  {cat.has_unread && (
                                                    <span className="w-2 h-2 rounded-full bg-[#F68600] flex-shrink-0" title="읽지 않은 댓글" />
                                                  )}
                                                  {!cat.has_unread && cat.comment_count > 0 && (
                                                    <span className="text-[10px] text-[#ABABAB] bg-[#F0F0F0] px-1.5 py-0.5 rounded-full leading-none">{cat.comment_count}</span>
                                                  )}
                                                </span>
                                                {cat.message && (
                                                  <span className="block text-[10px] text-[#ABABAB] truncate mt-0.5" title={cat.message}>{cat.message}</span>
                                                )}
                                              </span>
                                              <span className={`w-16 flex-shrink-0 inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium rounded ${
                                                cat.status === "요청됨"  ? "bg-blue-50 text-blue-600" :
                                                cat.status === "재요청"  ? "bg-orange-50 text-orange-600" :
                                                cat.status === "등록됨"  ? "bg-[#F5F5F5] text-[#7D7D7D]" :
                                                "bg-[#F5F5F5] text-[#7D7D7D]"
                                              }`}>
                                                {cat.status === "요청됨" && (
                                                  <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                  </svg>
                                                )}
                                                {cat.status === "재요청" && (
                                                  <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                  </svg>
                                                )}
                                                {cat.status}
                                              </span>
                                              <span className="flex-1 min-w-0 text-xs text-[#ABABAB]">—</span>
                                              {isEditMode && cat.request_id ? (
                                                <input
                                                  type="date"
                                                  value={editDates[cat.request_id] !== undefined ? editDates[cat.request_id] : (cat.due_date || "")}
                                                  className="w-32 flex-shrink-0 border border-[#F68600] rounded px-2 py-0.5 text-xs focus:outline-none"
                                                  onClick={(e) => e.stopPropagation()}
                                                  onChange={(e) => {
                                                    e.stopPropagation();
                                                    setEditDates((prev) => ({ ...prev, [cat.request_id!]: e.target.value }));
                                                  }}
                                                />
                                              ) : (
                                                <span className={`w-32 flex-shrink-0 text-xs font-medium ${isOverdue ? "text-red-500" : "text-[#7D7D7D]"}`}>
                                                  {cat.due_date || "—"}
                                                  {isOverdue && <span className="ml-1 text-[10px]">기한초과</span>}
                                                </span>
                                              )}
                                              <span className="w-24 flex-shrink-0 text-xs text-[#7D7D7D]">{cat.request_owner || "—"}</span>
                                              <span className="w-28 flex-shrink-0 text-xs text-[#7D7D7D]">{cat.requestee_name || cat.requestee_email || "—"}</span>
                                              <div className="w-40 flex-shrink-0 flex items-center gap-1.5">
                                                {!isEditMode && cat.request_id && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEmailModal({ requestId: cat.request_id!, companyName: company.company_name, categoryName: cat.category_name, dueDate: cat.due_date || month.due_date || "" });
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#F68600] hover:text-[#F68600] transition-colors whitespace-nowrap"
                                                  >
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    제출 요청
                                                  </button>
                                                )}
                                                {isEditMode && cat.request_id && (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); setPendingDeletes((prev) => new Set([...prev, cat.request_id!])); }}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#ABABAB] border border-[#E8E8E8] rounded hover:border-red-400 hover:text-red-500 transition-colors whitespace-nowrap"
                                                  >
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    삭제
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== File list: regular user only ===== */}
        {!isAdmin && (
          <div className="bg-white rounded-lg border border-[#E8E8E8] overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Company filter (admin only) */}
                {isAdmin && (
                  <select
                    value={filterCompany ?? ""}
                    onChange={(e) => { setFilterCompany(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                    className="pl-3 pr-7 py-1.5 text-xs border border-[#E8E8E8] rounded focus:outline-none focus:border-[#F68600] bg-white text-[#464646]"
                  >
                    <option value="">전체 회사</option>
                    {allCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
                {/* Period year filter */}
                <select
                  value={filterYear ?? ""}
                  onChange={(e) => { setFilterYear(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                  className="pl-3 pr-7 py-1.5 text-xs border border-[#E8E8E8] rounded focus:outline-none focus:border-[#F68600] bg-white text-[#464646]"
                >
                  <option value="">전체 기간</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                {/* Required only toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filterRequiredOnly}
                    onChange={(e) => { setFilterRequiredOnly(e.target.checked); setPage(1); }}
                    className="accent-[#F68600] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-[#464646]">필수 항목만</span>
                </label>
                {/* Active filter indicator */}
                {(filterCompany || filterYear || filterRequiredOnly) && (
                  <button
                    onClick={() => { setFilterCompany(null); setFilterYear(null); setFilterRequiredOnly(false); setPage(1); }}
                    className="flex items-center gap-1 text-xs text-[#F68600] hover:underline"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    필터 초기화
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(isAdmin || selectedPosts.size > 0) && (
                  <button
                    onClick={handleDelete}
                    disabled={selectedPosts.size === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E8E8E8] rounded text-[#7D7D7D] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                )}
                <Link
                  href="/documents/new"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#F68600] text-white rounded hover:bg-[#DD7900] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  게시글 작성
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F5F5] border-b border-[#E8E8E8]">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={posts.length > 0 && selectedPosts.size === posts.length}
                        onChange={toggleSelectAll}
                        className="accent-[#F68600]"
                      />
                    </th>
                    <th className="w-14 px-2 py-3 text-center text-xs font-medium text-[#7D7D7D]">번호</th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-[#7D7D7D]">구분</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#7D7D7D]">제목</th>
                    {isAdmin && <th className="w-28 px-4 py-3 text-left text-xs font-medium text-[#7D7D7D]">회사</th>}
                    <th className="w-20 px-4 py-3 text-center text-xs font-medium text-[#7D7D7D]">작성자</th>
                    <th className="w-16 px-4 py-3 text-center text-xs font-medium text-[#7D7D7D]">조회수</th>
                    <th className="w-24 px-4 py-3 text-center text-xs font-medium text-[#7D7D7D]">작성일자</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPosts ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center">
                        <svg className="w-7 h-7 text-[#F68600] animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center text-[#ABABAB] text-sm">
                        등록된 자료가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    posts.map((post, idx) => (
                      <tr key={post.id} className="border-b border-[#EBEBEB] hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedPosts.has(post.id)}
                            onChange={(e) => {
                              const next = new Set(selectedPosts);
                              e.target.checked ? next.add(post.id) : next.delete(post.id);
                              setSelectedPosts(next);
                            }}
                            className="accent-[#F68600]"
                          />
                        </td>
                        <td className="px-2 py-3 text-center text-xs text-[#ABABAB]">
                          {total - (page - 1) * PER_PAGE - idx}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-2 py-0.5 bg-[#FFF3EE] text-[#F68600] text-xs rounded">
                              {post.category_name}
                            </span>
                            {post.is_required ? (
                              <span className="inline-block px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-semibold rounded">필수</span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 bg-[#F5F5F5] text-[#ABABAB] text-[10px] rounded">선택</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[#2D2D2D] font-medium hover:text-[#F68600] cursor-default">
                              {post.title}
                            </span>
                            {(post.period_start || post.period_end) && (
                              <span className="text-[10px] text-[#7D7D7D] bg-[#F5F5F5] px-1.5 py-0.5 rounded whitespace-nowrap">
                                {post.period_start}{post.period_start && post.period_end ? " ~ " : ""}{post.period_end}
                              </span>
                            )}
                            {post.file_name && (
                              <button
                                onClick={() => handleDownload(post)}
                                title={`${post.file_name} (${formatSize(post.file_size)})`}
                                className="flex items-center gap-1 text-[#7D7D7D] hover:text-[#F68600] transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-xs">{formatSize(post.file_size)}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-xs text-[#7D7D7D]">{post.company_name}</td>
                        )}
                        <td className="px-4 py-3 text-xs text-center text-[#7D7D7D]">{post.author_name}</td>
                        <td className="px-4 py-3 text-xs text-center text-[#ABABAB]">{post.view_count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-center text-[#ABABAB]">{formatDate(post.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 py-4 border-t border-[#E8E8E8]">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#ABABAB] hover:text-[#2D2D2D] disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${p === page ? "bg-[#F68600] text-white" : "text-[#7D7D7D] hover:bg-[#F5F5F5]"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded text-[#ABABAB] hover:text-[#2D2D2D] disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E8] bg-white py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-[#7D7D7D]">&copy; 2024-2026 PwC Samil. Easy View 3.0 — Confidential</p>
          <div className="flex items-center gap-2 text-xs text-[#ABABAB]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>삼일회계법인 보안 정책에 의해 보호됨</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showRequestModal && (
        <RequestRegisterModal
          categories={categories}
          companies={allCompanies}
          onClose={() => setShowRequestModal(false)}
          onCreated={() => { setShowRequestModal(false); loadStatus(); showToast("요청이 등록되었습니다."); }}
        />
      )}

      {detailModal && (
        <DocumentDetailModal
          requestId={detailModal.requestId}
          categoryName={detailModal.categoryName}
          companyName={detailModal.companyName}
          periodLabel={detailModal.periodLabel}
          dueDate={detailModal.dueDate}
          status={detailModal.status}
          directFile={detailModal.directFile}
          onClose={() => setDetailModal(null)}
        />
      )}

      {emailModal && (
        <EmailModal
          requestId={emailModal.requestId}
          companyName={emailModal.companyName}
          categoryName={emailModal.categoryName}
          dueDate={emailModal.dueDate}
          onClose={() => setEmailModal(null)}
          onSent={() => {
            setEmailModal(null);
            showToast("요청이 처리되었습니다.");
            loadStatus();
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all z-50 ${toast.type === "success" ? "bg-[#2D2D2D]" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
