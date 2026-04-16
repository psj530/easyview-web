"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PwCLogo from "@/components/PwCLogo";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/lib/auth";

interface Category {
  id: number;
  name: string;
  description: string;
  is_required: number;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch("/api/documents/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(console.error);
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!categoryId) { setError("카테고리를 선택하세요."); return; }
    if (!title.trim()) { setError("제목을 입력하세요."); return; }

    setSubmitting(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("category_id", categoryId);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("period_start", periodStart);
      formData.append("period_end", periodEnd);
      if (file) formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "업로드 실패");
      }

      router.push("/documents");
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#ABABAB] mb-6">
          <Link href="/documents" className="hover:text-[#D04A02] transition-colors">자료실</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#464646]">게시글 작성</span>
        </div>

        <div className="bg-white rounded-lg border border-[#E8E8E8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E8E8]">
            <h1 className="text-lg font-bold text-[#2D2D2D]">게시글 작성</h1>
            <p className="text-xs text-[#7D7D7D] mt-0.5">자료를 업로드하고 카테고리를 선택하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#464646] mb-1.5">
                카테고리 <span className="text-[#D04A02]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#D04A02] bg-white"
              >
                <option value="">카테고리를 선택하세요</option>
                <optgroup label="필수 항목">
                  {categories.filter((c) => c.is_required).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="선택 항목">
                  {categories.filter((c) => !c.is_required).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </select>
              {selectedCategory && (
                <div className="mt-1.5 flex items-center gap-2">
                  {selectedCategory.is_required ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      필수 제출 항목
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F5] text-[#7D7D7D] text-xs rounded-full">
                      선택 제출 항목
                    </span>
                  )}
                  {selectedCategory.description && (
                    <span className="text-xs text-[#ABABAB]">{selectedCategory.description}</span>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#464646] mb-1.5">
                제목 <span className="text-[#D04A02]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={200}
                className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#D04A02]"
              />
            </div>

            {/* Period */}
            <div>
              <label className="block text-xs font-semibold text-[#464646] mb-1.5">
                결산 기간
                <span className="ml-1.5 text-[10px] font-normal text-[#ABABAB]">데이터가 포함하는 기간을 입력하세요</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="flex-1 border border-[#E8E8E8] rounded px-3 py-2 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#D04A02]"
                />
                <span className="text-[#ABABAB] text-sm flex-shrink-0">~</span>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="flex-1 border border-[#E8E8E8] rounded px-3 py-2 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#D04A02]"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-[#464646] mb-1.5">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요 (선택사항)"
                rows={5}
                className="w-full border border-[#E8E8E8] rounded px-3 py-2 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#D04A02] resize-none"
              />
            </div>

            {/* File upload */}
            <div>
              <label className="block text-xs font-semibold text-[#464646] mb-1.5">첨부파일</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#E8E8E8] rounded-lg px-6 py-8 text-center cursor-pointer hover:border-[#D04A02]/40 hover:bg-[#FFF8F5] transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-[#D04A02]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#2D2D2D]">{file.name}</p>
                      <p className="text-xs text-[#ABABAB]">{formatSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="ml-2 text-[#ABABAB] hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-10 h-10 text-[#E8E8E8] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-[#7D7D7D]">
                      파일을 드래그하거나 <span className="text-[#D04A02] font-medium">클릭하여 선택</span>하세요
                    </p>
                    <p className="text-xs text-[#ABABAB] mt-1">Excel, PDF, CSV, Word 등 모든 형식 지원</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F5F5F5]">
              <Link
                href="/documents"
                className="px-5 py-2 text-sm text-[#7D7D7D] border border-[#E8E8E8] rounded hover:border-[#ABABAB] transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-sm font-semibold bg-[#D04A02] text-white rounded hover:bg-[#B83F02] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    등록하기
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
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
    </div>
  );
}
