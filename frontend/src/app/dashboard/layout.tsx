"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMeta, type MetaData } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [meta, setMeta] = useState<MetaData | null>(null);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-pwc-gray-bg flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-pwc-gray-light shadow-xs sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-pwc-orange rounded" />
            <span className="text-base font-bold text-pwc-black">
              PwC <span className="text-pwc-orange">Easy View</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-pwc-gray-dark">
            {meta && (
              <>
                <span className="font-medium">{meta.companyName}</span>
                <span className="text-pwc-gray">|</span>
                <span>기준일: {meta.baseDate}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
