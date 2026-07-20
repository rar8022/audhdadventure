"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quests", label: "Quests" },
  { href: "/growth", label: "Record of Adventure" },
  { href: "/buffs", label: "Buffs & Debuffs" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex flex-wrap gap-1 border-b border-border pb-2">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname?.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-white"
                : "text-muted hover:bg-accent-bg hover:text-accent-dark"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
