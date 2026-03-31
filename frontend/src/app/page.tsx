import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-pwc-gray-light">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pwc-orange rounded" />
            <span className="text-xl font-bold text-pwc-black">
              PwC <span className="text-pwc-orange">Easy View</span> 3.0
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center bg-pwc-gray-bg">
        <div className="max-w-2xl mx-auto text-center px-6 py-24">
          <h1 className="text-4xl font-bold text-pwc-black mb-4">
            Easy View <span className="text-pwc-orange">3.0</span>
          </h1>
          <p className="text-lg text-pwc-gray-dark mb-2">
            Financial Analysis Dashboard
          </p>
          <p className="text-sm text-pwc-gray mb-10">
            재무 데이터를 한눈에 분석하고,
            <br />
            주요 이상징후를 빠르게 파악할 수 있는 대시보드입니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-pwc-orange hover:bg-pwc-orange-dark text-white font-semibold px-8 py-3 rounded-md transition-colors duration-200 shadow-xs"
          >
            Easy View Report 바로가기
          </Link>
        </div>
      </main>

      {/* Contact Section */}
      <footer className="bg-white border-t border-pwc-gray-light">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <h3 className="text-sm font-semibold text-pwc-gray-dark mb-3">
            문의처
          </h3>
          <div className="flex items-center justify-center gap-8 text-sm text-pwc-gray">
            <a
              href="mailto:kr_easyview@pwc.com"
              className="hover:text-pwc-orange transition-colors"
            >
              kr_easyview@pwc.com
            </a>
            <span className="text-pwc-gray-light">|</span>
            <a
              href="tel:010-9136-7136"
              className="hover:text-pwc-orange transition-colors"
            >
              010-9136-7136
            </a>
          </div>
          <p className="mt-6 text-xs text-pwc-gray">
            &copy; 2026 PricewaterhouseCoopers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
