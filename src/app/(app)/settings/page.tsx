"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  ACTION_SPELL_COSTS,
  BUFF_CATEGORIES,
  HP_HOURLY_LOSS_RATE,
  MAIN_ROLES,
} from "@/lib/game/constants";
import { adjustedActionCost, todayStr } from "@/lib/game/pools";
import { formatDateLong, pad2 } from "@/lib/game/helpers";
import type { ActionSpellKind, BuffPolarity, Character } from "@/lib/game/types";
import CharacterRow from "@/components/CharacterRow";

type SB = SupabaseClient<Database>;

function HourMinuteSelect({
  supabase,
  hourField,
  minuteField,
  hourVal,
  minuteVal,
}: {
  supabase: SB;
  hourField: string;
  minuteField: string;
  hourVal: number;
  minuteVal: number;
}) {
  const setDaySetting = useAppStore((s) => s.setDaySetting);
  const minuteChoices = [0, 15, 30, 45];
  return (
    <div className="flex items-center gap-2">
      <select
        value={hourVal}
        onChange={(e) => setDaySetting(supabase, hourField, Number(e.target.value))}
        className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {pad2(h)}
          </option>
        ))}
      </select>
      <span>:</span>
      <select
        value={minuteVal}
        onChange={(e) => setDaySetting(supabase, minuteField, Number(e.target.value))}
        className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
      >
        {minuteChoices.map((m) => (
          <option key={m} value={m}>
            {pad2(m)}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted">24-hour clock</span>
    </div>
  );
}

function MasksCard({ supabase, c }: { supabase: SB; c: Character }) {
  const addMask = useAppStore((s) => s.addMask);
  const removeMask = useAppStore((s) => s.removeMask);
  const [label, setLabel] = useState("");
  const [environment, setEnvironment] = useState("");
  const [decisionLoad, setDecisionLoad] = useState<"Low" | "Moderate" | "High">("Moderate");
  const [multiplier, setMultiplier] = useState(1.5);

  return (
    <div className="card mt-4">
      <h3 className="font-semibold">Manage masks</h3>
      <p className="mb-2 text-sm text-muted">
        Define the masks (sub-roles) available to {c.name}. Choose which ones apply on any given
        day during check-in.
      </p>
      {c.subRoles.length ? (
        <div>
          {c.subRoles.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
            >
              <div>
                <strong>{m.label}</strong>
                <div className="text-xs text-muted">
                  {m.environment} · {m.multiplier}x · {m.decisionLoad} decision load
                </div>
              </div>
              <button className="btn ghost small" onClick={() => removeMask(supabase, m.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">No masks yet — add {c.name}&apos;s first one below.</p>
      )}
      <hr className="my-4 border-border" />
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Add a mask</h4>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Mask name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Professional mask"
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Environment</label>
          <input
            type="text"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="Open office"
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Decision load</label>
          <select
            value={decisionLoad}
            onChange={(e) => setDecisionLoad(e.target.value as "Low" | "Moderate" | "High")}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
        </div>
      </div>
      <label className="mb-1 mt-3 block text-xs font-medium text-ink">
        Mana cost multiplier: {multiplier.toFixed(2).replace(/\.?0+$/, "")}x
      </label>
      <input
        type="range"
        min={0.5}
        max={4}
        step={0.25}
        value={multiplier}
        onChange={(e) => setMultiplier(Number(e.target.value))}
        className="w-full"
      />
      <div className="mt-3">
        <button
          className="btn"
          onClick={() => {
            if (!label.trim()) return;
            addMask(supabase, {
              label: label.trim(),
              environment: environment.trim(),
              decisionLoad,
              multiplier,
            });
            setLabel("");
            setEnvironment("");
            setDecisionLoad("Moderate");
            setMultiplier(1.5);
          }}
        >
          Add mask
        </button>
      </div>
    </div>
  );
}

function BuffsManageCard({ supabase, c }: { supabase: SB; c: Character }) {
  const addCustomBuffDebuff = useAppStore((s) => s.addCustomBuffDebuff);
  const removeCustomBuffDebuff = useAppStore((s) => s.removeCustomBuffDebuff);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<string>(BUFF_CATEGORIES[0]);
  const [polarity, setPolarity] = useState<BuffPolarity>("buff");

  return (
    <div className="card mt-4">
      <h3 className="font-semibold">Manage buffs &amp; debuffs</h3>
      <p className="mb-2 text-sm text-muted">
        The built-in catalog is always available on the Buffs &amp; debuffs tab. Anything{" "}
        {c.name} adds here shows up alongside it.
      </p>
      {c.customBuffsDebuffs.length ? (
        <div>
          {c.customBuffsDebuffs.map((x) => (
            <div
              key={x.id}
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
            >
              <div>
                <span className={`chip ${x.polarity} mr-2`}>
                  {x.polarity === "buff" ? "Buff" : "Debuff"}
                </span>
                <strong>{x.label}</strong>
                <div className="text-xs text-muted">{x.category}</div>
              </div>
              <button
                className="btn ghost small"
                onClick={() => removeCustomBuffDebuff(supabase, x.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">No custom buffs or debuffs yet.</p>
      )}
      <hr className="my-4 border-border" />
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Add a buff or debuff
      </h4>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Special interest deep-dive"
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            {BUFF_CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Type</label>
          <select
            value={polarity}
            onChange={(e) => setPolarity(e.target.value as BuffPolarity)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            <option value="buff">Buff (helps)</option>
            <option value="debuff">Debuff (drains)</option>
          </select>
        </div>
      </div>
      <div className="mt-3">
        <button
          className="btn"
          onClick={() => {
            if (!label.trim()) return;
            addCustomBuffDebuff(supabase, { label: label.trim(), category, polarity });
            setLabel("");
            setCategory(BUFF_CATEGORIES[0]);
            setPolarity("buff");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ActionsSpellsCard({ supabase, c }: { supabase: SB; c: Character }) {
  const addActionSpell = useAppStore((s) => s.addActionSpell);
  const removeActionSpell = useAppStore((s) => s.removeActionSpell);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<ActionSpellKind>("action");
  const [baseCost, setBaseCost] = useState<number>(5);

  const actionItems = c.actionsSpells.filter((x) => x.kind === "action");
  const spellItems = c.actionsSpells.filter((x) => x.kind === "spell");

  function row(x: (typeof c.actionsSpells)[number]) {
    const previewCost = adjustedActionCost(c, x.baseCost);
    const poolLabelText = x.kind === "spell" ? "MP" : "SP";
    const costNote =
      previewCost !== x.baseCost
        ? `${x.baseCost} base · ${previewCost} ${poolLabelText} with current masks`
        : `${x.baseCost} ${poolLabelText}`;
    return (
      <div
        key={x.id}
        className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
      >
        <div>
          <strong>{x.label}</strong>
          <div className="text-xs text-muted">{costNote}</div>
        </div>
        <button className="btn ghost small" onClick={() => removeActionSpell(supabase, x.id)}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="card mt-4">
      <h3 className="font-semibold">Actions &amp; Spells</h3>
      <p className="mb-2 text-sm text-muted">
        Create named ways {c.name} can spend extra Stamina or Mana on demand — separate from the
        steady drain across the day. Cost shown adjusts automatically for whichever masks are
        marked active right now.
      </p>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Actions (Stamina)
      </h4>
      {actionItems.length ? actionItems.map(row) : <p className="empty">No actions yet.</p>}
      <h4 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Spells (Mana)
      </h4>
      {spellItems.length ? spellItems.map(row) : <p className="empty">No spells yet.</p>}
      <hr className="my-4 border-border" />
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Add an action or spell
      </h4>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Generate a work presentation"
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Type</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ActionSpellKind)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            <option value="action">Action (Stamina)</option>
            <option value="spell">Spell (Mana)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink">Base cost</label>
          <select
            value={baseCost}
            onChange={(e) => setBaseCost(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            {ACTION_SPELL_COSTS.map((n) => (
              <option key={n} value={n}>
                {n} point{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <button
          className="btn"
          onClick={() => {
            if (!label.trim()) return;
            addActionSpell(supabase, { label: label.trim(), kind, baseCost });
            setLabel("");
            setKind("action");
            setBaseCost(5);
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ResetCard({ supabase, c }: { supabase: SB; c: Character }) {
  const account = useAppStore((s) => s.account)!;
  const characters = useAppStore((s) => s.characters);
  const characterOrder = useAppStore((s) => s.characterOrder);
  const resetTargetCharacterId = useAppStore((s) => s.resetTargetCharacterId);
  const setResetTarget = useAppStore((s) => s.setResetTarget);
  const pendingReset = useAppStore((s) => s.pendingReset);
  const requestReset = useAppStore((s) => s.requestReset);
  const cancelReset = useAppStore((s) => s.cancelReset);
  const confirmReset = useAppStore((s) => s.confirmReset);

  const [from, setFrom] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(todayStr());

  const resetTargetId =
    account.mode === "system" ? resetTargetCharacterId || account.activeCharacterId : c.id;
  const resetTargetChar = (resetTargetId && characters[resetTargetId]) || c;

  const todayConfirming = pendingReset?.type === "today" && pendingReset.characterId === resetTargetChar.id;
  const periodConfirming = pendingReset?.type === "period" && pendingReset.characterId === resetTargetChar.id;
  const allConfirming = pendingReset?.type === "all";
  const memberConfirming = pendingReset?.type === "member" && pendingReset.characterId === resetTargetChar.id;

  return (
    <div className="card mt-4">
      <h3 className="font-semibold">Reset data</h3>
      <p className="mb-3 text-sm text-muted">
        Clear logged history, or start a party member over completely. These reset actions are
        separate from the History tab&apos;s single-step undo and can&apos;t be undone once
        confirmed.
      </p>

      {account.mode === "system" && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-ink">Party member</label>
          <select
            value={resetTargetId ?? ""}
            onChange={(e) => setResetTarget(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            {characterOrder.map((id) => (
              <option key={id} value={id}>
                {characters[id]?.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            The &quot;today&quot; and &quot;period&quot; resets below apply to whichever member is
            selected here.
          </p>
        </div>
      )}

      <div className="border-b border-border py-3">
        <strong>Reset today&apos;s data</strong>
        <div className="text-xs text-muted">
          Clears {resetTargetChar.name}&apos;s history entries logged today, and resets
          today&apos;s active masks, active buffs/debuffs, and any extra Stamina/Mana spent
          today. Physical stats and your mask/buff/Action/Spell definitions stay as configured.
        </div>
        {todayConfirming ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs" style={{ color: "var(--warn)" }}>
              Reset today&apos;s data for {resetTargetChar.name}?
            </span>
            <button className="btn ghost small" onClick={() => confirmReset(supabase)}>
              Yes, reset today
            </button>
            <button className="btn ghost small" onClick={() => cancelReset()}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <button className="btn ghost small" onClick={() => requestReset("today")}>
              Reset today&apos;s data
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-border py-3">
        <strong>Reset a period of time</strong>
        <div className="text-xs text-muted">
          Clears {resetTargetChar.name}&apos;s history entries between two dates (inclusive).
          Nothing outside the range is touched.
        </div>
        {periodConfirming ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs" style={{ color: "var(--warn)" }}>
              Reset {resetTargetChar.name}&apos;s entries from {formatDateLong(pendingReset!.from!)}{" "}
              to {formatDateLong(pendingReset!.to!)}?
            </span>
            <button className="btn ghost small" onClick={() => confirmReset(supabase)}>
              Yes, reset this period
            </button>
            <button className="btn ghost small" onClick={() => cancelReset()}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-2">
              <button
                className="btn ghost small"
                onClick={() => requestReset("period", from, to)}
              >
                Reset this period
              </button>
            </div>
          </>
        )}
      </div>

      <div className="border-b border-border py-3">
        <strong>Reset entire account&apos;s history</strong>
        <div className="text-xs text-muted">
          Clears the full History log and Switch Log for every character on this account.
          Physical stats, roles, masks, buffs, and Actions &amp; Spells for each character stay
          as configured.
        </div>
        {allConfirming ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs" style={{ color: "var(--warn)" }}>
              This clears history for the whole account. Are you sure?
            </span>
            <button className="btn ghost small" onClick={() => confirmReset(supabase)}>
              Yes, clear all history
            </button>
            <button className="btn ghost small" onClick={() => cancelReset()}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <button className="btn ghost small" onClick={() => requestReset("all")}>
              Reset entire account&apos;s history
            </button>
          </div>
        )}
      </div>

      {account.mode === "system" && (
        <div className="border-l-4 py-3 pl-3" style={{ borderColor: "var(--warn)" }}>
          <strong>Reset all data for this party member</strong>
          <div className="text-xs text-muted">
            Wipes everything for {resetTargetChar.name} — physical stats, pools, masks,
            buffs/debuffs, Actions &amp; Spells, and their entire history — back to a blank
            slate. Other party members are untouched.
          </div>
          {memberConfirming ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs" style={{ color: "var(--warn)" }}>
                Reset everything for {resetTargetChar.name}?
              </span>
              <button className="btn ghost small" onClick={() => confirmReset(supabase)}>
                Yes, reset {resetTargetChar.name}
              </button>
              <button className="btn ghost small" onClick={() => cancelReset()}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <button className="btn ghost small" onClick={() => requestReset("member")}>
                Reset all data for {resetTargetChar.name}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const account = useAppStore((s) => s.account);
  const characters = useAppStore((s) => s.characters);
  const characterOrder = useAppStore((s) => s.characterOrder);
  const saveDisplayName = useAppStore((s) => s.saveDisplayName);
  const setMode = useAppStore((s) => s.setMode);
  const addCharacterInline = useAppStore((s) => s.addCharacterInline);

  const [nameField, setNameField] = useState("");
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState<string>(MAIN_ROLES[0]);

  const c = account?.activeCharacterId ? characters[account.activeCharacterId] : null;
  const nameFieldValue = account ? (account.mode === "system" ? account.partyName : c?.name ?? "") : "";

  useEffect(() => {
    setNameField(nameFieldValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFieldValue]);

  if (!c || !account) return null;

  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  function handleExport() {
    const snapshot = useAppStore.getState();
    const data = JSON.stringify(
      { account: snapshot.account, characters: snapshot.characters, history: snapshot.history, switchLog: snapshot.switchLog },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audhd-adventure-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="card">
        <h3 className="font-semibold">Account</h3>
        <p className="mb-2 text-sm text-muted">
          Signed in via Supabase Auth (Discord or guest).
        </p>
        <button className="btn secondary" onClick={handleSignOut}>
          Sign out
        </button>
      </div>

      <div className="card mt-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <label className="mb-1 mt-2 block text-sm font-medium text-ink">
          {account.mode === "system" ? "Party name" : "Display name"}
        </label>
        <div className="flex items-start gap-2">
          <input
            type="text"
            value={nameField}
            onChange={(e) => setNameField(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <button className="btn" onClick={() => saveDisplayName(supabase, nameField)}>
            Save name
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">
          {account.mode === "system"
            ? "The name for this account or collective as a whole. It doesn't need to match any individual character's name."
            : "The name for the person using this account."}
        </p>

        <hr className="my-4 border-border" />
        <h3 className="font-semibold">Mode</h3>
        <p className="mb-2 text-sm text-muted">
          Solo mode is one character throughout your day. System / party mode supports multiple
          characters (headmates, alters, parts) sharing one account, with fronting tracked over
          time.
        </p>
        <label className="mb-1.5 flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={account.mode === "solo"}
            onChange={() => setMode(supabase, "solo")}
          />
          Solo character
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={account.mode === "system"}
            onChange={() => setMode(supabase, "system")}
          />
          Party / system
        </label>
      </div>

      {account.mode === "system" && (
        <div className="card mt-4">
          <h3 className="font-semibold">Characters in this system</h3>
          <p className="mb-2 text-sm text-muted">
            Add, rename, or change the main role for anyone in your party right here.
          </p>
          <div>
            {characterOrder.map((id) => {
              const ch = characters[id];
              if (!ch) return null;
              return (
                <CharacterRow
                  key={id}
                  supabase={supabase}
                  character={ch}
                  isActive={id === account.activeCharacterId}
                  canRemove={characterOrder.length > 1}
                />
              );
            })}
          </div>
          <hr className="my-4 border-border" />
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Add a character
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Name</label>
              <input
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder="Alternative"
                className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Main role</label>
              <select
                value={newCharRole}
                onChange={(e) => setNewCharRole(e.target.value)}
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
          <div className="mt-3">
            <button
              className="btn"
              onClick={() => {
                if (!newCharName.trim()) return;
                addCharacterInline(supabase, newCharName.trim(), newCharRole);
                setNewCharName("");
                setNewCharRole(MAIN_ROLES[0]);
              }}
            >
              Add character
            </button>
          </div>
        </div>
      )}

      <div className="card mt-4">
        <h3 className="font-semibold">Day rhythm</h3>
        <p className="mb-3 text-sm text-muted">
          Health drains at a steady 12% of {c.name}&apos;s max HP per day (currently{" "}
          {(c.pools.HP.max * HP_HOURLY_LOSS_RATE).toFixed(1)} points/hour, out of {c.pools.HP.max}{" "}
          max) once the day starts. Stamina and Mana taper down toward a daily low by end of day.
          Everything resets at the next start time. Set on a 24-hour clock.
        </p>
        <p className="mb-2 text-xs text-muted">
          Start of day — set this to around when {c.name} naturally wakes up. That&apos;s the
          moment resources count as full.
        </p>
        <label className="mb-1 block text-sm font-medium text-ink">Start of day</label>
        <HourMinuteSelect
          supabase={supabase}
          hourField="startHour"
          minuteField="startMinute"
          hourVal={c.daySettings.startHour}
          minuteVal={c.daySettings.startMinute}
        />
        <label className="mb-1 mt-3 block text-sm font-medium text-ink">End of day</label>
        <HourMinuteSelect
          supabase={supabase}
          hourField="endHour"
          minuteField="endMinute"
          hourVal={c.daySettings.endHour}
          minuteVal={c.daySettings.endMinute}
        />
      </div>

      <MasksCard supabase={supabase} c={c} />
      <BuffsManageCard supabase={supabase} c={c} />
      <ActionsSpellsCard supabase={supabase} c={c} />

      <div className="card mt-4">
        <h3 className="font-semibold">Your data</h3>
        <p className="mb-2 text-sm text-muted">
          Export a snapshot of your account, characters, and history as a JSON file any time.
        </p>
        <button className="btn secondary" onClick={handleExport}>
          Export data as JSON
        </button>
      </div>

      <ResetCard supabase={supabase} c={c} />

      <div className="card mt-4">
        <p className="text-sm text-muted">
          This framework is exploratory, not a diagnostic tool or substitute for professional
          support. Use it as a lens for self-understanding, not a replacement for medical or
          therapeutic care when needed.
        </p>
      </div>
    </>
  );
}
