import type { Database } from "@/lib/supabase/types";
import type { Account, Character, HistoryRecord, SwitchLogEntry } from "@/lib/game/types";

type CharacterRow = Database["public"]["Tables"]["characters"]["Row"];
type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type HistoryRow = Database["public"]["Tables"]["history"]["Row"];
type SwitchLogRow = Database["public"]["Tables"]["switch_log"]["Row"];

export function rowToCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    mainRole: row.main_role,
    mainRoleWhy: row.main_role_why,
    physicalStats: row.physical_stats as unknown as Character["physicalStats"],
    statXP: row.stat_xp as unknown as Character["statXP"],
    pools: row.pools as unknown as Character["pools"],
    daySettings: row.day_settings as unknown as Character["daySettings"],
    subRoles: row.sub_roles as unknown as Character["subRoles"],
    activeBuffs: row.active_buffs as unknown as Character["activeBuffs"],
    customBuffsDebuffs: row.custom_buffs_debuffs as unknown as Character["customBuffsDebuffs"],
    actionsSpells: row.actions_spells as unknown as Character["actionsSpells"],
    poolSpent: row.pool_spent as unknown as Character["poolSpent"],
    poolSpentDate: row.pool_spent_date,
    orderIndex: row.order_index,
  };
}

/**
 * Full-row payload for a Character — used for both inserts (after deleting
 * the placeholder `id` so Postgres generates one) and updates.
 */
export function characterToRow(character: Character): Database["public"]["Tables"]["characters"]["Row"] {
  return {
    id: character.id,
    account_id: character.accountId,
    name: character.name,
    main_role: character.mainRole,
    main_role_why: character.mainRoleWhy,
    physical_stats: character.physicalStats,
    stat_xp: character.statXP,
    pools: character.pools,
    day_settings: character.daySettings,
    sub_roles: character.subRoles,
    active_buffs: character.activeBuffs,
    custom_buffs_debuffs: character.customBuffsDebuffs,
    actions_spells: character.actionsSpells,
    pool_spent: character.poolSpent,
    pool_spent_date: character.poolSpentDate,
    order_index: character.orderIndex,
  };
}

export function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    mode: row.mode,
    partyName: row.party_name,
    activeCharacterId: row.active_character_id,
    showIntro: row.show_intro,
  };
}

export function rowToHistory(row: HistoryRow): HistoryRecord {
  return {
    id: row.id,
    accountId: row.account_id,
    characterId: row.character_id,
    type: row.type as HistoryRecord["type"],
    date: row.date,
    ts: new Date(row.ts).getTime(),
    at: new Date(row.ts).toLocaleString(),
    data: row.data as Record<string, unknown>,
    edited: row.edited,
    editedAt: row.edited_at,
  };
}

export function historyToRow(record: HistoryRecord): Database["public"]["Tables"]["history"]["Insert"] {
  return {
    id: record.id,
    account_id: record.accountId,
    character_id: record.characterId,
    type: record.type,
    date: record.date,
    ts: new Date(record.ts).toISOString(),
    data: record.data,
    edited: record.edited,
    edited_at: record.editedAt,
  };
}

export function rowToSwitchLog(row: SwitchLogRow): SwitchLogEntry {
  return { characterId: row.character_id, at: new Date(row.at).toLocaleString() };
}
