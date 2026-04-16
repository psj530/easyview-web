"use client";

import { useState, useEffect, useCallback } from "react";
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

interface CompanyStatus {
  company_id: number;
  company_name: string;
  company_code: string;
  country: string;
  erp_system: string;
  categories: {
    category_id: number;
    category_name: string;
    is_required: boolean;
    submitted: boolean;
    submitted_at: string | null;
    author_name: string | null;
    file_name: string | null;
    period_start: string | null;
    period_end: string | null;
    due_date: string | null;
    email_sent_at: string | null;
  }[];
}

// ---- Helper components ----
function NavHeader({ user, logout }: { user: any; logout: () => void }) {
  return (
    <header className="bg-white border-b border-[#E8E8E8] shadow-xs sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-5">
          <Link href="/reports" className="flex items-center gap-3">
            <PwCLogo height={22} color="#2D2D2D" />
            <span className="text-[#D04A02] text-lg font-light">|</span>
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
              className="px-3 py-1.5 text-xs text-[#7D7D7D] hover:text-[#D04A02] border border-[#E8E8E8] rounded hover:border-[#D04A02] transition-colors"
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
        body: JSON.stringify({ to_email: toEmail, subject, body }),
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
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">수신자 이메일 *</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="contact@company.com"
              className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">제목</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">본문</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02] resize-none"
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
            className="px-5 py-2 text-sm font-semibold bg-[#D04A02] text-white rounded hover:bg-[#B83F02] transition-colors disabled:opacity-50"
          >
            {sending ? "발송 중..." : "메일 발송"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Request creation modal ----
interface RequestModalProps {
  categories: Category[];
  companies: any[];
  onClose: () => void;
  onCreated: (requestId: number, companyName: string, categoryName: string, dueDate: string) => void;
}

function RequestModal({ categories, companies, onClose, onCreated }: RequestModalProps) {
  const [categoryId, setCategoryId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!categoryId || !companyId) { setError("카테고리와 회사를 선택하세요."); return; }
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch("/api/documents/admin/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category_id: Number(categoryId),
          company_id: Number(companyId),
          due_date: dueDate,
          message,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "실패");
      const data = await res.json();
      const cat = categories.find((c) => c.id === Number(categoryId));
      const comp = companies.find((c) => c.id === Number(companyId));
      onCreated(data.id, comp?.name || "", cat?.name || "", dueDate);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
          <h2 className="text-base font-semibold text-[#2D2D2D]">자료 제출 요청 생성</h2>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#2D2D2D]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">카테고리 *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02]">
              <option value="">선택하세요</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">대상 회사 *</label>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02]">
              <option value="">선택하세요</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">제출 기한</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#464646] mb-1">메모</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="추가 안내사항을 입력하세요" className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D04A02] resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E8E8E8]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#ABABAB] transition-colors">
            취소
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-[#D04A02] text-white rounded hover:bg-[#B83F02] transition-colors disabled:opacity-50">
            {loading ? "저장 중..." : "요청 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main page ----
export default function DocumentsPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const [showArchive, setShowArchive] = useState(false);

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

  // Admin status state
  const [statusData, setStatusData] = useState<CompanyStatus[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);

  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [emailModal, setEmailModal] = useState<{
    requestId: number;
    companyName: string;
    categoryName: string;
    dueDate: string;
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

  // Load status (admin)
  const loadStatus = useCallback(() => {
    if (!isAdmin) return;
    const token = getToken();
    setLoadingStatus(true);
    fetch("/api/documents/admin/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setStatusData(d.status || []))
      .catch(console.error)
      .finally(() => setLoadingStatus(false));
  }, [isAdmin]);

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
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <NavHeader user={user} logout={logout} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#2D2D2D]">자료실</h1>
            <div className="relative group">
              <button className="w-5 h-5 rounded-full bg-[#E8E8E8] text-[#7D7D7D] text-xs flex items-center justify-center hover:bg-[#D04A02] hover:text-white transition-colors">
                ?
              </button>
              <div className="absolute left-7 top-0 w-56 bg-[#2D2D2D] text-white text-xs rounded px-3 py-2 hidden group-hover:block z-10 shadow-lg">
                현지회사 담당자가 자료를 업로드하면, 본사에서 제출 현황을 확인하고 미제출 업체에 요청 메일을 보낼 수 있습니다.
              </div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#D04A02] text-white rounded hover:bg-[#B83F02] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              제출 요청 생성
            </button>
          )}
        </div>

        {/* ===== Admin: submission status matrix ===== */}
        {isAdmin && (
          <div className="mb-6">
            <p className="text-sm text-[#7D7D7D] mb-4">
              회사별 카테고리 제출 현황을 확인하고, 미제출 업체에 요청 메일을 발송할 수 있습니다.
            </p>
            {loadingStatus ? (
              <div className="flex justify-center py-20">
                <svg className="w-7 h-7 text-[#D04A02] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : statusData.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E8E8E8] py-16 text-center text-[#ABABAB] text-sm">
                데이터가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {statusData.map((company) => (
                  <div key={company.company_id} className="bg-white rounded-lg border border-[#E8E8E8] overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8E8E8] bg-[#FAFAFA]">
                      <div className="w-1.5 h-5 bg-[#D04A02] rounded-full" />
                      <span className="text-sm font-semibold text-[#2D2D2D]">{company.company_name}</span>
                      <span className="text-xs text-[#ABABAB]">{company.company_code}</span>
                      {company.country && (
                        <span className="text-xs text-[#7D7D7D] bg-[#F5F5F5] px-2 py-0.5 rounded">{company.country}</span>
                      )}
                      {company.erp_system && (
                        <span className="text-xs text-[#D04A02] bg-[#FFF3EE] px-2 py-0.5 rounded font-medium">{company.erp_system}</span>
                      )}
                      <div className="ml-auto flex items-center gap-3 text-xs">
                        <span className="text-[#7D7D7D]">
                          필수 <span className={company.categories.filter(c => c.is_required && c.submitted).length === company.categories.filter(c => c.is_required).length ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                            {company.categories.filter(c => c.is_required && c.submitted).length}/{company.categories.filter(c => c.is_required).length}
                          </span>
                        </span>
                        {company.categories.some((c) => c.is_required && !c.submitted) && (
                          <span className="text-red-500 font-medium">
                            필수 미제출 {company.categories.filter((c) => c.is_required && !c.submitted).length}건
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-[#F5F5F5]">
                      {company.categories.map((cat) => (
                        <div key={cat.category_id} className="flex items-center px-5 py-3 gap-4">
                          <div className="w-52 flex-shrink-0 flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#464646]">{cat.category_name}</span>
                            {cat.is_required ? (
                              <span className="inline-block px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-semibold rounded flex-shrink-0">필수</span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 bg-[#F5F5F5] text-[#ABABAB] text-[10px] rounded flex-shrink-0">선택</span>
                            )}
                          </div>
                          <div className="flex-1">
                            {cat.submitted ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  제출완료
                                </span>
                                <span className="text-xs text-[#7D7D7D]">{cat.author_name}</span>
                                <span className="text-xs text-[#ABABAB]">
                                  {cat.submitted_at ? formatDate(cat.submitted_at) : ""}
                                </span>
                                {(cat.period_start || cat.period_end) && (
                                  <span className="text-[10px] text-[#7D7D7D] bg-[#F5F5F5] px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {cat.period_start}{cat.period_start && cat.period_end ? "~" : ""}{cat.period_end}
                                  </span>
                                )}
                                {cat.file_name && (
                                  <span className="text-xs text-[#ABABAB] truncate max-w-[140px]" title={cat.file_name}>
                                    {cat.file_name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  미제출
                                </span>
                                {cat.due_date && (
                                  <span className="text-xs text-[#ABABAB]">기한: {cat.due_date}</span>
                                )}
                                {cat.email_sent_at && (
                                  <span className="text-xs text-blue-500">
                                    요청발송 {formatDate(cat.email_sent_at)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {!cat.submitted && (
                            <button
                              onClick={async () => {
                                const token = getToken();
                                const res = await fetch("/api/documents/admin/request", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({
                                    category_id: cat.category_id,
                                    company_id: company.company_id,
                                    due_date: cat.due_date || "",
                                    message: "",
                                  }),
                                });
                                const data = await res.json();
                                setEmailModal({
                                  requestId: data.id,
                                  companyName: company.company_name,
                                  categoryName: cat.category_name,
                                  dueDate: cat.due_date || "",
                                });
                              }}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E8E8E8] rounded text-[#7D7D7D] hover:border-[#D04A02] hover:text-[#D04A02] transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              제출 요청
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== File archive: collapsible toggle for admin ===== */}
        {isAdmin && (
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[#464646] hover:text-[#2D2D2D] mb-3 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showArchive ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            전체 파일 보기 {total > 0 && <span className="text-[#ABABAB] font-normal">({total}건)</span>}
          </button>
        )}
        {/* File list: always visible for regular user, only when expanded for admin */}
        {(!isAdmin || showArchive) && (
          <div className="bg-white rounded-lg border border-[#E8E8E8] overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Company filter (admin only) */}
                {isAdmin && (
                  <select
                    value={filterCompany ?? ""}
                    onChange={(e) => { setFilterCompany(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                    className="pl-3 pr-7 py-1.5 text-xs border border-[#E8E8E8] rounded focus:outline-none focus:border-[#D04A02] bg-white text-[#464646]"
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
                  className="pl-3 pr-7 py-1.5 text-xs border border-[#E8E8E8] rounded focus:outline-none focus:border-[#D04A02] bg-white text-[#464646]"
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
                    className="accent-[#D04A02] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-[#464646]">필수 항목만</span>
                </label>
                {/* Active filter indicator */}
                {(filterCompany || filterYear || filterRequiredOnly) && (
                  <button
                    onClick={() => { setFilterCompany(null); setFilterYear(null); setFilterRequiredOnly(false); setPage(1); }}
                    className="flex items-center gap-1 text-xs text-[#D04A02] hover:underline"
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
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#D04A02] text-white rounded hover:bg-[#B83F02] transition-colors"
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
                        className="accent-[#D04A02]"
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
                        <svg className="w-7 h-7 text-[#D04A02] animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
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
                      <tr key={post.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedPosts.has(post.id)}
                            onChange={(e) => {
                              const next = new Set(selectedPosts);
                              e.target.checked ? next.add(post.id) : next.delete(post.id);
                              setSelectedPosts(next);
                            }}
                            className="accent-[#D04A02]"
                          />
                        </td>
                        <td className="px-2 py-3 text-center text-xs text-[#ABABAB]">
                          {total - (page - 1) * PER_PAGE - idx}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-2 py-0.5 bg-[#FFF3EE] text-[#D04A02] text-xs rounded">
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
                            <span className="text-[#2D2D2D] font-medium hover:text-[#D04A02] cursor-default">
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
                                className="flex items-center gap-1 text-[#7D7D7D] hover:text-[#D04A02] transition-colors"
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
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${p === page ? "bg-[#D04A02] text-white" : "text-[#7D7D7D] hover:bg-[#F5F5F5]"}`}
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
        <RequestModal
          categories={categories}
          companies={allCompanies}
          onClose={() => setShowRequestModal(false)}
          onCreated={(reqId, companyName, categoryName, dueDate) => {
            setShowRequestModal(false);
            setEmailModal({ requestId: reqId, companyName, categoryName, dueDate });
          }}
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
