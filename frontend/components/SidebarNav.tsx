"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Markets", icon: MarketIcon },
  { href: "/charts", label: "Charts", icon: ChartIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("sidebar-compact");
    if (saved === "1") setCompact(true);
  }, []);

  function toggleCompact() {
    setCompact((prev) => {
      const next = !prev;
      window.localStorage.setItem("sidebar-compact", next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#0a1220]/90 px-3 py-4 backdrop-blur transition-all duration-200 ${
        compact ? "w-[84px]" : "w-64"
      }`}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <PulseIcon />
        </div>
        {!compact && (
          <div>
            <p className="text-base font-semibold text-white">Kyro</p>
            <p className="text-xs text-muted">Trading Platform</p>
          </div>
        )}
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(0,212,170,0.25)]"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
              title={compact ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
              )}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "bg-white/5 text-muted group-hover:text-white"
                }`}
              >
                <Icon />
              </span>
              {!compact && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={toggleCompact}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <LayoutIcon />
          </span>
          {!compact && <span className="font-medium">Compact mode</span>}
        </button>
      </div>
    </aside>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12h4l2-5 4 10 2-5h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19h16M6 16V9M12 16V5M18 16v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19h16M6 15l4-4 3 3 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

