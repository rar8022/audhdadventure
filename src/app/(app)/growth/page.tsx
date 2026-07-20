"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PHYS_STATS, STAT_MAX, GROWTH_XP_PER_ADVENTURE, GROWTH_XP_PER_MAJOR_ADVENTURE } from "@/lib/game/constants";
import { todayStr } from "@/lib/game/pools";
import XPBar from "@/components/XPBar";
import type { StatKey } from "@/lib/game/types";

interface GrowthData {
  stat: StatKey;
  major?: boolean;
  leveledUp: boolean;
  pointsAfter: number;
  xpGained: number;
  xpAfter: number;
  xpNeededNext: number | null;
  challenge: string;
  skill: string;
}

export default function GrowthPage() {
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const history = useAppStore((s) => s.history);
  const logGrowth = useAppStore((s) => s.logGrowth);

  const [challenge, setChallenge] = useState("");
  const [skill, setSkill] = useState("");
  const [journey, setJourney] = useState("");
  const [stat, setStat] = useState<StatKey>(PHYS_STATS[0].key);
  const [major, setMajor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const c = account?.activeCharacterId ? characters[account.activeCharacterId] : null;
  if (!c) return null;

  const supabase = createClient();
  const today = todayStr();

  const myGrowth = history
    .filter((r) => r.characterId === c.id && r.type === "growth")
    .sort((a, b) => b.ts - a.ts);
  const todaysApproved = myGrowth.filter((r) => r.date === today);

  const atMax = c.physicalStats[stat] >= STAT_MAX;
  const loggedToday = todaysApproved.some((r) => (r.data as unknown as GrowthData).stat === stat);
  const canSubmit =
    challenge.trim() && skill.trim() && journey.trim() && !atMax && !loggedToday && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    await logGrowth(supabase, stat, major, challenge.trim(), skill.trim(), journey.trim());
    setChallenge("");
    setSkill("");
    setJourney("");
    setMajor(false);
    setSubmitting(false);
  }

  return (
    <>
      <div className="card">
        <h2 className="text-lg font-semibold">Record of Adventure</h2>
        <p className="mb-3 text-sm text-muted">
          Every stat increase needs a documented reason. Each recorded adventure adds XP toward{" "}
          {c.name}&apos;s next point in that stat — the XP needed grows with every point already
          gained, and {STAT_MAX} is the maximum for now.
        </p>
        {PHYS_STATS.map((s) => (
          <XPBar key={s.key} character={c} statKey={s.key} label={s.label} />
        ))}
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Growth history</h3>
        {myGrowth.length ? (
          <div className="mt-2">
            {myGrowth.map((r) => {
              const d = r.data as unknown as GrowthData;
              const statLabel = PHYS_STATS.find((s) => s.key === d.stat);
              const headline = d.leveledUp
                ? `Leveled up ${statLabel?.label ?? d.stat} to ${d.pointsAfter}/${STAT_MAX}!`
                : `+${d.xpGained} XP toward ${statLabel?.label ?? d.stat} (${d.xpAfter}/${d.xpNeededNext} XP)`;
              return (
                <div key={r.id} className="border-b border-border py-3 text-sm last:border-b-0">
                  <div>
                    <strong>{headline}</strong>
                    {d.major && <span className="badge growth ml-1.5">Major</span>} · {r.date}
                  </div>
                  <div className="mt-0.5">{d.challenge}</div>
                  <div className="mt-0.5 text-xs text-muted">Helped by: {d.skill}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty mt-2">No growth logged yet.</p>
        )}
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Record new growth</h3>
        <label className="mb-1 mt-2 block text-sm font-medium text-ink">
          What specific challenge did you overcome today?
        </label>
        <textarea
          value={challenge}
          onChange={(e) => setChallenge(e.target.value)}
          placeholder="Wrote a full page with minimal corrections despite fatigue."
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <label className="mb-1 mt-3 block text-sm font-medium text-ink">
          What skill or resource helped you succeed?
        </label>
        <textarea
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Three weeks of daily handwriting practice."
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <label className="mb-1 mt-3 block text-sm font-medium text-ink">
          How does this connect to your larger journey?
        </label>
        <textarea
          value={journey}
          onChange={(e) => setJourney(e.target.value)}
          placeholder="Reduces how much I need to lean on accommodations for handwriting."
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Stat to grow</label>
            <select
              value={stat}
              onChange={(e) => setStat(e.target.value as StatKey)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {PHYS_STATS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">XP awarded</label>
            <label className="mt-2 flex items-center gap-2 text-sm font-normal text-ink">
              <input type="checkbox" checked={major} onChange={(e) => setMajor(e.target.checked)} />
              This was a major, documented recovery event (worth {GROWTH_XP_PER_MAJOR_ADVENTURE}{" "}
              XP instead of the usual {GROWTH_XP_PER_ADVENTURE})
            </label>
          </div>
        </div>
        {atMax && (
          <p className="mt-2 text-sm" style={{ color: "var(--warn)" }}>
            This stat is already at the {STAT_MAX} maximum for now.
          </p>
        )}
        {!atMax && loggedToday && (
          <p className="mt-2 text-sm" style={{ color: "var(--warn)" }}>
            Daily growth cap already reached for this stat. Try again tomorrow, or pick a
            different stat.
          </p>
        )}
        <div className="mt-3">
          <button className="btn" disabled={!canSubmit} onClick={handleSubmit}>
            Record growth
          </button>
        </div>
      </div>
    </>
  );
}
