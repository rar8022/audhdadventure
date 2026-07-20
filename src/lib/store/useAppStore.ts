import { create } from "zustand";
import type { SupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Account,
  ActionSpell,
  Character,
  CustomBuffDebuff,
  HistoryRecord,
  Mask,
  StatKey,
  SwitchLogEntry,
} from "@/lib/game/types";
import {
  characterToRow,
  historyToRow,
  rowToAccount,
  rowToCharacter,
  rowToHistory,
  rowToSwitchLog,
} from "@/lib/store/mappers";
import { buildNewCharacter, resetCharacterToDefault } from "@/lib/game/newCharacter";
import { adjustedActionCost, computePoolCurrent, ensurePoolSpentFresh, todayStr } from "@/lib/game/pools";
import { applyGrowthXP } from "@/lib/game/growth";
import { combinedBuffCatalog } from "@/lib/game/helpers";
import { GROWTH_XP_PER_ADVENTURE, GROWTH_XP_PER_MAJOR_ADVENTURE, STAT_MAX } from "@/lib/game/constants";

type SB = SupabaseBrowserClient;

function newId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function cloneCharacter(c: Character): Character {
  return JSON.parse(JSON.stringify(c));
}

interface PendingReset {
  type: "today" | "period" | "all" | "member";
  characterId?: string;
  from?: string;
  to?: string;
}

interface UndoSnapshot {
  history: HistoryRecord[];
  characterId: string;
  physicalStats: Character["physicalStats"];
  statXP: Character["statXP"];
  activeBuffs: Character["activeBuffs"];
  poolSpent: Character["poolSpent"];
  poolSpentDate: Character["poolSpentDate"];
}

interface AppState {
  loading: boolean;
  userId: string | null;
  account: Account | null;
  characters: Record<string, Character>;
  characterOrder: string[];
  history: HistoryRecord[];
  switchLog: SwitchLogEntry[];

  // ephemeral UI state
  toastMessage: string | null;
  confirmRemoveCharacterId: string | null;
  editingRecordId: string | null;
  historyScope: "mine" | "party";
  growthRange: string;
  dashboardDate: string;
  resetTargetCharacterId: string | null;
  pendingReset: PendingReset | null;
  undoSnapshot: UndoSnapshot | null;

  hydrate: (supabase: SB, userId: string) => Promise<void>;
  toast: (msg: string) => void;

  activeChar: () => Character | null;

  saveDisplayName: (supabase: SB, name: string) => Promise<void>;
  setMode: (supabase: SB, mode: "solo" | "system") => Promise<void>;
  dismissIntro: (supabase: SB) => Promise<void>;

  addCharacterInline: (supabase: SB, name: string, role: string) => Promise<void>;
  requestRemoveCharacter: (id: string) => void;
  cancelRemoveCharacter: () => void;
  confirmRemoveCharacter: (supabase: SB, id: string) => Promise<void>;
  renameCharacter: (supabase: SB, id: string, name: string) => Promise<void>;
  setCharacterRole: (supabase: SB, id: string, role: string) => Promise<void>;
  switchCharacter: (supabase: SB, id: string) => Promise<void>;

  setMainRole: (supabase: SB, role: string) => Promise<void>;
  setMainRoleWhy: (supabase: SB, why: string) => Promise<void>;
  setDaySetting: (supabase: SB, field: string, value: number) => Promise<void>;

  addMask: (supabase: SB, mask: Omit<Mask, "id" | "active">) => Promise<void>;
  removeMask: (supabase: SB, id: string) => Promise<void>;
  setActiveMasks: (supabase: SB, ids: string[]) => Promise<void>;

  toggleBuff: (supabase: SB, key: string) => Promise<void>;
  addCustomBuffDebuff: (supabase: SB, item: Omit<CustomBuffDebuff, "id">) => Promise<void>;
  removeCustomBuffDebuff: (supabase: SB, id: string) => Promise<void>;

  addActionSpell: (supabase: SB, item: Omit<ActionSpell, "id">) => Promise<void>;
  removeActionSpell: (supabase: SB, id: string) => Promise<void>;
  useActionSpell: (supabase: SB, id: string) => Promise<void>;

