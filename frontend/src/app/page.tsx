"use client";

import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";
import PwCLogo from "@/components/PwCLogo";
import DemoRequestModal from "@/components/DemoRequestModal";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [ytHovered, setYtHovered] = useState(false);

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
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-pt-16 bg-white">
      {/* ===== Header ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-lg border-b border-[#E0E5EA]"
            : "bg-white border-b border-[#E0E5EA]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PwCLogo height={22} color="#222C40" />
            <span className="text-[14px] font-semibold text-[#222C40] tracking-tight">Easy View</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "서비스", id: "services" },
              { label: "기능", id: "manual" },
              { label: "신뢰성", id: "digital" },
              { label: "연락처", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-[13px] text-[#222C40]/70 hover:text-[#FD5108] transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#FD5108] hover:bg-[#E84A00] text-white text-[12px] font-bold px-5 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              무료 데모
            </button>
          </div>
        </div>
      </header>

      <div className="h-16 shrink-0" />

      {/* ===== Hero ===== */}
      <section className="snap-start min-h-screen relative overflow-hidden bg-[#F5F7F8] flex items-center">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-8%] w-[700px] h-[700px] bg-[#FD5108]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-8%] w-[600px] h-[600px] bg-[#FF9F00]/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#FD5108]/3 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 w-full py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ── Left: copy ── */}
            <div style={{ animation: "fadeSlideUp 0.7s ease-out both" }}>
              <div className="inline-flex items-center gap-2 bg-[#FD5108]/10 border border-[#FD5108]/30 rounded-full px-4 py-2 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FD5108] animate-pulse" />
                <span className="text-[11px] font-bold text-[#FD5108] uppercase tracking-wider">혁신적인 재무 분석 플랫폼</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-[#222C40] leading-tight mb-6">
                데이터 기반의
                <br />
                의사결정을
                <br />
                <span style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>경험하세요</span>
              </h1>
              <p className="text-lg text-[#4B535E] leading-relaxed mb-10 max-w-md">
                복잡한 재무 데이터를 직관적인 시각화로 변환하여 의사결정 속도를 높이고 정확성을 극대화합니다.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-[#FD5108] to-[#FF7520] hover:from-[#E84A00] hover:to-[#FF6419] text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  지금 시작하기 →
                </button>
                <Link
                  href="/login"
                  className="px-8 py-4 border-2 border-[#222C40]/30 hover:border-[#222C40] text-[#222C40] font-bold rounded-lg transition-colors"
                >
                  대시보드 보기
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-12 pt-10 border-t border-[#DFE3E6]">
                {[
                  { num: "134K+", label: "전표 분석" },
                  { num: "5", label: "대시보드" },
                  { num: "6", label: "시나리오" },
                  { num: "99%", label: "정확도" },
                ].map((stat, i) => (
                  <div key={stat.label} style={{ animation: `fadeSlideUp ${0.9 + i * 0.1}s ease-out both` }}>
                    <div className="text-2xl md:text-3xl font-bold text-[#FD5108] mb-1">{stat.num}</div>
                    <div className="text-xs text-[#4B535E] font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Easy View Summary Dashboard mockup ── */}
            <div className="relative hidden md:block" style={{ animation: "heroFloat 7s ease-in-out infinite, fadeSlideUp 0.9s ease-out both" }}>
              {/* Outer glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#FD5108]/12 to-[#FF9F00]/8 rounded-3xl blur-2xl" />

              {/* Dashboard card */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E0E5EA] overflow-hidden text-[0px]">

                {/* ── EasyView nav bar ── */}
                <div className="bg-white border-b border-[#E0E5EA] px-3 h-8 flex items-center gap-0">
                  {/* Logo */}
                  <div className="flex items-center gap-1 mr-3 shrink-0">
                    <svg width="14" height="10" viewBox="0 0 38 28" fill="none">
                      <path d="M0 14C0 6.268 6.268 0 14 0h10c7.732 0 14 6.268 14 14s-6.268 14-14 14H14C6.268 28 0 21.732 0 14z" fill="#E8703A" opacity="0.9"/>
                      <circle cx="14" cy="14" r="5" fill="white"/>
                    </svg>
                    <span className="text-[9px] font-bold text-[#222C40] leading-none">Easy<span className="text-[#E8703A]">View</span></span>
                  </div>
                  {/* Nav tabs */}
                  {[
                    { label: "Summary", active: true },
                    { label: "손익분석", active: false },
                    { label: "재무상태분석", active: false },
                    { label: "전표분석", active: false },
                    { label: "시나리오분석", active: false },
                  ].map((tab) => (
                    <div
                      key={tab.label}
                      className="px-2 h-full flex items-center border-b-2 shrink-0"
                      style={{
                        borderColor: tab.active ? "#E8703A" : "transparent",
                        fontSize: "9px",
                        color: tab.active ? "#E8703A" : "#A1A8B3",
                        fontWeight: tab.active ? 700 : 400,
                      }}
                    >
                      {tab.label}
                    </div>
                  ))}
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <span style={{ fontSize: "8px", color: "#A1A8B3" }}>admin님, 환영합니다.</span>
                  </div>
                </div>

                {/* ── Filter bar ── */}
                <div className="bg-[#F9FAFB] border-b border-[#E0E5EA] px-3 py-1.5 flex items-center gap-2">
                  <div className="flex rounded overflow-hidden border border-[#DFE3E6]">
                    {["기간", "월별", "누적"].map((t, i) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "8px",
                          padding: "2px 6px",
                          background: i === 2 ? "#E8703A" : "white",
                          color: i === 2 ? "white" : "#A1A8B3",
                          fontWeight: i === 2 ? 700 : 400,
                        }}
                      >{t}</span>
                    ))}
                  </div>
                  {["2025년 09월 ▾", "전년누적 ▾", "비교대상(재무) ▾", "연초 ▾"].map((chip) => (
                    <span
                      key={chip}
                      className="bg-white border border-[#DFE3E6] rounded"
                      style={{ fontSize: "7.5px", color: "#4B535E", padding: "2px 5px" }}
                    >{chip}</span>
                  ))}
                </div>

                <div className="p-3">
                  {/* Section title */}
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#222C40", marginBottom: "8px" }}>Summary</div>

                  {/* ── 4 KPI cards ── */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      { label: "매출액", value: "133,930", change: "▲17.3%", vs: "vs 전년누적", chColor: "#E8703A", path: "M0,26 C15,24 25,20 35,18 C45,16 50,22 60,14 C70,8 80,10 90,6", fill: "rgba(232,112,58,0.08)" },
                      { label: "영업이익", value: "246,091", change: "▲21.7%", vs: "vs 전년누적", chColor: "#E8703A", path: "M0,28 C10,26 20,30 30,22 C40,16 50,24 60,14 C72,6 82,8 90,3", fill: "rgba(232,112,58,0.08)" },
                      { label: "자산", value: "124,748", change: "▲20.4%", vs: "vs 기초", chColor: "#E8703A", path: "M0,22 C15,20 25,24 35,18 C45,14 55,20 65,15 C75,12 82,13 90,10", fill: "rgba(232,112,58,0.08)" },
                      { label: "부채", value: "20,562", change: "▼0.0%", vs: "vs 기초", chColor: "#A1A8B3", path: "M0,16 C15,15 25,18 40,16 C55,14 65,17 80,15 C84,14 87,15 90,15", fill: "rgba(161,168,179,0.08)" },
                    ].map((kpi, i) => (
                      <div
                        key={i}
                        className="bg-white border border-[#E0E5EA] rounded-lg overflow-hidden"
                        style={{ animation: `fadeSlideUp ${0.35 + i * 0.1}s ease-out both`, padding: "8px 8px 0 8px" }}
                      >
                        <div style={{ fontSize: "8px", color: "#4B535E", marginBottom: "2px", fontWeight: 500 }}>{kpi.label}</div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#222C40", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{kpi.value}</div>
                        <div style={{ fontSize: "7px", color: "#A1A8B3", margin: "1px 0" }}>백만</div>
                        <div style={{ fontSize: "8px", color: kpi.chColor, fontWeight: 600 }}>{kpi.change} {kpi.vs}</div>
                        {/* Sparkline */}
                        <svg viewBox="0 0 90 30" style={{ width: "100%", height: "28px", display: "block", marginTop: "2px" }} preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={kpi.chColor} stopOpacity="0.25" />
                              <stop offset="100%" stopColor={kpi.chColor} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d={`${kpi.path} L90,30 L0,30 Z`} fill={`url(#sg${i})`} />
                          <path
                            d={kpi.path}
                            fill="none"
                            stroke={kpi.chColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: `drawSparkline 1.4s ${0.6 + i * 0.15}s ease-out forwards` }}
                          />
                        </svg>
                      </div>
                    ))}
                  </div>

                  {/* ── 4 ranking tables (2x2) ── */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {[
                      {
                        title: "매출액 증가 상위 3개 거래처",
                        items: [{ n: "AA편세점", v: "7,449", w: 85 }, { n: "타오바오주식회사(매출)", v: "6,304", w: 68 }, { n: "텐센트", v: "3,404", w: 40 }],
                      },
                      {
                        title: "비용 증가 상위 3개 계정",
                        items: [{ n: "제품매출원가", v: "6,711", w: 80 }, { n: "판매수수료", v: "5,088", w: 62 }, { n: "잡손실", v: "4,459", w: 54 }],
                      },
                      {
                        title: "자산 증가 상위 3개 계정",
                        items: [{ n: "단기금융상품", v: "10,890", w: 90 }, { n: "매출채권", v: "7,854", w: 70 }, { n: "매출채권", v: "4,797", w: 46 }],
                      },
                      {
                        title: "부채 증가 상위 3개 계정",
                        items: [{ n: "부가세예수금", v: "3,331", w: 88 }, { n: "미지급법인세", v: "210", w: 20 }, { n: "미지급비용", v: "99", w: 10 }],
                      },
                    ].map((tbl, t) => (
                      <div
                        key={t}
                        className="bg-white border border-[#E0E5EA] rounded-lg"
                        style={{ padding: "6px 8px", animation: `fadeSlideUp ${0.6 + t * 0.08}s ease-out both` }}
                      >
                        <div style={{ fontSize: "7.5px", fontWeight: 600, color: "#4B535E", marginBottom: "5px" }}>{tbl.title}</div>
                        {tbl.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: i < 2 ? "3px" : 0 }}>
                            <span style={{
                              width: "12px", height: "12px", borderRadius: "3px", flexShrink: 0,
                              background: i === 0 ? "#E8703A" : "#E0E5EA",
                              color: i === 0 ? "white" : "#A1A8B3",
                              fontSize: "7px", fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "7.5px", color: "#222C40", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.n}</div>
                              <div style={{ height: "2px", background: "#F0F0F0", borderRadius: "1px", marginTop: "2px" }}>
                                <div style={{
                                  height: "100%", borderRadius: "1px",
                                  width: `${item.w}%`,
                                  background: i === 0 ? "#E8703A" : "#DFE3E6",
                                  animation: `barRise 0.6s ${0.8 + t * 0.1 + i * 0.08}s ease-out both`,
                                  transformOrigin: "left",
                                }} />
                              </div>
                            </div>
                            <span style={{ fontSize: "7.5px", fontWeight: 700, color: "#222C40", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{item.v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* ── Financial ratios ── */}
                  <div className="bg-[#F9FAFB] border border-[#E0E5EA] rounded-lg" style={{ padding: "6px 10px" }}>
                    <div className="grid grid-cols-2 gap-x-6">
                      <div>
                        <div style={{ fontSize: "7.5px", fontWeight: 600, color: "#4B535E", marginBottom: "4px" }}>손익지표</div>
                        <div className="flex gap-4">
                          {[{ l: "매출총이익률", v: "139.5%", c: "#E8703A" }, { l: "영업이익률", v: "183.8%", c: "#E8703A" }, { l: "당기손익률", v: "186.4%", c: "#222C40" }].map((r) => (
                            <div key={r.l}>
                              <div style={{ fontSize: "7px", color: "#A1A8B3", marginBottom: "1px" }}>{r.l}</div>
                              <div style={{ fontSize: "11px", fontWeight: 800, color: r.c, fontVariantNumeric: "tabular-nums" }}>{r.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "7.5px", fontWeight: 600, color: "#4B535E", marginBottom: "4px" }}>유동성지표</div>
                        <div className="flex gap-6">
                          {[{ l: "부채비율", v: "24.8%", c: "#4B535E" }, { l: "유동비율", v: "673.9%", c: "#059669" }].map((r) => (
                            <div key={r.l}>
                              <div style={{ fontSize: "7px", color: "#A1A8B3", marginBottom: "1px" }}>{r.l}</div>
                              <div style={{ fontSize: "11px", fontWeight: 800, color: r.c, fontVariantNumeric: "tabular-nums" }}>{r.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge — bottom left */}
              <div className="absolute -bottom-4 -left-5 bg-white rounded-xl shadow-lg border border-[#DFE3E6] px-3 py-2 flex items-center gap-2" style={{ animation: "heroFloat 5s 1s ease-in-out infinite" }}>
                <div className="w-6 h-6 rounded-full bg-[#E8703A]/10 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18" stroke="#E8703A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: "8px", color: "#A1A8B3" }}>영업이익</div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#E8703A" }}>▲ 21.7%</div>
                </div>
              </div>

              {/* Floating badge — top right */}
              <div className="absolute -top-4 -right-5 bg-white rounded-xl shadow-lg border border-[#DFE3E6] px-3 py-2 flex items-center gap-2" style={{ animation: "heroFloat 5s 2.5s ease-in-out infinite" }}>
                <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: "8px", color: "#A1A8B3" }}>유동비율</div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#059669" }}>673.9%</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== 서비스 안내 ===== */}
      <section id="services" className="snap-start min-h-screen py-24 md:py-40 bg-gradient-to-b from-white to-[#F5F7F8]">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block">
              <div className="text-[12px] font-semibold text-[#FD5108] tracking-widest uppercase mb-3 block">핵심 기능</div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#222C40] mb-4 leading-tight">
                정교한 재무분석
                <br />
                <span style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>한곳에서 통제</span>
              </h2>
              <p className="text-base text-[#4B535E] leading-relaxed max-w-2xl mx-auto">
                복잡한 재무 데이터를 직관적인 시각화와 강력한 분석 도구로
                <br />
                빠르고 정확한 의사결정을 지원합니다.
              </p>
            </div>
          </div>

          {/* Feature cards - 3x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              {
                title: "Summary Dashboard",
                desc: "주요 KPI와 손익, 유동성 지표를 한눈에 파악하고 경영 현황을 신속하게 인지합니다.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ),
                preview: (
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-[#E0E5EA] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 delay-100 ease-out">
                      {/* Mini KPI row */}
                      <div className="flex gap-1.5 mb-3">
                        {[
                          { label: "매출", value: "2.4B", change: "+12%", up: true },
                          { label: "영업이익", value: "180M", change: "+8%", up: true },
                          { label: "유동비율", value: "142%", change: "-3%", up: false },
                        ].map((kpi) => (
                          <div key={kpi.label} className="flex-1 bg-[#F5F7F8] rounded p-1.5">
                            <div className="text-[8px] text-[#A1A8B3] mb-0.5">{kpi.label}</div>
                            <div className="text-[10px] font-bold text-[#222C40]">₩{kpi.value}</div>
                            <div className={`text-[8px] font-semibold ${kpi.up ? "text-[#059669]" : "text-[#FA143C]"}`}>{kpi.change}</div>
                          </div>
                        ))}
                      </div>
                      {/* Mini bar chart */}
                      <div className="flex items-end gap-[2px] h-7">
                        {[38, 52, 44, 58, 48, 65, 60, 74, 68, 80, 72, 90].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{ height: `${h}%`, backgroundColor: i === 11 ? "#FD5108" : "#FFCDA8" }}
                          />
                        ))}
                      </div>
                      <div className="text-[8px] text-[#A1A8B3] mt-1">월별 매출 추이</div>
                    </div>
                  </div>
                ),
              },
              {
                title: "손익 분석",
                desc: "매출, 영업이익, 당기순이익 추이를 분석하고 거래처별 매출 비중을 파악합니다.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                preview: (
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-[#E0E5EA] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 delay-100 ease-out">
                      <div className="flex gap-3 mb-2">
                        {[{ label: "매출", color: "#FD5108" }, { label: "영업이익", color: "#059669" }].map((l) => (
                          <span key={l.label} className="flex items-center gap-1 text-[8px] text-[#4B535E]">
                            <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: l.color }} />
                            {l.label}
                          </span>
                        ))}
                      </div>
                      <svg viewBox="0 0 220 44" className="w-full h-10">
                        <polyline points="0,38 20,33 40,40 60,26 80,30 100,18 120,22 140,10 160,14 180,6 200,8 220,2" fill="none" stroke="#FD5108" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="0,42 20,40 40,43 60,36 80,38 100,32 120,34 140,26 160,29 180,22 200,24 220,17" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-[8px] text-[#A1A8B3] mt-1">월별 손익 추이 (1–12월)</div>
                    </div>
                  </div>
                ),
              },
              {
                title: "재무상태 분석",
                desc: "자산·부채·자본 구조 변화를 추적하고 회전율 개선 기회를 발굴합니다.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                preview: (
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-[#E0E5EA] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 delay-100 ease-out">
                      <div className="text-[8px] text-[#A1A8B3] mb-2">자산·부채·자본 구성</div>
                      {[
                        { label: "유동자산", pct: 72, color: "#FD5108" },
                        { label: "비유동자산", pct: 55, color: "#FF9F00" },
                        { label: "부채", pct: 43, color: "#FFCDA8" },
                        { label: "자본", pct: 85, color: "#DFE3E6" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5 mb-1">
                          <div className="text-[8px] text-[#4B535E] w-12 shrink-0">{item.label}</div>
                          <div className="flex-1 h-2 bg-[#F5F7F8] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                          </div>
                          <div className="text-[8px] text-[#222C40] font-bold w-6 text-right">{item.pct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                title: "전표 분석",
                desc: "전표 기표내역을 일자·계정·거래처별로 분석하고 상대계정을 추적합니다.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                preview: (
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-[#E0E5EA] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 delay-100 ease-out">
                      <div className="text-[8px] text-[#A1A8B3] mb-1.5">최근 전표 내역</div>
                      <div className="space-y-1.5">
                        {[
                          { date: "12.15", account: "보통예금", type: "차변", amount: "5,200" },
                          { date: "12.14", account: "매출채권", type: "대변", amount: "3,800" },
                          { date: "12.13", account: "급여", type: "차변", amount: "2,100" },
                        ].map((e, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[8px] bg-[#F5F7F8] rounded px-2 py-1">
                            <span className="text-[#A1A8B3] shrink-0">{e.date}</span>
                            <span className="flex-1 text-[#222C40] font-medium truncate">{e.account}</span>
                            <span className={`shrink-0 px-1 rounded text-[7px] font-bold ${e.type === "차변" ? "bg-[#FD5108]/10 text-[#FD5108]" : "bg-[#059669]/10 text-[#059669]"}`}>{e.type}</span>
                            <span className="text-[#222C40] font-semibold shrink-0">{e.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: "시나리오 분석",
                desc: "6가지 시나리오로 자동 탐지하여 비정상 거래 위험을 선제적으로 알립니다.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.95L13.75 4a2 2 0 00-3.5 0L3.32 16.05A2 2 0 005.07 19z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                preview: (
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-[#E0E5EA] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 delay-100 ease-out">
                      <div className="text-[8px] text-[#A1A8B3] mb-2">시나리오 탐지 현황</div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: "중복전표", count: 3, level: "high" },
                          { label: "주말지급", count: 7, level: "mid" },
                          { label: "고액현금", count: 2, level: "high" },
                          { label: "부채인식", count: 1, level: "low" },
                          { label: "비용현금", count: 5, level: "mid" },
                          { label: "희귀거래", count: 12, level: "low" },
                        ].map((s) => (
                          <div key={s.label} className={`rounded p-1.5 text-center ${s.level === "high" ? "bg-red-50" : s.level === "mid" ? "bg-orange-50" : "bg-[#F5F7F8]"}`}>
                            <div className={`text-[10px] font-bold ${s.level === "high" ? "text-red-500" : s.level === "mid" ? "text-[#FD5108]" : "text-[#A1A8B3]"}`}>{s.count}</div>
                            <div className="text-[7px] text-[#4B535E] mt-0.5">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: "PDF 리포트",
                desc: "현재 탭 또는 전체 분석 결과를 PDF로 원클릭 내보내기합니다.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                ),
                preview: (
                  <div className="max-h-0 group-hover:max-h-40 overflow-hidden transition-all duration-500 ease-in-out">
                    <div className="mt-4 pt-4 border-t border-[#E0E5EA] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500 delay-100 ease-out">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-[#F5F7F8] rounded border border-[#E0E5EA] p-2">
                          <div className="flex items-center gap-1 mb-1.5">
                            <div className="w-2 h-2 rounded-sm bg-[#FD5108]" />
                            <div className="h-1.5 bg-[#DFE3E6] rounded flex-1" />
                          </div>
                          <div className="space-y-1">
                            <div className="h-1 bg-[#DFE3E6] rounded w-full" />
                            <div className="h-1 bg-[#DFE3E6] rounded w-4/5" />
                            <div className="flex gap-0.5 items-end h-4 mt-1">
                              {[50, 65, 45, 80, 60, 90].map((h, i) => (
                                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#FD5108" : "#FFCDA8" }} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 justify-center">
                          {["현재 탭", "전체"].map((opt) => (
                            <div key={opt} className="text-[8px] px-2 py-1 bg-[#FD5108]/10 border border-[#FD5108]/20 rounded text-[#FD5108] font-semibold flex items-center gap-1">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M12 2v10m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((card) => (
              <div key={card.title} className="group relative bg-white border border-[#E0E5EA] rounded-lg overflow-hidden hover:shadow-lg hover:border-[#FD5108]/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FD5108]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-7 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", color: "white" }}>
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#222C40] mb-2">{card.title}</h3>
                  <p className="text-sm text-[#4B535E] leading-relaxed flex-1">{card.desc}</p>
                  {card.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 매뉴얼 & 가이드 ===== */}
      <section id="manual" className="snap-start min-h-screen bg-white py-24 md:py-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block">
              <div className="text-[12px] font-semibold text-[#FD5108] tracking-widest uppercase mb-3 block">학습 자료</div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#222C40] mb-4 leading-tight">
                Easy View를 
                <br />
                <span style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>더 잘 활용하기</span>
              </h2>
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 동영상 매뉴얼 (국문) */}
            <div
              className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4 transition-all duration-500"
              style={{ transform: ytHovered ? "scale(0.88)" : "scale(1)", opacity: ytHovered ? 0.35 : 1, pointerEvents: ytHovered ? "none" : "auto" }}
            >
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
            <div
              className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4 transition-all duration-500"
              style={{ transform: ytHovered ? "scale(0.88)" : "scale(1)", opacity: ytHovered ? 0.35 : 1, pointerEvents: ytHovered ? "none" : "auto" }}
            >
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
            <div
              className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4 transition-all duration-500"
              style={{ transform: ytHovered ? "scale(0.88)" : "scale(1)", opacity: ytHovered ? 0.35 : 1, pointerEvents: ytHovered ? "none" : "auto" }}
            >
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

            {/* 삼일회계법인 공식 YouTube — hover 시 화면 꽉 채우도록 확장 */}
            <div
              className="bg-white rounded-lg border border-[#DFE3E6] p-5 flex items-start gap-4 transition-all duration-500 cursor-pointer"
              style={{ transform: ytHovered ? "scale(0.88)" : "scale(1)", opacity: ytHovered ? 0.6 : 1 }}
              onMouseEnter={() => setYtHovered(true)}
            >
              <div className="shrink-0 w-10 h-10 rounded bg-red-50 flex items-center justify-center text-red-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.1" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#222C40] mb-0.5">삼일회계법인 공식 YouTube</h3>
                <p className="text-[12px] text-[#4B535E] mb-2">Worldwide Easy View 영상을 확인하십시오.</p>
                <span className="text-[12px] text-red-500 font-medium flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
                  hover로 재생
                </span>
              </div>
            </div>
          </div>

          {/* YouTube 확장 오버레이 */}
          {ytHovered && (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", animation: "fadeIn 0.3s ease" }}
              onClick={() => setYtHovered(false)}
            >
              <div
                className="relative bg-black rounded-xl overflow-hidden shadow-2xl"
                style={{ width: "min(90vw, 1100px)", animation: "scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 닫기 버튼 */}
                <button
                  onClick={() => setYtHovered(false)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="aspect-video w-full">
                  <iframe
                    src="https://www.youtube.com/embed/t8I87XRpLsU?autoplay=1&rel=0&modestbranding=1"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                  />
                </div>
                <div className="px-5 py-3 bg-[#111] flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
                  </div>
                  <span className="text-sm text-white font-medium">삼일회계법인 공식 YouTube · Worldwide Easy View</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== Digital & AI ===== */}
      <section id="digital" className="snap-start min-h-screen bg-[#F5F7F8] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="text-[11px] font-semibold text-[#FD5108] tracking-wider uppercase mb-2">Digital &amp; AI</div>
            <h2 className="text-xl md:text-2xl font-bold text-[#222C40] mb-3">Digital &amp; AI</h2>
            <p className="text-sm text-[#4B535E] leading-relaxed max-w-3xl">
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
              <div key={item.num} className="flex items-center gap-3 bg-white border border-[#DFE3E6] rounded-lg px-5 py-3.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#FD5108] text-white text-[11px] font-bold flex items-center justify-center">
                  {item.num}
                </div>
                <div className="text-sm text-[#4B535E]">{item.text}</div>
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
                    : "bg-white text-[#4B535E] border-[#DFE3E6] hover:border-[#FD5108] hover:text-[#FD5108]"
                }`}
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Managed Service ===== */}
      <section id="managed" className="snap-start min-h-screen py-24 md:py-40 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block">
              <div className="text-[12px] font-semibold text-[#FD5108] tracking-widest uppercase mb-3 block">신뢰성</div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#222C40] mb-4 leading-tight">
                기업 데이터를 지키는
                <br />
                <span style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>다층 보안</span>
              </h2>
              <p className="text-base text-[#4B535E] leading-relaxed max-w-2xl mx-auto">
                삼일회계법인의 엄격한 보안 기준과 글로벌 클라우드 인프라로
                <br />
                고객의 재무 정보를 안전하게 보호합니다.
              </p>
            </div>
          </div>

          {/* Security features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {[
              {
                title: "ISO 27001 인증",
                desc: "국제 정보보안 표준을 획득하여 고객 데이터를 신뢰할 수 있는 보안 환경에 보관합니다.",
                icon: "🔒",
              },
              {
                title: "Azure 클라우드",
                desc: "마이크로소프트의 엔터프라이즈급 클라우드 보안으로 개인정보와 재무 데이터를 안전하게 보호합니다.",
                icon: "☁️",
              },
              {
                title: "데이터 암호화",
                desc: "전송 중(TLS/SSL)과 저장 시(AES-256) 모든 데이터가 강력한 암호화로 보호됩니다.",
                icon: "🔐",
              },
              {
                title: "접근 제어",
                desc: "역할 기반 접근 제어(RBAC)와 다단계 인증(MFA)으로 불정당한 접근을 차단합니다.",
                icon: "👤",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gradient-to-br from-white to-[#F5F7F8] border border-[#E0E5EA] rounded-lg p-8 hover:border-[#FD5108]/50 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="text-4xl mt-1">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#222C40] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#4B535E] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance badges */}
          <div className="text-center pt-12 border-t border-[#E0E5EA]">
            <p className="text-sm text-[#4B535E] mb-6">준수 표준 및 인증</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: "ISO 27001", color: "blue" },
                { label: "ISO 27018", color: "blue" },
                { label: "SOC 2 Type II", color: "blue" },
                { label: "GDPR", color: "purple" },
                { label: "CCPA", color: "purple" },
              ].map((cert) => (
                <div key={cert.label} className={`px-4 py-2 rounded-full border text-[12px] font-medium ${cert.color === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-purple-50 border-purple-200 text-purple-700"}`}>
                  {cert.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Contact Us ===== */}
      <div className="snap-start min-h-screen flex flex-col">
      <section id="contact" className="bg-gradient-to-b from-[#F5F7F8] to-white py-24 md:py-40 flex-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left */}
            <div>
              <div className="text-[12px] font-semibold text-[#FD5108] tracking-widest uppercase mb-3 block">시작하기</div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#222C40] mb-6 leading-tight">
                Easy View와 함께
                <br />
                스마트한 의사결정을 시작하세요
              </h2>
              <p className="text-base text-[#4B535E] leading-relaxed mb-8">
                데모 요청부터 본 이용까지 삼일회계법인의 전문가 팀이 함께합니다.
                <br />
                궁금한 점이 있으시면 언제든 편하게 문의해주세요.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white rounded-lg border border-[#DFE3E6] p-5 hover:border-[#FD5108]/50 hover:shadow-md transition-all">
                  <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", color: "white" }}>
                    ✉️
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#4B535E] mb-0.5">이메일</div>
                    <a href="mailto:kr_easyview@pwc.com" className="text-base font-semibold text-[#222C40] hover:text-[#FD5108] transition-colors">
                      kr_easyview@pwc.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white rounded-lg border border-[#DFE3E6] p-5 hover:border-[#FD5108]/50 hover:shadow-md transition-all">
                  <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", color: "white" }}>
                    📱
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#4B535E] mb-0.5">연락처</div>
                    <a href="tel:010-9136-7136" className="text-base font-semibold text-[#222C40] hover:text-[#FD5108] transition-colors">
                      010-9136-7136
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white rounded-lg border border-[#DFE3E6] p-5">
                  <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)", color: "white" }}>
                    🏢
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#4B535E] mb-1">팀</div>
                    <div className="text-base font-semibold text-[#222C40]">삼일회계법인</div>
                    <div className="text-sm text-[#4B535E]">Worldwide Easy View 서비스팀</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form or CTA */}
            <div className="bg-white rounded-xl border border-[#E0E5EA] shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-bold text-[#222C40] mb-6">지금 시작하기</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #FF9F00, #FD5108)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M15 17H20L18.5 15.5M9 17h4v.01M5 17h.01M20 9h-3V5a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h3v3l4-3h5a2 2 0 002-2v-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="white" opacity="0.8" />
                    </svg>
                    데모 요청하기
                  </button>
                  <button
                    onClick={() => scrollTo("services")}
                    className="w-full py-3 px-6 rounded-lg font-semibold border-2 border-[#222C40] text-[#222C40] hover:bg-[#222C40] hover:text-white transition-all"
                  >
                    기능 살펴보기
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#FF9F00]/10 to-[#FD5108]/10 border-t border-[#E0E5EA] px-8 py-4">
                <p className="text-[12px] text-[#4B535E]">
                  💡 <strong>팁:</strong> 간단한 데모 요청만으로도 전담 담당자가 배정됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Demo Modal ===== */}
      <DemoRequestModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />

      {/* ===== Footer ===== */}
      <footer className="bg-[#F5F7F8] border-t border-[#DFE3E6]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 pb-12 border-b border-[#DFE3E6]">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <PwCLogo height={20} color="#222C40" />
                <span className="text-[13px] font-semibold text-[#222C40]">Easy View</span>
              </div>
              <p className="text-[13px] text-[#4B535E]">
                국내외법인 재무정보에 대한 스마트한 접근법
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[12px] font-bold text-[#222C40] uppercase tracking-wide mb-4">서비스</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo("services")} className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">기능 안내</button></li>
                <li><a href="/login" className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">리포트 접속</a></li>
                <li><a href="https://www.pwc.com/kr/ko/services/ax-node/easy-view.html" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">PwC Easy View</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[12px] font-bold text-[#222C40] uppercase tracking-wide mb-4">지원</h4>
              <ul className="space-y-2">
                <li><a href="mailto:kr_easyview@pwc.com" className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">이메일</a></li>
                <li><a href="tel:010-9136-7136" className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">연락처</a></li>
                <li><button onClick={() => scrollTo("contact")} className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">문의하기</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[12px] font-bold text-[#222C40] uppercase tracking-wide mb-4">법무</h4>
              <ul className="space-y-2">
                <li><a href="https://www.pwc.com/kr/ko/services/ax-node.html" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">개인정보보호</a></li>
                <li><a href="https://www.pwc.com/kr/ko/services/ax-node.html" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#4B535E] hover:text-[#FD5108] transition-colors">이용약관</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#A1A8B3]">
              © 2024-2026 PwC. Samil PricewaterhouseCoopers. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <div className="text-[11px] text-[#4B535E] px-2 py-1 rounded bg-white border border-[#DFE3E6]">
                🔒 ISO 27001 인증
              </div>
              <div className="text-[11px] text-[#4B535E] px-2 py-1 rounded bg-white border border-[#DFE3E6]">
                ☁️ Azure 클라우드
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
