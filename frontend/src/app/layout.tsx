import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PwC Easy View 3.0",
  description: "PwC Easy View - Financial Analysis Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-sans-kr)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
