"use client";

import type { SupabaseBrowserClient } from "@/lib/supabase/client";
import { MAIN_ROLES } from "@/lib/game/constants";
import type { Character } from "@/lib/game/types";
import { useAppStore } from "@/lib/store/useAppStore";

export default function CharacterRow({
  supabase,
  character,
  isActive,
  canRemove,
}: {
  supabase: SupabaseBrowserClient;
  character: Character;
  isActive: boolean;
  canRemove: boolean;
}) {
  const confirmRemoveCharacterId = useAppStore((s) => s.confirmRemoveCharacterId);
  const requestRemoveCharacter = useAppStore((s) => s.requestRemoveCharacter);
  const cancelRemoveCharacter = useAppStore((s) => s.cancelRemoveCharacter);
  const confirmRemoveCharacter = useAppStore((s) => s.confirmRemoveCharacter);
  const renameCharacter = useAppStore((s) => s.renameCharacter);
  const setCharacterRole = useAppStore((s) => s.setCharacterRole);
  const switchCharacter = useAppStore((s) => s.switchCharacter);

  const confirming = confirmRemoveCharacterId === character.id;

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Name</label>
          <input
            type="text"
            defaultValue={character.name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== character.name) renameCharacter(supabase, character.id, v);
            }}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Main role</label>
          <select
            value={character.mainRole}
            onChange={(e) => setCharacterRole(supabase, character.id, e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            {MAIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isActive ? (
          <span className="badge checkin">Active</span>
        ) : (
          <button className="btn ghost small" onClick={() => switchCharacter(supabase, character.id)}>
            Switch to
          </button>
        )}
        {!canRemove ? (
          <span className="empty">Last character — can&apos;t remove</span>
        ) : confirming ? (
          <>
            <span className="text-xs" style={{ color: "var(--warn)" }}>
              Remove {character.name}?
            </span>
            <button
              className="btn ghost small"
              onClick={() => confirmRemoveCharacter(supabase, character.id)}
            >
              Yes, remove
            </button>
            <button className="btn ghost small" onClick={() => cancelRemoveCharacter()}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn ghost small" onClick={() => requestRemoveCharacter(character.id)}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
