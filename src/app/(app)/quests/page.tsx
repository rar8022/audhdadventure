"use client";

import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { QUEST_PLACEHOLDERS } from "@/lib/game/constants";
import { questCompletedToday } from "@/lib/game/helpers";
import { todayStr } from "@/lib/game/pools";

export default function QuestsPage() {
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const history = useAppStore((s) => s.history);
  const completeQuest = useAppStore((s) => s.completeQuest);
  const toast = useAppStore((s) => s.toast);

  const c = account?.activeCharacterId ? characters[account.activeCharacterId] : null;
  if (!c) return null;

  const supabase = createClient();
  const today = todayStr();

  return (
    <>
      <div className="card">
        <h2 className="text-lg font-semibold">Suggested quests</h2>
        <p className="text-sm text-muted">
          A placeholder for {c.name}. Completions are tracked per party member and show up in
          History. A future version will generate personalized quests from stats, resource
          levels, buffs/debuffs, and history — and eventually quests taken on together with
          friends in a Party or Guild.
        </p>
      </div>

      <div className="card mt-4">
        {QUEST_PLACEHOLDERS.map((q) => {
          const doneToday = !q.locked && questCompletedToday(history, c.id, q.title, today);
          return (
            <div key={q.title} className="border-b border-border py-3 last:border-b-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip" style={{ background: "#ede6d6", color: "#7a6a4e" }}>
                  {q.tag}
                </span>
                {q.locked && <span className="badge edited">Coming soon</span>}
                {doneToday && <span className="badge growth">Done today</span>}
              </div>
              <div className="mt-1 font-medium">{q.title}</div>
              <div className="text-sm text-muted">{q.desc}</div>
              {!q.locked && (
                <div className="mt-2">
                  {doneToday ? (
                    <button className="btn ghost small" disabled>
                      Completed today
                    </button>
                  ) : (
                    <button
                      className="btn ghost small"
                      onClick={() => completeQuest(supabase, q.title, q.tag)}
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div className="mt-3">
          <button
            className="btn ghost small"
            onClick={() => toast("Quest generation is coming in a future version.")}
          >
            Generate new quests
          </button>
        </div>
      </div>
    </>
  );
}