  logCheckin: (supabase: SB) => Promise<void>;
  logGrowth: (
    supabase: SB,
    stat: StatKey,
    major: boolean,
    challenge: string,
    skill: string,
    journey: string
  ) => Promise<void>;
  completeQuest: (supabase: SB, title: string, tag: string) => Promise<void>;

  setGrowthRange: (range: string) => void;
  setHistoryScope: (scope: "mine" | "party") => void;
  setDashboardDate: (date: string) => void;
  resetDashboardDate: () => void;

  editHistoryRecord: (id: string) => void;
  cancelEditHistory: () => void;
  saveHistoryEdit: (supabase: SB, id: string, data: Record<string, unknown>) => Promise<void>;
  deleteHistoryRecord: (supabase: SB, id: string) => Promise<void>;
  undoLast: (supabase: SB) => Promise<void>;

  setResetTarget: (id: string) => void;
  requestReset: (type: PendingReset["type"], from?: string, to?: string) => void;
  cancelReset: () => void;
  confirmReset: (supabase: SB) => Promise<void>;
}

function recordSnapshot(get: () => AppState, characterId: string): UndoSnapshot | null {
  const c = get().characters[characterId];
  if (!c) return null;
  return {
    history: JSON.parse(JSON.stringify(get().history)),
    characterId,
    physicalStats: JSON.parse(JSON.stringify(c.physicalStats)),
    statXP: JSON.parse(JSON.stringify(c.statXP)),
    activeBuffs: JSON.parse(JSON.stringify(c.activeBuffs)),
    poolSpent: JSON.parse(JSON.stringify(c.poolSpent)),
    poolSpentDate: c.poolSpentDate,
  };
}

async function persistCharacter(supabase: SB, character: Character) {
  const { error } = await supabase
    .from("characters")
    .update(characterToRow(character))
    .eq("id", character.id);
  if (error) console.error("persistCharacter failed", error);
}

async function insertHistory(supabase: SB, record: HistoryRecord) {
  const { error } = await supabase.from("history").insert(historyToRow(record));
  if (error) console.error("insertHistory failed", error);
}

