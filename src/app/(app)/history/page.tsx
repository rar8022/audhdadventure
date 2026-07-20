"use client";

import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import HistoryRow from "@/components/HistoryRow";
import HistoryEditForm from "@/components/HistoryEditForm";

export default function HistoryPage() {
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const history = useAppStore((s) => s.history);
  const historyScope = useAppStore((s) => s.historyScope);
  const setHistoryScope = useAppStore((s) => s.setHistoryScope);
  const editingRecordId = useAppStore((s) => s.editingRecordId);
  const editHistoryRecord = useAppStore((s) => s.editHistoryRecord);
  const deleteHistoryRecord = useAppStore((s) => s.deleteHistoryRecord);
  const undoLast = useAppStore((s) => s.undoLast);
  const undoSnapshot = useAppStore((s) => s.undoSnapshot);

  const c = account?.activeCharacterId ? characters[account.activeCharacterId] : null;
  if (!c || !account) return null;

  const supabase = createClient();
  const scope = account.mode === "system" ? historyScope : "mine";
  const records = (scope === "party" ? history.slice() : history.filter((r) => r.characterId === c.id)).sort(
    (a, b) => b.ts - a.ts
  );

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">History</h2>
      <p className="mb-3 text-sm text-muted">
        {scope === "party"
          ? "Every logged change across your whole party, with who it belongs to."
          : `Every logged change for ${c.name}.`}{" "}
        Edit or delete a check-in if something was off.
      </p>

      {account.mode === "system" && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              scope === "mine"
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-muted"
            }`}
            onClick={() => setHistoryScope("mine")}
          >
            {c.name} only
          </button>
          <button
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              scope === "party"
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-muted"
            }`}
            onClick={() => setHistoryScope("party")}
          >
            Whole party
          </button>
        </div>
      )}

      <div className="mb-3">
        <button
          className="btn ghost small"
          disabled={!undoSnapshot}
          onClick={() => undoLast(supabase)}
        >
          Undo last change
        </button>
      </div>

      {records.length ? (
        <div>
          {records.map((r) =>
            editingRecordId === r.id ? (
              <HistoryEditForm
                key={r.id}
                supabase={supabase}
                record={r}
                characterName={characters[r.characterId]?.name ?? "Unknown"}
              />
            ) : (
              <HistoryRow
                key={r.id}
                record={r}
                showCharacter={scope === "party"}
                characterName={characters[r.characterId]?.name}
                actions={
                  r.type === "checkin" ? (
                    <>
                      <button
                        className="btn ghost small"
                        onClick={() => editHistoryRecord(r.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn ghost small"
                        onClick={() => deleteHistoryRecord(supabase, r.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : undefined
                }
              />
            )
          )}
        </div>
      ) : (
        <p className="empty">
          No history yet. Check-ins, growth, buffs/debuffs, and quest completions will show up
          here.
        </p>
      )}
    </div>
  );
}
