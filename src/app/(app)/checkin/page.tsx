"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { MAIN_ROLES } from "@/lib/game/constants";
import { combinedBuffCatalog } from "@/lib/game/helpers";

export default function CheckinPage() {
  const router = useRouter();
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const setMainRole = useAppStore((s) => s.setMainRole);
  const setMainRoleWhy = useAppStore((s) => s.setMainRoleWhy);
  const setActiveMasks = useAppStore((s) => s.setActiveMasks);
  const logCheckin = useAppStore((s) => s.logCheckin);

  const c = account?.activeCharacterId ? characters[account.activeCharacterId] : null;
  if (!c) return null;

  const supabase = createClient();
  const activeMasks = c.subRoles.filter((m) => m.active);
  const activeBuffDebuffItems = combinedBuffCatalog(c).filter((x) => c.activeBuffs[x.id]);
  const selectSize = c.subRoles.length ? Math.min(6, Math.max(3, c.subRoles.length)) : undefined;

  return (
    <>
      <div className="card">
        <div className="mb-3">
          <Link href="/dashboard" className="btn ghost small">
            Back to Dashboard
          </Link>
        </div>
        <h2 className="text-lg font-semibold">Today&apos;s check-in</h2>
        <p className="mb-3 text-sm text-muted">
          A quick journal entry — the role you&apos;re wearing today, and a snapshot of
          what&apos;s active around you. Answer what feels relevant, no penalty for leaving
          things blank.
        </p>
        <label className="mb-1 block text-sm font-medium text-ink">Main role</label>
        <select
          value={c.mainRole}
          onChange={(e) => setMainRole(supabase, e.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {MAIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label className="mb-1 block text-sm font-medium text-ink">Why this fits right now</label>
        <textarea
          value={c.mainRoleWhy}
          onChange={(e) => setMainRoleWhy(supabase, e.target.value)}
          placeholder="What made you pick this today?"
          rows={3}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Today&apos;s masks (sub-roles)</h3>
        <p className="mb-2 text-sm text-muted">
          Pick which of {c.name}&apos;s masks apply today. Add or edit the mask list itself in
          Settings.
        </p>
        <label className="mb-1 block text-sm font-medium text-ink">Active masks</label>
        {c.subRoles.length ? (
          <>
            <select
              multiple
              size={selectSize}
              value={activeMasks.map((m) => m.id)}
              onChange={(e) => {
                const ids = Array.from(e.target.selectedOptions).map((o) => o.value);
                setActiveMasks(supabase, ids);
              }}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {c.subRoles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} · {m.multiplier}x · {m.decisionLoad}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted">
              Ctrl/Cmd-click (or tap and drag on mobile) to select more than one.
            </p>
          </>
        ) : (
          <p className="empty">No masks defined yet for {c.name}.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeMasks.length ? (
            activeMasks.map((m) => (
              <span key={m.id} className="chip mask">
                {m.label} · {m.multiplier}x
              </span>
            ))
          ) : (
            <p className="empty">Nothing selected as active yet.</p>
          )}
        </div>
        <div className="mt-3">
          <Link href="/settings" className="btn ghost small">
            Manage masks in Settings
          </Link>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Buffs &amp; debuffs right now</h3>
        <p className="mb-2 text-sm text-muted">
          This is what will be captured in today&apos;s snapshot. Update it on the Buffs &amp;
          debuffs tab any time before you save.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {activeBuffDebuffItems.length ? (
            activeBuffDebuffItems.map((x) => (
              <span key={x.id} className={`chip ${x.polarity}`}>
                {x.label}
              </span>
            ))
          ) : (
            <p className="empty">Nothing marked active right now.</p>
          )}
        </div>
        <div className="mt-3">
          <Link href="/buffs" className="btn ghost small">
            Update buffs &amp; debuffs
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <button
          className="btn"
          onClick={async () => {
            await logCheckin(supabase);
            router.push("/dashboard");
          }}
        >
          Save today&apos;s check-in
        </button>
      </div>
    </>
  );
}
