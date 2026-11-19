import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Link from "next/link";

import "./globals.css";
import { LogoutButton } from "@/features/auth/logout-button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "여행 수첩",
  description: "함께 만드는 여행 일정과 하루 동선 지도",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-4">
          <header className="flex items-center justify-between gap-2">
            <Link href="/" className="text-[15px] font-semibold tracking-tight">
              여행 수첩
            </Link>
            <nav className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              {user ? (
                <>
                  <span className="max-w-40 truncate">{user.email}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/auth/login" className="rounded-full px-3 py-1 text-foreground hover:bg-muted">
                  로그인
                </Link>
              )}
            </nav>
          </header>
          <main className="flex flex-1 flex-col gap-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
