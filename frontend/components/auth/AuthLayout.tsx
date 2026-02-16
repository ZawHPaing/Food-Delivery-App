"use client";

import Link from "next/link";

type AuthLayoutProps = {
  children: React.ReactNode;
  linkHref: string;
  linkLabel: string;
};

export default function AuthLayout({
  children,
  linkHref,
  linkLabel,
}: AuthLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">
      <header className="shrink-0 flex items-center justify-between px-6 h-14">
        <Link
          href="/consumer_module"
          className="flex items-center gap-2 text-neutral-900 no-underline"
        >
          <div className="h-8 w-8 rounded-lg bg-[#e4002b] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">F</span>
          </div>
          <span className="font-semibold text-neutral-900 tracking-tight">
            Foodie
          </span>
        </Link>
        <Link
          href={linkHref}
          className="text-sm font-medium text-neutral-600 hover:text-[#e4002b] transition-colors"
        >
          {linkLabel}
        </Link>
      </header>
      <main className="flex-1 min-h-0 flex items-center justify-center overflow-hidden px-4">
        {children}
      </main>
    </div>
  );
}
