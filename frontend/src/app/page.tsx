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
    <div className="flex flex-col min-h-screen bg-white">
      {/* ===== Header ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-white/95 backdrop-blur shadow-sm border-[#DFE3E6]"
            : "bg-white border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PwCLogo height={20} color="#2D2D2D" />
            <span className="text-[13px] font-medium text-[#4B535E]">|</span>
            <span className="text-[13px] font-semibold text-[#222C40] tracking-tight">Worldwide Easy View</span>
          </div>

          <nav className="hidden md:flex items-center gap-5">
            {[
              { label: "서비스 안내", id: "services" },
              { label: "매뉴얼", id: "manual" },
              { label: "Digital & AI", id: "digital" },
              { label: "Managed Service", id: "managed" },
              { label: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#222C40] hover:bg-[#FE7C39] text-white text-[12px] font-medium px-4 py-2 rounded transition-colors"
          >
            Report 바로가기
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="h-14" />

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#222C40] via-[#2A3342] to-[#222C40]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        {/* PwC accent line - gradient */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #FF9F00, #FD5108)" }} />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <PwCLogo height={18} color="#FFFFFF" />
                <span className="text-[11px] text-white/50 tracking-wider uppercase">Samil PwC</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                국내외법인 재무정보에 대한
                <br />
                스마트한 접근법
              </h1>
              <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8">
                삼일회계법인이 만든 Easy View는 복잡한 재무 데이터를
                직관적인 시각화와 시나리오 분석을 통해
                빠르고 정확한 의사결정을 지원합니다.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-[#FD5108] hover:bg-[#D04A02] text-white text-sm font-medium px-6 py-3 rounded transition-colors"
                >
                  Easy View Report
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <button
                  onClick={() => scrollTo("contact")}
                  className="inline-flex items-center gap-2 border border-white/30 text-white/80 hover:border-white hover:text-white text-sm font-medium px-6 py-3 rounded transition-colors"
                >
                  Contact Us
                </button>
              </div>
            </div>

            {/* Right: Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "5", label: "분석 대시보드", desc: "Summary, PL, BS, 전표, 시나리오" },
                { value: "6", label: "시나리오 분석", desc: "Exception 자동 탐지" },
                { value: "134K+", label: "전표 분석", desc: "대량 전표 실시간 처리" },
                { value: "PDF", label: "리포트", desc: "원클릭 내보내기" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-5 backdrop-blur-sm">
                  <div className="text-xl font-bold mb-0.5" style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</div>
                  <div className="text-[11px] font-semibold text-white/80 mb-1">{stat.label}</div>
                  <div className="text-[10px] text-white/40">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 서비스 안내 ===== */}
      <section id="services" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="text-[11px] font-semibold text-[#FD5108] tracking-wider uppercase mb-2">Our Services</div>
            <h2 className="text-xl md:text-2xl font-bold text-[#222C40] mb-3">
              Easy View 서비스 안내
            </h2>
            <p className="text-sm text-[#4B535E] leading-relaxed max-w-2xl">
              안녕하세요, 삼일회계법인 Worldwide Easy View 서비스 팀입니다.
              저희 서비스를 지속적으로 활용해주심에 감사의 인사를 드립니다.
            </p>
          </div>

          {/* Intro message */}
          <div className="bg-[#F5F7F8] rounded-lg p-5 mb-10">
            <div className="text-sm text-[#4B535E] leading-relaxed space-y-2">
              <p>
                PwC는 디지털 기술과 데이터를 모아 확장하는 <a href="https://www.pwc.com/kr/ko/services/ax-node.html" target="_blank" rel="noopener noreferrer" className="text-[#FD5108] font-medium hover:underline">연결점(Node)의 역할</a>을 수행합니다.
                이를 통해, 단순한 디지털 서비스의 제공자가 아니라 기업들의 디지털 혁신 파트너로 도약하는 것을 목표로 하고 있습니다.
              </p>
              <p>
                각 서비스명을 클릭하시어 서비스별 상세 내용을 확인하실 수 있으며,
                추가 안내 및 설명회 등이 가능하오니 편하게 연락 주시면 감사하겠습니다.
              </p>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Summary Dashboard",
                desc: "주요 재무 KPI, 손익지표, 유동성지표를 한눈에 파악하는 통합 대시보드",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ),
              },
              {
                title: "손익분석",
                desc: "매출, 영업이익, 당기순이익 추이 분석 및 거래처별 매출 비중 분석",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "재무상태분석",
                desc: "자산, 부채, 자본 증감 추이 및 매출채권/재고자산 회전일수 분석",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "전표분석",
                desc: "전표 기표내역 일자별/계정과목별/거래처별 분석 및 상대계정 추적",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "시나리오분석",
                desc: "6가지 이상 시나리오 기반 Exception 전표 자동 탐지 및 위험 알림",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.95L13.75 4a2 2 0 00-3.5 0L3.32 16.05A2 2 0 005.07 19z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "PDF 리포트",
                desc: "현재 탭 또는 전체 리포트를 PDF로 내보내기 지원",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" />
                    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                ),
              },
            ].map((card) => (
              <div key={card.title} className="border border-[#DFE3E6] rounded-lg p-5 hover:border-[#FD5108]/30 hover:shadow-sm transition-all">
                <div className="w-9 h-9 rounded flex items-center justify-center mb-3 text-white" style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)" }}>
                  {card.icon}
                </div>
                <h3 className="text-sm font-semibold text-[#222C40] mb-1.5">{card.title}</h3>
                <p className="text-[12px] text-[#4B535E] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 매뉴얼 & 가이드 ===== */}
      <section id="manual" className="bg-[#F5F7F8] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="text-[11px] font-semibold text-[#FD5108] tracking-wider uppercase mb-2">User Guide</div>
            <h2 className="text-xl md:text-2xl font-bold text-[#222C40] mb-3">매뉴얼 &amp; 가이드</h2>
            <p className="text-sm text-[#4B535E]">
              Easy View의 주요 기능을 동영상 매뉴얼과 상세 가이드를 통해 확인하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 동영상 매뉴얼 (국문) */}
            <div className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded bg-[#FD5108]/10 flex items-center justify-center text-[#FD5108]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#222C40] mb-0.5">동영상 매뉴얼 (국문)</h3>
                <p className="text-[12px] text-[#4B535E] mb-2">Easy View의 전체 기능을 한국어 동영상으로 안내합니다.</p>
                <span className="text-[12px] text-[#A1A8B3]">준비 중</span>
              </div>
            </div>

            {/* Video Manual (English) */}
            <div className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded bg-[#F5F7F8] flex items-center justify-center text-[#4B535E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#222C40] mb-0.5">Video Manual (English)</h3>
                <p className="text-[12px] text-[#4B535E] mb-2">Easy View full feature walkthrough in English.</p>
                <span className="text-[12px] text-[#A1A8B3]">Coming soon</span>
              </div>
            </div>

            {/* 사용자 가이드 (PDF) */}
            <div className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded bg-red-50 flex items-center justify-center text-red-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" />
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#222C40] mb-0.5">사용자 가이드 (PDF)</h3>
                <p className="text-[12px] text-[#4B535E] mb-2">Worldwide Easy View 3.0 주요기능 매뉴얼 (57페이지)</p>
                <span className="text-[12px] text-[#A1A8B3]">준비 중</span>
              </div>
            </div>

            {/* 삼일회계법인 공식 YouTube */}
            <div className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded bg-red-50 flex items-center justify-center text-red-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.1" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#222C40] mb-0.5">삼일회계법인 공식 YouTube</h3>
                <p className="text-[12px] text-[#4B535E] mb-2">Worldwide Easy View 영상을 확인하십시오.</p>
                <span className="text-[12px] text-[#A1A8B3]">준비 중</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Digital & AI ===== */}
      <section id="digital" className="bg-[#222C40] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="text-[11px] font-semibold text-[#FD5108] tracking-wider uppercase mb-2">Digital &amp; AI</div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Digital &amp; AI</h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-3xl">
              기업이 Data를 기반으로 한 신속, 정확한 의사결정과 AI 적용을 위한
              최적화된 조직구조, Digital 환경 및 Business Process를 구축할 수 있도록
              자문 업무와 관련 Digital &amp; AI Solution을 제공하고 있습니다.
            </p>
            <a
              href="https://www.pwc.com/kr/ko/services/ax-node.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-[12px] font-medium text-[#FD5108] hover:text-[#E87722] transition-colors"
            >
              PwC AX Node 자세히 보기
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="space-y-3 mb-10 max-w-3xl">
            {[
              { num: "01", text: "수작업 업무, 단순 반복업무, 병목 업무의 파악 및 개선 방안 자문" },
              { num: "02", text: "업무 자동화, 효율화를 위한 Digital & AI Solution 제공" },
              { num: "03", text: "비즈니스 의사결정 지원을 위한 Data Analytics 서비스 제공" },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-lg px-5 py-3.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#FD5108] text-white text-[11px] font-bold flex items-center justify-center">
                  {item.num}
                </div>
                <div className="text-sm text-white/70">{item.text}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
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
                className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-colors ${
                  tag.accent
                    ? "bg-[#FD5108] text-white border-[#FD5108] hover:bg-[#D04A02]"
                    : "bg-transparent text-white/40 border-white/15 hover:border-[#FD5108] hover:text-[#FD5108]"
                }`}
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Managed Service ===== */}
      <section id="managed" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="text-[11px] font-semibold text-[#FD5108] tracking-wider uppercase mb-2">Managed Service</div>
            <h2 className="text-xl md:text-2xl font-bold text-[#222C40] mb-3">Managed Service</h2>
            <p className="text-sm text-[#4B535E] leading-relaxed max-w-3xl">
              기업 Business Process 관련 아웃소싱 서비스를 제공하여 필요한 전문성을 안정적으로 확보하고,
              인력운영 효율화 및 급변하는 비즈니스 환경에 유연하게 대응할 수 있도록 합니다.
            </p>
            <a
              href="https://www.pwc.com/kr/ko/services/ax-node.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-[12px] font-medium text-[#FD5108] hover:text-[#D04A02] transition-colors"
            >
              PwC AX Node 자세히 보기
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="space-y-3 mb-10 max-w-4xl">
            {[
              { num: "01", text: "회계 세무 Payroll 서비스 외 Data Analytics 및 경영관리 전반 업무를 기업의 니즈에 맞게 제공" },
              { num: "02", text: "Digital & AI Solution 을 활용하여 합리적인 가격으로 안정적인 Quality 확보" },
              { num: "03", text: "개별 기업단위로 Digital Infra를 갖추기 어려운 중견, 중소기업에게 삼일의 Digital Infra를 공유하여 Digital 전환 효과를 제공" },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-3 bg-[#F5F7F8] border border-[#DFE3E6] rounded-lg px-5 py-3.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#222C40] text-white text-[11px] font-bold flex items-center justify-center">
                  {item.num}
                </div>
                <div className="text-sm text-[#4B535E]">{item.text}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
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
                className="px-3 py-1.5 rounded text-[12px] font-medium border border-[#DFE3E6] text-[#4B535E] hover:border-[#FD5108] hover:text-[#FD5108] transition-colors"
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact Us ===== */}
      <section id="contact" className="bg-[#F5F7F8] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left */}
            <div>
              <div className="text-[11px] font-semibold text-[#FD5108] tracking-wider uppercase mb-2">Contact Us</div>
              <h2 className="text-xl md:text-2xl font-bold text-[#222C40] mb-3">문의하기</h2>
              <p className="text-sm text-[#4B535E] leading-relaxed mb-6">
                기타 문의사항이 있으신 경우 편하게 연락 주시기 바랍니다.
                추가 안내 및 설명회 등이 가능합니다.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white rounded-lg border border-[#DFE3E6] p-4">
                  <div className="shrink-0 w-9 h-9 rounded bg-[#FD5108]/10 flex items-center justify-center text-[#FD5108]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#4B535E]">이메일</div>
                    <a href="mailto:kr_easyview@pwc.com" className="text-sm font-medium text-[#222C40] hover:text-[#FD5108] transition-colors">
                      kr_easyview@pwc.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-lg border border-[#DFE3E6] p-4">
                  <div className="shrink-0 w-9 h-9 rounded bg-[#FD5108]/10 flex items-center justify-center text-[#FD5108]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#4B535E]">연락처</div>
                    <a href="tel:010-9136-7136" className="text-sm font-medium text-[#222C40] hover:text-[#FD5108] transition-colors">
                      010-9136-7136
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-lg border border-[#DFE3E6] p-4">
                  <div className="shrink-0 w-9 h-9 rounded bg-[#FD5108]/10 flex items-center justify-center text-[#FD5108]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#4B535E]">팀</div>
                    <div className="text-sm font-medium text-[#222C40]">삼일회계법인 Worldwide Easy View 서비스팀</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-lg border border-[#DFE3E6] p-6">
              <h3 className="text-sm font-semibold text-[#222C40] mb-5">메일 보내기</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#4B535E] mb-1">회사명</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="회사명을 입력해주세요"
                    required
                    className="w-full px-3 py-2 border border-[#DFE3E6] rounded text-sm focus:outline-none focus:border-[#FD5108] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#4B535E] mb-1">담당자명</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="성함을 입력해주세요"
                    required
                    className="w-full px-3 py-2 border border-[#DFE3E6] rounded text-sm focus:outline-none focus:border-[#FD5108] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#4B535E] mb-1">이메일</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="이메일을 입력해주세요"
                    required
                    className="w-full px-3 py-2 border border-[#DFE3E6] rounded text-sm focus:outline-none focus:border-[#FD5108] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#4B535E] mb-1">문의 내용</label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="문의 내용을 입력해주세요"
                    className="w-full px-3 py-2 border border-[#DFE3E6] rounded text-sm focus:outline-none focus:border-[#FD5108] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-[#222C40] hover:bg-[#FE7C39] text-white text-sm font-medium py-2.5 rounded transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  메일 보내기
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#222C40] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <PwCLogo height={18} color="#FFFFFF" />
              <span className="text-[12px] text-white/30">|</span>
              <span className="text-[12px] font-medium text-white/60">Worldwide Easy View</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[12px] text-white/40 hover:text-[#FD5108] transition-colors">Easy View Report</Link>
              <a href="mailto:kr_easyview@pwc.com" className="text-[12px] text-white/40 hover:text-[#FD5108] transition-colors">kr_easyview@pwc.com</a>
              <a href="https://www.pwc.com/kr/ko/services/ax-node.html" target="_blank" rel="noopener noreferrer" className="text-[12px] text-white/40 hover:text-[#FD5108] transition-colors">PwC AX Node</a>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-[11px] text-white/30">
              &copy; 2024-2026 PwC. All rights reserved. 삼일회계법인
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
