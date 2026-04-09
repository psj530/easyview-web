"use client";

import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";
import PwCLogo from "@/components/PwCLogo";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const company = fd.get("company") as string;
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const message = fd.get("message") as string;
    const subject = encodeURIComponent(`[Easy View 문의] ${company} - ${name}`);
    const body = encodeURIComponent(
      `회사명: ${company}\n담당자: ${name}\n이메일: ${email}\n\n문의 내용:\n${message}\n`
    );
    window.location.href = `mailto:kr_easyview@pwc.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ===== Header ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur shadow-md"
            : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <PwCLogo height={22} color="#2D2D2D" />
            <span className="w-px h-5 bg-pwc-gray-light" />
            <span className="text-base font-semibold text-pwc-black">Easy View</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "서비스 안내", id: "services" },
              { label: "매뉴얼", id: "manual" },
              { label: "Digital & AI", id: "digital" },
              { label: "Managed Service", id: "managed" },
              { label: "Contact Us", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-pwc-gray-dark hover:text-pwc-orange transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 bg-pwc-orange hover:bg-pwc-orange-dark text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors"
          >
            Easy View Report 바로가기
          </Link>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* ===== Hero Section ===== */}
      <section className="bg-pwc-gray-bg">
        <div className="max-w-4xl mx-auto text-center px-6 py-24 md:py-32">
          {/* Badge */}
          <div className="inline-block bg-white border border-pwc-gray-light text-pwc-gray-dark text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-6">
            Worldwide Easy View
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pwc-black leading-tight mb-6">
            국내외법인 재무정보에 대한
            <br />
            <span className="text-pwc-orange">스마트한 접근법</span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-pwc-gray leading-relaxed mb-10 max-w-2xl mx-auto">
            삼일회계법인이 만든 Easy View는 복잡한 재무 데이터를 직관적인 시각화와
            <br className="hidden md:block" />
            시나리오 분석을 통해 빠르고 정확한 의사결정을 지원합니다.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-pwc-orange hover:bg-pwc-orange-dark text-white font-semibold px-8 py-3.5 rounded-md transition-colors shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10h14M12 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Easy View Report 바로가기
            </Link>
            <button
              onClick={() => scrollTo("contact")}
              className="inline-flex items-center gap-2 border-2 border-pwc-gray-dark text-pwc-gray-dark hover:border-pwc-orange hover:text-pwc-orange font-semibold px-8 py-3.5 rounded-md transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 5l8 5 8-5M2 5v10h16V5H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Contact Us
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: "5", label: "분석 대시보드" },
              { value: "6", label: "시나리오 분석" },
              { value: "134K+", label: "전표 분석" },
              { value: "PDF", label: "리포트 내보내기" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm px-4 py-6 border border-pwc-gray-light">
                <div className="text-2xl md:text-3xl font-extrabold text-pwc-orange mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-pwc-gray font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 서비스 안내 Section ===== */}
      <section id="services" className="bg-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-pwc-orange/10 text-pwc-orange text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
              Our Services
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-pwc-black mb-4">
              Easy View 서비스 안내
            </h2>
            <p className="text-pwc-gray leading-relaxed">
              안녕하세요, 삼일회계법인 Worldwide Easy View 서비스 팀입니다.
              <br />
              저희 서비스를 지속적으로 활용해주심에 감사의 인사를 드립니다.
            </p>
          </div>

          {/* Intro message */}
          <div className="bg-pwc-gray-bg border-l-4 border-pwc-orange rounded-lg p-6 mb-14 flex gap-4 items-start">
            <div className="shrink-0 mt-0.5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z" fill="#D04A02" />
              </svg>
            </div>
            <div className="text-sm md:text-base text-pwc-gray-dark leading-relaxed space-y-3">
              <p>
                PwC는 디지털 기술과 데이터를 모아 확장하는 <a href="https://www.pwc.com/kr/ko/services/ax-node.html" target="_blank" rel="noopener noreferrer" className="text-pwc-orange font-semibold hover:underline">연결점(Node)의 역할</a>을 수행합니다.
              </p>
              <p>
                이를 통해, 단순한 디지털 서비스의 제공자가 아니라 기업들의 <strong>디지털 혁신 파트너</strong>로 도약하는 것을 목표로 하고 있습니다.
              </p>
              <p>
                각 서비스명을 클릭하시어 서비스별 상세 내용을 확인하실 수 있으며,
                추가 안내 및 설명회 등이 가능하오니 편하게 연락 주시면 감사하겠습니다.
              </p>
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Summary Dashboard */}
            <div className="group bg-white border border-pwc-gray-light rounded-xl p-6 hover:shadow-lg hover:border-pwc-orange/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-pwc-orange/10 text-pwc-orange flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-pwc-black mb-2">Summary Dashboard</h3>
              <p className="text-sm text-pwc-gray leading-relaxed">주요 재무 KPI, 손익지표, 유동성지표를 한눈에 파악하는 통합 대시보드</p>
            </div>

            {/* 손익분석 */}
            <div className="group bg-white border border-pwc-gray-light rounded-xl p-6 hover:shadow-lg hover:border-pwc-orange/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 20h18M5 20V10l4-6h6l4 6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 20v-4h6v4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-pwc-black mb-2">손익분석</h3>
              <p className="text-sm text-pwc-gray leading-relaxed">매출, 영업이익, 당기순이익 추이 분석 및 거래처별 매출 비중 분석</p>
            </div>

            {/* 재무상태분석 */}
            <div className="group bg-white border border-pwc-gray-light rounded-xl p-6 hover:shadow-lg hover:border-pwc-orange/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-pwc-black mb-2">재무상태분석</h3>
              <p className="text-sm text-pwc-gray leading-relaxed">자산, 부채, 자본 증감 추이 및 매출채권/재고자산 회전일수 분석</p>
            </div>

            {/* 전표분석 */}
            <div className="group bg-white border border-pwc-gray-light rounded-xl p-6 hover:shadow-lg hover:border-pwc-orange/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gray-100 text-pwc-gray-dark flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-pwc-black mb-2">전표분석</h3>
              <p className="text-sm text-pwc-gray leading-relaxed">전표 기표내역 일자별/계정과목별/거래처별 분석 및 상대계정 추적</p>
            </div>

            {/* 시나리오분석 */}
            <div className="group bg-white border border-pwc-gray-light rounded-xl p-6 hover:shadow-lg hover:border-pwc-orange/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.95L13.75 4a2 2 0 00-3.5 0L3.32 16.05A2 2 0 005.07 19z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-pwc-black mb-2">시나리오분석</h3>
              <p className="text-sm text-pwc-gray leading-relaxed">6가지 이상 시나리오 기반 Exception 전표 자동 탐지 및 위험 알림</p>
            </div>

            {/* PDF 리포트 */}
            <div className="group bg-white border border-pwc-gray-light rounded-xl p-6 hover:shadow-lg hover:border-pwc-orange/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-pwc-black mb-2">PDF 리포트</h3>
              <p className="text-sm text-pwc-gray leading-relaxed">현재 탭 또는 전체 리포트를 PDF로 내보내기 지원</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 매뉴얼 & 가이드 Section ===== */}
      <section id="manual" className="bg-pwc-gray-bg py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-pwc-orange/10 text-pwc-orange text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
              User Guide
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-pwc-black mb-4">매뉴얼 &amp; 가이드</h2>
            <p className="text-pwc-gray leading-relaxed">
              Easy View의 주요 기능을 동영상 매뉴얼과 상세 가이드를 통해 확인하실 수 있습니다.
            </p>
          </div>

          {/* Manual cards 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 동영상 매뉴얼 (국문) */}
            <div className="bg-white rounded-xl border border-pwc-gray-light p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 rounded-lg bg-pwc-orange/10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M23 7l-7 5 7 5V7z" stroke="#D04A02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="1" y="5" width="15" height="14" rx="2" stroke="#D04A02" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-pwc-black mb-1">동영상 매뉴얼 (국문)</h3>
                  <p className="text-sm text-pwc-gray mb-3">Easy View의 전체 기능을 한국어 동영상으로 안내합니다.</p>
                  <a
                    href="https://file.notion.so/f/f/919352de-7820-48c2-b551-2503cc45f9ce/a60c3a84-d12d-48af-8f8a-745377f0f986/Worldwide_Easy_View_Manual.mp4?table=block&id=2bcbd1fb-1fdf-802c-bc5a-e89b214325fe&spaceId=919352de-7820-48c2-b551-2503cc45f9ce&expirationTimestamp=1775757600000&signature=tOp4OFy6mBzHmQRYND2NWRjwxg_RYDgjwLtOaDW_608&downloadName=Worldwide+Easy+View+Manual.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-pwc-orange hover:text-pwc-orange-dark transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2" />
                    </svg>
                    동영상 보기
                  </a>
                </div>
              </div>
            </div>

            {/* Video Manual (English) */}
            <div className="bg-white rounded-xl border border-pwc-gray-light p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M23 7l-7 5 7 5V7z" stroke="#464646" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="1" y="5" width="15" height="14" rx="2" stroke="#464646" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-pwc-black mb-1">Video Manual (English)</h3>
                  <p className="text-sm text-pwc-gray mb-3">Easy View full feature walkthrough in English.</p>
                  <a
                    href="https://file.notion.so/f/f/919352de-7820-48c2-b551-2503cc45f9ce/a0fbe007-a740-47c6-844a-7489a42017e2/Worldwide_Easy_View_Manual_Eng.mp4?table=block&id=2bcbd1fb-1fdf-8023-8cbf-f684a6562e9e&spaceId=919352de-7820-48c2-b551-2503cc45f9ce&expirationTimestamp=1775757600000&signature=LZQn0M87Bqw3osAzqmiP4KjvY38Nt-uQhlAqqjTC44w&downloadName=Worldwide+Easy+View+Manual_Eng.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-pwc-gray-dark hover:text-pwc-orange transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2" />
                    </svg>
                    Watch Video
                  </a>
                </div>
              </div>
            </div>

            {/* 사용자 가이드 (PDF) */}
            <div className="bg-white rounded-xl border border-pwc-gray-light p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#E0301E" strokeWidth="2" />
                    <polyline points="14 2 14 8 20 8" stroke="#E0301E" strokeWidth="2" fill="none" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="#E0301E" strokeWidth="2" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="#E0301E" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-pwc-black mb-1">사용자 가이드 (PDF)</h3>
                  <p className="text-sm text-pwc-gray mb-3">Worldwide Easy View 3.0 주요기능 매뉴얼 (57페이지)</p>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v14M12 16l-4-4M12 16l4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    PDF 다운로드
                  </a>
                </div>
              </div>
            </div>

            {/* 삼일회계법인 공식 YouTube */}
            <div className="bg-white rounded-xl border border-pwc-gray-light p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="#E0301E" strokeWidth="2" fill="rgba(224,48,30,0.1)" />
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#E0301E" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-pwc-black mb-1">삼일회계법인 공식 YouTube</h3>
                  <p className="text-sm text-pwc-gray mb-3">Worldwide Easy View 영상을 확인하십시오.</p>
                  <img
                    src="/youtube-qr.png"
                    alt="삼일회계법인 YouTube QR Code"
                    className="w-20 h-20 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Digital & AI Section ===== */}
      <section id="digital" className="bg-[#2D2D2D] py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-white/10 text-pwc-orange text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
              Digital &amp; AI
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Digital &amp; AI</h2>
            <p className="text-gray-400 leading-relaxed max-w-3xl mx-auto">
              기업이 Data를 기반으로 한 신속, 정확한 의사결정과 AI 적용을 위한
              <br className="hidden md:block" />
              최적화된 조직구조, Digital 환경 및 Business Process를 구축할 수 있도록
              <br className="hidden md:block" />
              자문 업무와 관련 Digital &amp; AI Solution을 제공하고 있습니다.
            </p>
            <a
              href="https://www.pwc.com/kr/ko/services/ax-node.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-pwc-orange hover:text-pwc-orange-light transition-colors"
            >
              PwC AX Node 자세히 보기
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Capability list */}
          <div className="space-y-4 mb-12 max-w-3xl mx-auto">
            {[
              { num: "01", text: "수작업 업무, 단순 반복업무, 병목 업무의 파악 및 개선 방안 자문" },
              { num: "02", text: "업무 자동화, 효율화를 위한 Digital & AI Solution 제공" },
              { num: "03", text: "비즈니스 의사결정 지원을 위한 Data Analytics 서비스 제공" },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg px-6 py-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-pwc-orange text-white text-sm font-bold flex items-center justify-center">
                  {item.num}
                </div>
                <div className="text-sm md:text-base text-gray-300">{item.text}</div>
              </div>
            ))}
          </div>

          {/* Service tags */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "Robotic Application", href: "https://www.pwc.com/kr/ko/digital-solutions/robotic-application.html", accent: false },
              { label: "AI Solutions", href: "https://www.pwc.com/kr/ko/services/ax-node/ai-solutions.html", accent: false },
              { label: "KSOX AI", href: "https://www.pwc.com/kr/ko/services/ax-node/ksox-ai.html", accent: false },
              { label: "Digital & AI Transformation", href: "https://www.pwc.com/kr/ko/services/ax-node/digital-ai.html", accent: false },
              { label: "Easy View Data Analytics", href: "https://www.pwc.com/kr/ko/services/ax-node/easy-view.html", accent: true },
              { label: "ERP 도입·전환 자문", href: "https://www.pwc.com/kr/ko/services/ax-node/erp.html", accent: false },
              { label: "Next Generation PA 연결 플랫폼", href: "https://www.pwc.com/kr/ko/digital-solutions/next-gen-pa.html", accent: false },
            ].map((tag) => (
              <a
                key={tag.label}
                href={tag.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-full text-sm font-medium border cursor-pointer ${
                  tag.accent
                    ? "bg-pwc-orange text-white border-pwc-orange hover:bg-pwc-orange-dark"
                    : "bg-transparent text-gray-400 border-white/20 hover:border-pwc-orange hover:text-pwc-orange"
                } transition-colors`}
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Managed Service Section ===== */}
      <section id="managed" className="bg-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-pwc-orange/10 text-pwc-orange text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
              Managed Service
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-pwc-black mb-4">Managed Service</h2>
            <p className="text-pwc-gray leading-relaxed max-w-3xl mx-auto">
              기업 Business Process 관련 아웃소싱 서비스를 제공하여 필요한 전문성을 안정적으로 확보하고,
              <br className="hidden md:block" />
              인력운영 효율화 및 급변하는 비즈니스 환경에 유연하게 대응할 수 있도록 합니다.
            </p>
            <a
              href="https://www.pwc.com/kr/ko/services/ax-node.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-pwc-orange hover:text-pwc-orange-dark transition-colors"
            >
              PwC AX Node 자세히 보기
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Capability list */}
          <div className="space-y-4 mb-12 max-w-4xl mx-auto">
            {[
              { num: "01", text: "회계 세무 Payroll 서비스 외 Data Analytics 및 경영관리 전반 업무를 기업의 니즈에 맞게 제공" },
              { num: "02", text: "Digital & AI Solution 을 활용하여 합리적인 가격으로 안정적인 Quality 확보" },
              { num: "03", text: "개별 기업단위로 Digital Infra를 갖추기 어려운 중견, 중소기업에게 삼일의 Digital Infra를 공유하여 Digital 전환 효과를 제공" },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-4 bg-pwc-gray-bg border border-pwc-gray-light rounded-lg px-6 py-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-pwc-black text-white text-sm font-bold flex items-center justify-center">
                  {item.num}
                </div>
                <div className="text-sm md:text-base text-pwc-gray-dark">{item.text}</div>
              </div>
            ))}
          </div>

          {/* Service tags */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "통합경영지원서비스(BPO)", href: "https://www.pwc.com/kr/ko/services/ax-node/bpo.html" },
              { label: "AWM Innovation", href: "https://www.pwc.com/kr/ko/services/ax-node/awm.html" },
              { label: "XBRL 설계 및 공시자문", href: "https://www.pwc.com/kr/ko/assurance/xbrl.html" },
              { label: "연말정산 아웃소싱 서비스", href: "https://www.pwc.com/kr/ko/services/ax-node/ye-tax-adj.html" },
              { label: "한방병원 심사청구 및 관리보고서", href: "https://www.pwc.com/kr/ko/services/ax-node/kor-medicine-hospital.html" },
            ].map((tag) => (
              <a
                key={tag.label}
                href={tag.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full text-sm font-medium border border-pwc-gray-light text-pwc-gray-dark hover:border-pwc-orange hover:text-pwc-orange cursor-pointer transition-colors"
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact Us Section ===== */}
      <section id="contact" className="bg-pwc-gray-bg py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Info */}
            <div>
              <div className="inline-block bg-pwc-orange/10 text-pwc-orange text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
                Contact Us
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-pwc-black mb-4">문의하기</h2>
              <p className="text-pwc-gray leading-relaxed mb-8">
                기타 문의사항이 있으신 경우 편하게 연락 주시기 바랍니다.
                <br />
                추가 안내 및 설명회 등이 가능합니다.
              </p>

              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-4 bg-white rounded-lg border border-pwc-gray-light p-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-pwc-orange/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#D04A02" strokeWidth="2" />
                      <path d="M22 6l-10 7L2 6" stroke="#D04A02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-pwc-gray font-medium mb-0.5">이메일</div>
                    <a href="mailto:kr_easyview@pwc.com" className="text-sm font-semibold text-pwc-black hover:text-pwc-orange transition-colors">
                      kr_easyview@pwc.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-4 bg-white rounded-lg border border-pwc-gray-light p-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-pwc-orange/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#D04A02" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-pwc-gray font-medium mb-0.5">연락처</div>
                    <a href="tel:010-9136-7136" className="text-sm font-semibold text-pwc-black hover:text-pwc-orange transition-colors">
                      010-9136-7136
                    </a>
                  </div>
                </div>

                {/* Team */}
                <div className="flex items-center gap-4 bg-white rounded-lg border border-pwc-gray-light p-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-pwc-orange/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#D04A02" strokeWidth="2" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="#D04A02" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-pwc-gray font-medium mb-0.5">팀</div>
                    <div className="text-sm font-semibold text-pwc-black">삼일회계법인 Worldwide Easy View 서비스팀</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div>
              <div className="bg-white rounded-xl border border-pwc-gray-light p-8 shadow-sm">
                <h3 className="text-lg font-bold text-pwc-black mb-6">메일 보내기</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-pwc-gray-dark mb-1.5">회사명</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="회사명을 입력해주세요"
                      required
                      className="w-full px-4 py-2.5 border border-pwc-gray-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pwc-orange/30 focus:border-pwc-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pwc-gray-dark mb-1.5">담당자명</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="성함을 입력해주세요"
                      required
                      className="w-full px-4 py-2.5 border border-pwc-gray-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pwc-orange/30 focus:border-pwc-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pwc-gray-dark mb-1.5">이메일</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="이메일을 입력해주세요"
                      required
                      className="w-full px-4 py-2.5 border border-pwc-gray-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pwc-orange/30 focus:border-pwc-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pwc-gray-dark mb-1.5">문의 내용</label>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="문의 내용을 입력해주세요"
                      className="w-full px-4 py-2.5 border border-pwc-gray-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pwc-orange/30 focus:border-pwc-orange transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-pwc-orange hover:bg-pwc-orange-dark text-white font-semibold py-3 rounded-md transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    메일 보내기
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#2D2D2D] text-gray-400 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 mb-10">
            {/* Brand - 5 cols */}
            <div className="md:col-span-5 md:pr-8">
              <div className="flex items-center gap-3 mb-4">
                <PwCLogo height={22} color="#FFFFFF" />
                <span className="w-px h-5 bg-white/20" />
                <span className="text-base font-semibold text-white">Worldwide Easy View</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                삼일회계법인이 만든 국내외법인 재무정보에 대한 스마트한 접근법
              </p>
            </div>

            {/* 바로가기 - 3 cols */}
            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold text-white mb-4">바로가기</h4>
              <div className="flex flex-col gap-2.5">
                <Link href="/login" className="text-sm hover:text-pwc-orange transition-colors">Easy View Report</Link>
                <button onClick={() => scrollTo("services")} className="text-sm text-left hover:text-pwc-orange transition-colors">서비스 안내</button>
                <button onClick={() => scrollTo("manual")} className="text-sm text-left hover:text-pwc-orange transition-colors">매뉴얼 &amp; 가이드</button>
                <button onClick={() => scrollTo("digital")} className="text-sm text-left hover:text-pwc-orange transition-colors">Digital &amp; AI</button>
                <button onClick={() => scrollTo("managed")} className="text-sm text-left hover:text-pwc-orange transition-colors">Managed Service</button>
              </div>
            </div>

            {/* 문의 - 4 cols */}
            <div className="md:col-span-4">
              <h4 className="text-sm font-semibold text-white mb-4">문의</h4>
              <div className="flex flex-col gap-2.5">
                <a href="mailto:kr_easyview@pwc.com" className="text-sm hover:text-pwc-orange transition-colors">kr_easyview@pwc.com</a>
                <a href="tel:010-9136-7136" className="text-sm hover:text-pwc-orange transition-colors">010-9136-7136</a>
                <a href="https://www.pwc.com/kr/ko/services/ax-node.html" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-pwc-orange transition-colors">PwC AX Node</a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-sm text-gray-500 text-center">
              &copy; 2026 PwC. All rights reserved. 삼일회계법인
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
