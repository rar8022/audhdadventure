import { STAT_BASELINE } from "@/lib/game/constants";
import { syncPoolMaxes } from "@/lib/game/pools";
import type { Character } from "@/lib/game/types";

/**
 * Client-side mirror of the default row the `handle_new_auth_user` SQL
 * trigger inserts (supabase/migrations/0001_init.sql). Used when adding a
 * new party member after the account already exists.
 */
export function buildNewCharacter(accountId: string, name?: string): Omit<Character, "id"> {
  const now = new Date();
  const startHour = now.getHours();
  const startMinute = now.getMinutes();
  const endTotalMinutes = (startHour * 60 + startMinute + 16 * 60) % (24 * 60);

  const character: Omit<Character, "id"> = {
    accountId,
    name: name || "New character",
    mainRole: "Explorer",
    mainRoleWhy: "",
    physicalStats: {
      strength: STAT_BASELINE,
      endurance: STAT_BASELINE,
      coordination: STAT_BASELINE,
      memory: STAT_BASELINE,
      precision: STAT_BASELINE,
    },
    statXP: {
      strength: 0,
      endurance: 0,
      coordination: 0,
      memory: 0,
      precision: 0,
    },
    pools: {
      HP: { max: 100 },
      SP: { max: 100, floorFraction: 0.15 },
      MP: { max: 100, floorFraction: 0.25 },
    },
    daySettings: {
      startHour,
      startMinute,
      endHour: Math.floor(endTotalMinutes / 60),
      endMinute: endTotalMinutes % 60,
    },
    subRoles: [],
    activeBuffs: {},
    customBuffsDebuffs: [],
    actionsSpells: [],
    poolSpent: { SP: 0, MP: 0 },
    poolSpentDate: null,
    orderIndex: 0,
  };

  syncPoolMaxes(character as Character);
  return character;
}

/** Resets an existing character back to a blank slate, preserving id/name. */
export function resetCharacterToDefault(character: Character): void {
  const fresh = buildNewCharacter(character.accountId, character.name);
  character.mainRole = fresh.mainRole;
  character.mainRoleWhy = fresh.mainRoleWhy;
  character.physicalStats = fresh.physicalStats;
  character.statXP = fresh.statXP;
  character.pools = fresh.pools;
  character.daySettings = fresh.daySettings;
  character.subRoles = fresh.subRoles;
  character.activeBuffs = fresh.activeBuffs;
  character.customBuffsDebuffs = fresh.customBuffsDebuffs;
  character.actionsSpells = fresh.actionsSpells;
  character.poolSpent = fresh.poolSpent;
  character.poolSpentDate = fresh.poolSpentDate;
}
