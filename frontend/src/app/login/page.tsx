"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, getToken, getAutoLogin, setAutoLogin } from "@/lib/auth";
import PwCLogo from "@/components/PwCLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getAutoLogin() && getToken()) {
      router.replace("/reports");
      return;
    }
    setAutoLoginChecked(getAutoLogin());
    setReady(true);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setAutoLogin(autoLoginChecked);
      router.push("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      {/* Top bar */}
      <div className="w-full px-8 py-4 bg-white border-b border-[#E8E8E8]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <PwCLogo height={24} color="#2D2D2D" />
          <span className="text-[#D04A02] text-lg font-light">|</span>
          <span className="text-[#2D2D2D] text-sm font-semibold">
            Easy View 3.0
          </span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Login card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-[#E8E8E8]">
            {/* Orange accent top */}
            <div className="h-1 bg-[#D04A02]" />

            <div className="px-8 pt-8 pb-10">
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#2D2D2D] mb-1">
                  로그인
                </h1>
                <p className="text-sm text-[#7D7D7D]">
                  PwC Worldwide Financial Analysis Platform
                </p>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#464646] mb-1.5"
                  >
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@samil.com"
                    required
                    className="w-full px-4 py-2.5 border border-[#E8E8E8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D04A02] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#464646] mb-1.5"
                  >
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    className="w-full px-4 py-2.5 border border-[#E8E8E8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D04A02] focus:border-transparent transition-all"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLoginChecked}
                    onChange={(e) => setAutoLoginChecked(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E8E8E8] text-[#D04A02] focus:ring-[#D04A02] cursor-pointer accent-[#D04A02]"
                  />
                  <span className="text-sm text-[#7D7D7D]">자동 로그인</span>
                </label>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#D04A02] text-white font-semibold rounded-md hover:bg-[#B83F02] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? "로그인 중..." : "로그인"}
                </button>
              </form>
            </div>
          </div>

          {/* Security notice */}
          <div className="mt-5 bg-white rounded-lg px-5 py-4 border border-[#E8E8E8] shadow-xs">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-[#D04A02] shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#2D2D2D] mb-0.5">
                  삼일회계법인 보안 정책
                </p>
                <p className="text-xs text-[#7D7D7D] leading-relaxed">
                  본 시스템은 삼일회계법인(PwC Korea)에서 등록한 계정만 접근할 수
                  있습니다. 인가된 사용자에게만 담당 고객사의 재무 데이터가
                  제공되며, 모든 접근 기록은 감사 추적(Audit Trail)을 위해
                  기록됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[#ABABAB] mt-5">
            &copy; 2024-2026 PwC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