export const useAppStore = create<AppState>()((set, get) => ({
  loading: true,
  userId: null,
  account: null,
  characters: {},
  characterOrder: [],
  history: [],
  switchLog: [],

  toastMessage: null,
  confirmRemoveCharacterId: null,
  editingRecordId: null,
  historyScope: "mine",
  growthRange: "1m",
  dashboardDate: todayStr(),
  resetTargetCharacterId: null,
  pendingReset: null,
  undoSnapshot: null,

  toast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) set({ toastMessage: null });
    }, 2200);
  },

  activeChar: () => {
    const { account, characters } = get();
    if (!account?.activeCharacterId) return null;
    return characters[account.activeCharacterId] ?? null;
  },

  hydrate: async (supabase, userId) => {
    set({ loading: true, userId });

    const [{ data: accountRow }, { data: characterRows }, { data: historyRows }, { data: switchRows }] =
      await Promise.all([
        supabase.from("accounts").select("*").eq("id", userId).maybeSingle(),
        supabase.from("characters").select("*").eq("account_id", userId).order("order_index"),
        supabase.from("history").select("*").eq("account_id", userId).order("ts", { ascending: false }),
        supabase.from("switch_log").select("*").eq("account_id", userId).order("at", { ascending: false }),
      ]);

    const characters: Record<string, Character> = {};
    const characterOrder: string[] = [];
    (characterRows ?? []).forEach((row) => {
      const c = rowToCharacter(row);
      characters[c.id] = c;
      characterOrder.push(c.id);
    });

    set({
      account: accountRow ? rowToAccount(accountRow) : null,
      characters,
      characterOrder,
      history: (historyRows ?? []).map(rowToHistory),
      switchLog: (switchRows ?? []).map(rowToSwitchLog),
      loading: false,
    });
  },

  saveDisplayName: async (supabase, name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      get().toast("Name cannot be empty.");
      return;
    }
    const { account } = get();
    if (!account) return;
    if (account.mode === "system") {
      set({ account: { ...account, partyName: trimmed } });
      await supabase.from("accounts").update({ party_name: trimmed }).eq("id", account.id);
      get().toast("Party name saved.");
    } else {
      const c = get().activeChar();
      if (!c) return;
      const updated = { ...c, name: trimmed };
      set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
      await persistCharacter(supabase, updated);
      get().toast("Name saved.");
    }
  },

  setMode: async (supabase, mode) => {
    const { account } = get();
    if (!account) return;
    set({ account: { ...account, mode } });
    await supabase.from("accounts").update({ mode }).eq("id", account.id);
  },

  dismissIntro: async (supabase) => {
    const { account } = get();
    if (!account) return;
    set({ account: { ...account, showIntro: false } });
    await supabase.from("accounts").update({ show_intro: false }).eq("id", account.id);
  },

  addCharacterInline: async (supabase, name, role) => {
    const { account, characterOrder } = get();
    if (!account) return;
    const trimmed = name.trim();
    if (!trimmed) {
      get().toast("Give the new character a name first.");
      return;
    }
    const draft = buildNewCharacter(account.id, trimmed);
    draft.mainRole = role;
    draft.orderIndex = characterOrder.length;

    const insertRow = characterToRow({ ...draft, id: "" } as Character);
    delete (insertRow as { id?: string }).id;

    const { data, error } = await supabase
      .from("characters")
      .insert(insertRow)
      .select("*")
      .single();
    if (error || !data) {
      console.error(error);
      get().toast("Could not add character.");
      return;
    }
    const created = rowToCharacter(data);
    set((s) => ({
      characters: { ...s.characters, [created.id]: created },
      characterOrder: [...s.characterOrder, created.id],
    }));
    get().toast(`Added ${trimmed} to the party.`);
  },

  requestRemoveCharacter: (id) => set({ confirmRemoveCharacterId: id }),
  cancelRemoveCharacter: () => set({ confirmRemoveCharacterId: null }),

  confirmRemoveCharacter: async (supabase, id) => {
    const { characterOrder, account } = get();
    if (characterOrder.length <= 1) return;
    await supabase.from("characters").delete().eq("id", id);
    set((s) => {
      const characters = { ...s.characters };
      delete characters[id];
      const order = s.characterOrder.filter((cid) => cid !== id);
      return { characters, characterOrder: order, confirmRemoveCharacterId: null };
    });
    if (account?.activeCharacterId === id) {
      const nextId = get().characterOrder[0];
      if (nextId) {
        set({ account: { ...get().account!, activeCharacterId: nextId } });
        await supabase.from("accounts").update({ active_character_id: nextId }).eq("id", account.id);
      }
    }
  },

  renameCharacter: async (supabase, id, name) => {
    const c = get().characters[id];
    if (!c) return;
    const updated = { ...c, name };
    set((s) => ({ characters: { ...s.characters, [id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  setCharacterRole: async (supabase, id, role) => {
    const c = get().characters[id];
    if (!c) return;
    const updated = { ...c, mainRole: role };
    set((s) => ({ characters: { ...s.characters, [id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  switchCharacter: async (supabase, id) => {
    const { account } = get();
    if (!account || account.activeCharacterId === id) return;
    set({ account: { ...account, activeCharacterId: id } });
    await supabase.from("accounts").update({ active_character_id: id }).eq("id", account.id);
    const { error, data } = await supabase
      .from("switch_log")
      .insert({ account_id: account.id, character_id: id })
      .select("*")
      .single();
    if (!error && data) {
      set((s) => ({ switchLog: [rowToSwitchLog(data), ...s.switchLog] }));
    }
  },

  setMainRole: async (supabase, role) => {
    const c = get().activeChar();
    if (!c) return;
    const updated = { ...c, mainRole: role };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  setMainRoleWhy: async (supabase, why) => {
    const c = get().activeChar();
    if (!c) return;
    const updated = { ...c, mainRoleWhy: why };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  setDaySetting: async (supabase, field, value) => {
    const c = get().activeChar();
    if (!c) return;
    const updated = { ...c, daySettings: { ...c.daySettings, [field]: value } };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  addMask: async (supabase, mask) => {
    const c = get().activeChar();
    if (!c) return;
    const newMask: Mask = { id: newId("m"), active: true, ...mask };
    const updated = { ...c, subRoles: [...c.subRoles, newMask] };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  removeMask: async (supabase, id) => {
    const c = get().activeChar();
    if (!c) return;
    const updated = { ...c, subRoles: c.subRoles.filter((m) => m.id !== id) };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  setActiveMasks: async (supabase, ids) => {
    const c = get().activeChar();
    if (!c) return;
    const updated = {
      ...c,
      subRoles: c.subRoles.map((m) => ({ ...m, active: ids.includes(m.id) })),
    };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  toggleBuff: async (supabase, key) => {
    const c = get().activeChar();
    if (!c) return;
    const toggledItem = combinedBuffCatalog(c).find((x) => x.id === key);
    const turnedOn = !c.activeBuffs[key];
    const updated = { ...c, activeBuffs: { ...c.activeBuffs, [key]: turnedOn } };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);

    if (!toggledItem) return;
    const now = Date.now();
    const record: HistoryRecord = {
      id: newId("h"),
      accountId: c.accountId,
      characterId: c.id,
      type: "buff_toggle",
      date: todayStr(),
      ts: now,
      at: new Date(now).toLocaleString(),
      data: { key, label: toggledItem.label, polarity: toggledItem.polarity, turnedOn },
      edited: false,
      editedAt: null,
    };
    set((s) => ({ history: [record, ...s.history] }));
    await insertHistory(supabase, record);
  },

  addCustomBuffDebuff: async (supabase, item) => {
    const c = get().activeChar();
    if (!c) return;
    const newItem: CustomBuffDebuff = { id: newId("cb"), ...item };
    const updated = { ...c, customBuffsDebuffs: [...c.customBuffsDebuffs, newItem] };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  removeCustomBuffDebuff: async (supabase, id) => {
    const c = get().activeChar();
    if (!c) return;
    const activeBuffs = { ...c.activeBuffs };
    delete activeBuffs[id];
    const updated = {
      ...c,
      customBuffsDebuffs: c.customBuffsDebuffs.filter((x) => x.id !== id),
      activeBuffs,
    };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  addActionSpell: async (supabase, item) => {
    const c = get().activeChar();
    if (!c) return;
    const newItem: ActionSpell = { id: newId("as"), ...item };
    const updated = { ...c, actionsSpells: [...c.actionsSpells, newItem] };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
    get().toast(`Added "${item.label}" to ${c.name}'s actions & spells`);
  },

  removeActionSpell: async (supabase, id) => {
    const c = get().activeChar();
    if (!c) return;
    const updated = { ...c, actionsSpells: c.actionsSpells.filter((x) => x.id !== id) };
    set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
    await persistCharacter(supabase, updated);
  },

  useActionSpell: async (supabase, id) => {
    const c = cloneCharacter(get().activeChar()!);
    if (!c) return;
    const item = c.actionsSpells.find((x) => x.id === id);
    if (!item) return;
    const pool = item.kind === "spell" ? "MP" : "SP";
    const cost = adjustedActionCost(c, item.baseCost);

    const snapshot = recordSnapshot(get, c.id);

    ensurePoolSpentFresh(c);
    c.poolSpent[pool] = (c.poolSpent[pool] || 0) + cost;
    set((s) => ({ characters: { ...s.characters, [c.id]: c }, undoSnapshot: snapshot }));
    await persistCharacter(supabase, c);

    const now = Date.now();
    const record: HistoryRecord = {
      id: newId("h"),
      accountId: c.accountId,
      characterId: c.id,
      type: "action_spell_use",
      date: todayStr(),
      ts: now,
      at: new Date(now).toLocaleString(),
      data: { label: item.label, kind: item.kind, pool, baseCost: item.baseCost, cost },
      edited: false,
      editedAt: null,
    };
    set((s) => ({ history: [record, ...s.history] }));
    await insertHistory(supabase, record);
    get().toast(`${c.name} used "${item.label}" for ${cost} ${pool}`);
  },

  logCheckin: async (supabase) => {
    const c = get().activeChar();
    if (!c) return;
    const now = Date.now();
    const record: HistoryRecord = {
      id: newId("h"),
      accountId: c.accountId,
      characterId: c.id,
      type: "checkin",
      date: todayStr(),
      ts: now,
      at: new Date(now).toLocaleString(),
      data: {
        mainRole: c.mainRole,
        activeMasks: c.subRoles.filter((m) => m.active).map((m) => m.label),
        activeBuffsDebuffs: combinedBuffCatalog(c)
          .filter((x) => c.activeBuffs[x.id])
          .map((x) => x.label),
        pools: {
          HP: computePoolCurrent(c, "HP"),
          SP: computePoolCurrent(c, "SP"),
          MP: computePoolCurrent(c, "MP"),
        },
        physicalStats: { ...c.physicalStats },
      },
      edited: false,
      editedAt: null,
    };
    set((s) => ({ history: [record, ...s.history] }));
    await insertHistory(supabase, record);
    get().toast("Check-in saved for today");
  },

  logGrowth: async (supabase, stat, major, challenge, skill, journey) => {
    const c = cloneCharacter(get().activeChar()!);
    if (!c) return;
    const snapshot = recordSnapshot(get, c.id);
    const xpGain = major ? GROWTH_XP_PER_MAJOR_ADVENTURE : GROWTH_XP_PER_ADVENTURE;
    const result = applyGrowthXP(c, stat, xpGain);

    set((s) => ({ characters: { ...s.characters, [c.id]: c }, undoSnapshot: snapshot }));
    await persistCharacter(supabase, c);

    const now = Date.now();
    const record: HistoryRecord = {
      id: newId("h"),
      accountId: c.accountId,
      characterId: c.id,
      type: "growth",
      date: todayStr(),
      ts: now,
      at: new Date(now).toLocaleString(),
      data: {
        stat,
        major,
        xpGained: result.xpGained,
        leveledUp: result.leveledUp,
        pointsAfter: result.pointsAfter,
        xpAfter: result.xpAfter,
        xpNeededNext: result.xpNeededNext,
        challenge,
        skill,
        journey,
      },
      edited: false,
      editedAt: null,
    };
    set((s) => ({ history: [record, ...s.history] }));
    await insertHistory(supabase, record);

    if (result.leveledUp) {
      get().toast(`${c.name}'s ${stat} leveled up to ${result.pointsAfter}/${STAT_MAX}!`);
    } else {
      get().toast(`+${xpGain} XP logged toward ${c.name}'s ${stat} (${result.xpAfter}/${result.xpNeededNext} XP)`);
    }
  },

  completeQuest: async (supabase, title, tag) => {
    const c = get().activeChar();
    if (!c) return;
    const now = Date.now();
    const record: HistoryRecord = {
      id: newId("h"),
      accountId: c.accountId,
      characterId: c.id,
      type: "quest_complete",
      date: todayStr(),
      ts: now,
      at: new Date(now).toLocaleString(),
      data: { title, tag },
      edited: false,
      editedAt: null,
    };
    set((s) => ({ history: [record, ...s.history] }));
    await insertHistory(supabase, record);
    get().toast(`Quest marked complete for ${c.name}`);
  },

  setGrowthRange: (range) => set({ growthRange: range }),
  setHistoryScope: (scope) => set({ historyScope: scope }),
  setDashboardDate: (date) => set({ dashboardDate: date }),
  resetDashboardDate: () => set({ dashboardDate: todayStr() }),

  editHistoryRecord: (id) => set({ editingRecordId: id }),
  cancelEditHistory: () => set({ editingRecordId: null }),

  saveHistoryEdit: async (supabase, id, data) => {
    const record = get().history.find((r) => r.id === id);
    if (!record) return;
    const snapshot = recordSnapshot(get, record.characterId);
    const updated: HistoryRecord = {
      ...record,
      data: { ...record.data, ...data },
      edited: true,
      editedAt: new Date().toLocaleString(),
    };
    set((s) => ({
      history: s.history.map((r) => (r.id === id ? updated : r)),
      editingRecordId: null,
      undoSnapshot: snapshot,
    }));
    await supabase
      .from("history")
      .update({ data: updated.data, edited: true, edited_at: new Date().toISOString() })
      .eq("id", id);
    get().toast("Entry updated");
  },

  deleteHistoryRecord: async (supabase, id) => {
    const record = get().history.find((r) => r.id === id);
    const characterId = record?.characterId ?? get().activeChar()?.id;
    const snapshot = characterId ? recordSnapshot(get, characterId) : null;
    set((s) => ({
      history: s.history.filter((r) => r.id !== id),
      editingRecordId: s.editingRecordId === id ? null : s.editingRecordId,
      undoSnapshot: snapshot,
    }));
    await supabase.from("history").delete().eq("id", id);
    get().toast("Entry deleted");
  },

  undoLast: async (supabase) => {
    const snap = get().undoSnapshot;
    if (!snap) {
      get().toast("Nothing to undo");
      return;
    }
    const before = get().history;
    const restoredIds = new Set(snap.history.map((r) => r.id));
    const idsToDelete = before.filter((r) => !restoredIds.has(r.id)).map((r) => r.id);

    const c = get().characters[snap.characterId];
    if (c) {
      const updated: Character = {
        ...c,
        physicalStats: snap.physicalStats,
        statXP: snap.statXP,
        activeBuffs: snap.activeBuffs,
        poolSpent: snap.poolSpent,
        poolSpentDate: snap.poolSpentDate,
      };
      set((s) => ({ characters: { ...s.characters, [c.id]: updated } }));
      await persistCharacter(supabase, updated);
    }

    set({ history: snap.history, undoSnapshot: null, editingRecordId: null });
    if (idsToDelete.length) {
      await supabase.from("history").delete().in("id", idsToDelete);
    }
    get().toast("Last change undone");
  },

  setResetTarget: (id) => set({ resetTargetCharacterId: id, pendingReset: null }),

  requestReset: (type, from, to) => {
    const { account, characterOrder } = get();
    const characterId =
      account?.mode === "system"
        ? get().resetTargetCharacterId || account.activeCharacterId || characterOrder[0]
        : account?.activeCharacterId || characterOrder[0];
    set({ pendingReset: { type, characterId: characterId ?? undefined, from, to } });
  },
  cancelReset: () => set({ pendingReset: null }),

  confirmReset: async (supabase) => {
    const pending = get().pendingReset;
    if (!pending) return;
    const { account } = get();
    if (!account) return;

    if (pending.type === "today") {
      const target = get().characters[pending.characterId!];
      if (target) {
        const today = todayStr();
        const toDelete = get().history.filter((r) => r.characterId === target.id && r.date === today);
        set((s) => ({ history: s.history.filter((r) => !(r.characterId === target.id && r.date === today)) }));
        if (toDelete.length) {
          await supabase.from("history").delete().in("id", toDelete.map((r) => r.id));
        }
        const updated: Character = {
          ...target,
          activeBuffs: {},
          subRoles: target.subRoles.map((m) => ({ ...m, active: false })),
          poolSpent: { SP: 0, MP: 0 },
          poolSpentDate: null,
        };
        set((s) => ({ characters: { ...s.characters, [target.id]: updated } }));
        await persistCharacter(supabase, updated);
        get().toast(`Reset today's data for ${target.name}`);
      }
    } else if (pending.type === "period") {
      const target = get().characters[pending.characterId!];
      if (target && pending.from && pending.to) {
        const fromTs = new Date(`${pending.from}T00:00:00`).getTime();
        const toTs = new Date(`${pending.to}T23:59:59`).getTime();
        const toDelete = get().history.filter(
          (r) => r.characterId === target.id && r.ts >= fromTs && r.ts <= toTs
        );
        set((s) => ({
          history: s.history.filter((r) => !(r.characterId === target.id && r.ts >= fromTs && r.ts <= toTs)),
        }));
        if (toDelete.length) {
          await supabase.from("history").delete().in("id", toDelete.map((r) => r.id));
        }
        get().toast(`Reset ${target.name}'s data from ${pending.from} to ${pending.to}`);
      }
    } else if (pending.type === "all") {
      set({ history: [], switchLog: [] });
      await supabase.from("history").delete().eq("account_id", account.id);
      await supabase.from("switch_log").delete().eq("account_id", account.id);
      get().toast("Cleared history for the whole account");
    } else if (pending.type === "member") {
      const target = get().characters[pending.characterId!];
      if (target) {
        const name = target.name;
        resetCharacterToDefault(target);
        set((s) => ({
          characters: { ...s.characters, [target.id]: { ...target } },
          history: s.history.filter((r) => r.characterId !== target.id),
          switchLog: s.switchLog.filter((e) => e.characterId !== target.id),
        }));
        await persistCharacter(supabase, target);
        await supabase.from("history").delete().eq("character_id", target.id);
        await supabase.from("switch_log").delete().eq("character_id", target.id);
        get().toast(`Reset all data for ${name}`);
      }
    }

    set({ undoSnapshot: null, editingRecordId: null, pendingReset: null });
  },
}));
