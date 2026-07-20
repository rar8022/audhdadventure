"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { BUFF_CATEGORIES } from "@/lib/game/constants";
import { combinedBuffCatalog } from "@/lib/game/helpers";

export default function BuffsPage() {
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const toggleBuff = useAppStore((s) => s.toggleBuff);

  const c = account?.activeCharacterId ? characters[account.activeCharacterId] : null;
  if (!c) return null;

  const supabase = createClient();
  const catalog = combinedBuffCatalog(c);
  const activeCount = Object.keys(c.activeBuffs).filter((k) => c.activeBuffs[k]).length;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Buffs &amp; debuffs</h2>
      <p className="mb-3 text-sm text-muted">
        Tap anything that is true for your environment right now ({activeCount} active). Add
        your own in Settings.
      </p>

      {BUFF_CATEGORIES.map((cat) => {
        const items = catalog.filter((i) => i.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat} className="mb-4 last:mb-0">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {cat}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {items.map((i) => {
                const on = !!c.activeBuffs[i.id];
                const base = "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors";
                const cls = on
                  ? i.polarity === "buff"
                    ? "border-good bg-good-bg text-good"
                    : "border-warn bg-warn-bg text-warn"
                  : "border-border bg-card text-ink";
                return (
                  <button
                    key={i.id}
                    className={`${base} ${cls}`}
                    onClick={() => toggleBuff(supabase, i.id)}
                  >
                    {i.polarity === "buff" ? "+ " : "− "}
                    {i.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-4">
        <Link href="/settings" className="btn ghost small">
          Add a custom buff or debuff
        </Link>
      </div>
    </div>
  );
}
