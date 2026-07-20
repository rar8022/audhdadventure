"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";

export default function Header() {
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const characterOrder = useAppStore((s) => s.characterOrder);
  const switchCharacter = useAppStore((s) => s.switchCharacter);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">An AuDHD Adventure</h1>
        <p className="text-sm text-muted">
          A gentle RPG framework for tracking your resources — not a
          diagnosis, just a language.
        </p>
        <Link
          href="/help"
          className="btn ghost small mt-2 inline-block !px-0 !py-0 underline"
        >
          Help &amp; tutorial
        </Link>
      </div>

      {account?.mode === "system" && (
        <div className="flex flex-wrap gap-2">
          {characterOrder.map((id) => {
            const c = characters[id];
            if (!c) return null;
            const active = id === account.activeCharacterId;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!active) switchCharacter(createClient(), id);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  active
                    ? "border-accent bg-accent-bg text-accent-dark"
                    : "border-border bg-card text-muted"
                }`}
              >
                {c.name}
              </button>
            );
          })}
          <Link
            href="/settings"
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted"
          >
            Manage party
          </Link>
        </div>
      )}
    </header>
  );
}
