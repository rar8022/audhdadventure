"use client";

import { useState } from "react";
import type { SupabaseBrowserClient } from "@/lib/supabase/client";
import { MAIN_ROLES, PHYS_STATS, STAT_MAX } from "@/lib/game/constants";
import type { Character, HistoryRecord } from "@/lib/game/types";
import { useAppStore } from "@/lib/store/useAppStore";

interface CheckinData {
  mainRole?: string;
  pools: { HP: number; SP: number; MP: number };
  physicalStats: Character["physicalStats"];
}

export default function HistoryEditForm({
  supabase,
  record,
  characterName,
}: {
  supabase: SupabaseBrowserClient;
  record: HistoryRecord;
  characterName: string;
}) {
  const characters = useAppStore((s) => s.characters);
  const saveHistoryEdit = useAppStore((s) => s.saveHistoryEdit);
  const cancelEditHistory = useAppStore((s) => s.cancelEditHistory);

  const d = record.data as unknown as CheckinData;
  const owner = characters[record.characterId];

  const [mainRole, setMainRole] = useState(d.mainRole || MAIN_ROLES[0]);
  const [hp, setHp] = useState(d.pools.HP);
  const [sp, setSp] = useState(d.pools.SP);
  const [mp, setMp] = useState(d.pools.MP);
  const [stats, setStats] = useState<Character["physicalStats"]>({ ...d.physicalStats });

  const hpMax = owner?.pools.HP.max ?? STAT_MAX * 20;
  const spMax = owner?.pools.SP.max ?? STAT_MAX * 20;
  const mpMax = owner?.pools.MP.max ?? STAT_MAX * 20;

  return (
    <div className="border-b border-border py-3 text-sm last:border-b-0">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="badge checkin">Editing {characterName}&apos;s check-in</span>
        <strong>{record.at}</strong>
      </div>
      <label className="mb-1 block text-sm font-medium text-ink">Main role</label>
      <select
        value={mainRole}
        onChange={(e) => setMainRole(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
      >
        {MAIN_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">HP</label>
          <input
            type="number"
            min={0}
            max={hpMax}
            value={hp}
            onChange={(e) => setHp(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">SP</label>
          <input
            type="number"
            min={0}
            max={spMax}
            value={sp}
            onChange={(e) => setSp(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">MP</label>
          <input
            type="number"
            min={0}
            max={mpMax}
            value={mp}
            onChange={(e) => setMp(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {PHYS_STATS.map((s) => (
          <div key={s.key}>
            <label className="mb-1 block text-xs font-medium text-ink">{s.label}</label>
            <input
              type="number"
              min={1}
              max={STAT_MAX}
              value={stats[s.key]}
              onChange={(e) => setStats({ ...stats, [s.key]: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="btn"
          onClick={() =>
            saveHistoryEdit(supabase, record.id, {
              mainRole,
              pools: { HP: hp, SP: sp, MP: mp },
              physicalStats: stats,
            })
          }
        >
          Save changes
        </button>
        <button className="btn ghost" onClick={() => cancelEditHistory()}>
          Cancel
        </button>
      </div>
    </div>
  );
}
