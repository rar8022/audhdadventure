"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { PHYS_STATS, STAT_MAX, GROWTH_RANGES } from "@/lib/game/constants";
import {
  combinedBuffCatalog,
  findHistoricalCheckin,
  formatDateLong,
  growthPointsFor,
} from "@/lib/game/helpers";
import { adjustedActionCost, computePoolCurrent, todayStr } from "@/lib/game/pools";
import PoolBar from "@/components/PoolBar";
import StatBox from "@/components/StatBox";
import GrowthChart from "@/components/GrowthChart";
import HistoryRow from "@/components/HistoryRow";
import type { Character } from "@/lib/game/types";

export default function DashboardPage() {
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const history = useAppStore((s) => s.history);
  const switchLog = useAppStore((s) => s.switchLog);
  const activeChar = useAppStore((s) => s.activeChar);
  const dashboardDate = useAppStore((s) => s.dashboardDate);
  const setDashboardDate = useAppStore((s) => s.setDashboardDate);
  const resetDashboardDate = useAppStore((s) => s.resetDashboardDate);
  const growthRange = useAppStore((s) => s.growthRange);
  const setGrowthRange = useAppStore((s) => s.setGrowthRange);
  const dismissIntro = useAppStore((s) => s.dismissIntro);
  const useActionSpell = useAppStore((s) => s.useActionSpell);

  const c = activeChar();
  const isToday = dashboardDate === todayStr();

  if (!c || !account) return null;

  const dateBar = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label className="text-sm text-muted">Viewing date</label>
      <input
        type="date"
        value={dashboardDate}
        max={todayStr()}
        onChange={(e) => setDashboardDate(e.target.value)}
        className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
      />
      {!isToday && (
        <button className="btn ghost small" onClick={() => resetDashboardDate()}>
          Back to today
        </button>
      )}
    </div>
  );

  if (!isToday) {
    const record = findHistoricalCheckin(history, c.id, dashboardDate);
    const dateLabel = formatDateLong(dashboardDate);

    return (
      <>
        {dateBar}
        <div className="card">
          <h2 className="text-lg font-semibold">{c.name}</h2>
          <p className="mt-1 text-sm text-muted">
            Viewing a snapshot from <strong>{dateLabel}</strong>.{" "}
            <button className="btn ghost small" onClick={() => resetDashboardDate()}>
              Back to today
            </button>
          </p>
        </div>

        {!record ? (
          <div className="card mt-4">
            <p className="empty">
              No check-in was recorded for {c.name} on this date. Pick a different date, or do
              today&apos;s check-in from the Dashboard so future days like this one have data.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="card">
                <h3 className="font-semibold">Vital resources</h3>
                <p className="mb-2 text-sm text-muted">
                  As recorded at {record.at}
                  {record.edited ? " (edited since)" : ""}.
                </p>
                {(["HP", "SP", "MP"] as const).map((type) => (
                  <PoolBar
                    key={type}
                    type={type}
                    current={(record.data as { pools: Record<string, number> }).pools[type]}
                    max={c.pools[type].max}
                  />
                ))}
              </div>
              <div className="card">
                <h3 className="font-semibold">Physical stats</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PHYS_STATS.map((s) => (
                    <StatBox
                      key={s.key}
                      label={s.label}
                      value={
                        (record.data as { physicalStats: Character["physicalStats"] })
                          .physicalStats[s.key]
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="card">
                <h3 className="font-semibold">Masks that day</h3>
                {(record.data as { activeMasks?: string[] }).activeMasks?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(record.data as { activeMasks: string[] }).activeMasks.map((m) => (
                      <span key={m} className="chip mask">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty mt-2">No masks recorded as active that day.</p>
                )}
              </div>
              <div className="card">
                <h3 className="font-semibold">Buffs &amp; debuffs that day</h3>
                {(record.data as { activeBuffsDebuffs?: string[] }).activeBuffsDebuffs?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(record.data as { activeBuffsDebuffs: string[] }).activeBuffsDebuffs.map(
                      (b) => (
                        <span key={b} className="chip buff">
                          {b}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="empty mt-2">Nothing recorded that day.</p>
                )}
              </div>
            </div>
            <div className="card mt-4">
              <p className="text-sm text-muted">
                Main role that day: {(record.data as { mainRole?: string }).mainRole || "—"}
              </p>
              <div className="mt-2">
                <Link href="/history" className="btn secondary small">
                  Edit this entry in History
                </Link>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  const activeMasks = c.subRoles.filter((m) => m.active);
  const activeBuffKeys = Object.keys(c.activeBuffs).filter((k) => c.activeBuffs[k]);
  const catalog = combinedBuffCatalog(c);
  const dashActionItems = c.actionsSpells.filter((x) => x.kind === "action");
  const dashSpellItems = c.actionsSpells.filter((x) => x.kind === "spell");
  const points = growthPointsFor(history, c.id, growthRange);

  const recentSwitches = switchLog.slice(0, 4);
  const recentParty = history.filter((r) => r.type !== "login").slice(0, 6);

  const supabase = createClient();

  function actionSpellButton(x: (typeof c.actionsSpells)[number]) {
    const pool = x.kind === "spell" ? "MP" : "SP";
    const cost = adjustedActionCost(c!, x.baseCost);
    const costLabel = cost !== x.baseCost ? `${cost} ${pool} (base ${x.baseCost})` : `${cost} ${pool}`;
    return (
      <button
        key={x.id}
        className="btn ghost small mb-2 mr-2"
        onClick={() => useActionSpell(supabase, x.id)}
      >
        {x.label} · {costLabel}
      </button>
    );
  }

  return (
    <>
      {dateBar}
      {account.showIntro && (
        <div className="card mb-4 flex items-start justify-between gap-3 bg-accent-bg">
          <p className="text-sm text-ink">
            <strong>Welcome, traveler.</strong> Manage masks and day rhythm in Settings, and see
            how the framework feels as an app.
          </p>
          <button
            className="text-lg leading-none text-muted"
            onClick={() => dismissIntro(supabase)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">{c.name}</h2>
          <p className="text-sm text-muted">Main role: {c.mainRole}</p>
          <p className="mb-3 text-sm text-muted">
            Depletes automatically across the day, based on {c.name}&apos;s day rhythm.{" "}
            <Link href="/settings" className="btn ghost small">
              Adjust in Settings
            </Link>
          </p>
          <PoolBar type="HP" current={computePoolCurrent(c, "HP")} max={c.pools.HP.max} />
          <PoolBar type="SP" current={computePoolCurrent(c, "SP")} max={c.pools.SP.max} />
          <PoolBar type="MP" current={computePoolCurrent(c, "MP")} max={c.pools.MP.max} />
        </div>
        <div className="card">
          <h3 className="font-semibold">Physical stats</h3>
          <p className="mb-2 text-sm text-muted">
            Set automatically during onboarding in a future version. For now these only change
            through the Growth log.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PHYS_STATS.map((s) => (
              <StatBox key={s.key} label={s.label} value={c.physicalStats[s.key]} />
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Today&apos;s check-in</h3>
        <p className="mb-2 text-sm text-muted">
          A quick journal entry for today — the role you&apos;re wearing, and what&apos;s active
          around you right now.
        </p>
        <Link href="/checkin" className="btn">
          Do today&apos;s check-in
        </Link>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Use an action or spell</h3>
        <p className="mb-2 text-sm text-muted">
          Spend extra Stamina or Mana on something specific right now — separate from {c.name}
          &apos;s check-in. Cost adjusts for active masks.{" "}
          <Link href="/settings" className="btn ghost small">
            Add more in Settings
          </Link>
        </p>
        <h4 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Actions (Stamina)
        </h4>
        {dashActionItems.length ? (
          <div>{dashActionItems.map(actionSpellButton)}</div>
        ) : (
          <p className="empty">No actions yet — add some in Settings.</p>
        )}
        <h4 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Spells (Mana)
        </h4>
        {dashSpellItems.length ? (
          <div>{dashSpellItems.map(actionSpellButton)}</div>
        ) : (
          <p className="empty">No spells yet — add some in Settings.</p>
        )}
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold">Growth over time</h3>
        <p className="mb-2 text-sm text-muted">
          Physical stat total (out of {PHYS_STATS.length * STAT_MAX}) across {c.name}&apos;s
          check-in history.
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {GROWTH_RANGES.map((r) => (
            <button
              key={r.key}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                growthRange === r.key
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted"
              }`}
              onClick={() => setGrowthRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <GrowthChart points={points} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">Today&apos;s masks</h3>
          {activeMasks.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeMasks.map((m) => (
                <span key={m.id} className="chip mask">
                  {m.label} · {m.multiplier}x
                </span>
              ))}
            </div>
          ) : (
            <p className="empty mt-2">
              No masks marked active today. Manage masks in Settings, then pick today&apos;s
              during check-in.
            </p>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold">Active buffs &amp; debuffs</h3>
          {activeBuffKeys.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeBuffKeys.map((k) => {
                const item = catalog.find((x) => x.id === k);
                if (!item) return null;
                return (
                  <span key={k} className={`chip ${item.polarity}`}>
                    {item.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="empty mt-2">Nothing logged yet. Visit the Buffs &amp; debuffs tab.</p>
          )}
        </div>
      </div>

      {account.mode === "system" && (
        <>
          <div className="card mt-4">
            <h3 className="font-semibold">Recent fronting</h3>
            {recentSwitches.length ? (
              <div className="mt-2">
                {recentSwitches.map((e, i) => {
                  const ch = characters[e.characterId];
                  return (
                    <div key={i} className="border-b border-border py-2 text-sm last:border-b-0">
                      <strong>{ch ? ch.name : "Unknown"}</strong> came to front
                      <div className="text-xs text-muted">{e.at}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty mt-2">No switches logged yet.</p>
            )}
          </div>

          <div className="card mt-4">
            <h3 className="font-semibold">Recent party activity</h3>
            <p className="mb-2 text-sm text-muted">
              Stat growth, buffs/debuffs, quest completions, and check-ins across your whole
              party, attributed to whoever made the change.
            </p>
            {recentParty.length ? (
              <div>
                {recentParty.map((r) => (
                  <HistoryRow
                    key={r.id}
                    record={r}
                    showCharacter
                    characterName={characters[r.characterId]?.name}
                  />
                ))}
              </div>
            ) : (
              <p className="empty">No party activity yet.</p>
            )}
            <div className="mt-3">
              <Link href="/history" className="btn ghost small">
                View full history
              </Link>
            </div>
          </div>
        </>
      )}

      <div className="card mt-4">
        <h3 className="font-semibold">Quick actions</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/quests" className="btn secondary">
            Suggested quests
          </Link>
          <Link href="/growth" className="btn secondary">
            Record of Adventure
          </Link>
          <Link href="/buffs" className="btn ghost">
            Update buffs / debuffs
          </Link>
        </div>
      </div>
    </>
  );
}
