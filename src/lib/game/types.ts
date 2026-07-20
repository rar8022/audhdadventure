export type StatKey =
  | "strength"
  | "endurance"
  | "coordination"
  | "memory"
  | "precision";

export type PoolType = "HP" | "SP" | "MP";

export type PhysicalStats = Record<StatKey, number>;
export type StatXP = Record<StatKey, number>;

export interface DaySettings {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface Pool {
  max: number;
  floorFraction?: number; // SP/MP only; HP loss is rate-derived, see pools.ts
}

export interface Pools {
  HP: Pool;
  SP: Pool;
  MP: Pool;
}

export interface Mask {
  id: string;
  label: string;
  environment: string;
  multiplier: number;
  decisionLoad: "Low" | "Moderate" | "High";
  active: boolean;
}

export type BuffPolarity = "buff" | "debuff";

export interface CustomBuffDebuff {
  id: string;
  label: string;
  category: string;
  polarity: BuffPolarity;
}

export type ActionSpellKind = "action" | "spell";

export interface ActionSpell {
  id: string;
  label: string;
  kind: ActionSpellKind;
  baseCost: number;
}

export interface PoolSpent {
  SP: number;
  MP: number;
}

export interface Character {
  id: string;
  accountId: string;
  name: string;
  mainRole: string;
  mainRoleWhy: string;
  physicalStats: PhysicalStats;
  statXP: StatXP;
  pools: Pools;
  daySettings: DaySettings;
  subRoles: Mask[];
  activeBuffs: Record<string, boolean>;
  customBuffsDebuffs: CustomBuffDebuff[];
  actionsSpells: ActionSpell[];
  poolSpent: PoolSpent;
  poolSpentDate: string | null;
  orderIndex: number;
}

export type HistoryType =
  | "login"
  | "checkin"
  | "growth"
  | "buff_toggle"
  | "quest_complete"
  | "action_spell_use";

export interface HistoryRecord {
  id: string;
  accountId: string;
  characterId: string;
  type: HistoryType;
  date: string; // YYYY-MM-DD
  ts: number; // epoch ms
  at: string; // display string
  data: Record<string, unknown>;
  edited: boolean;
  editedAt: string | null;
}

export interface SwitchLogEntry {
  characterId: string;
  at: string;
}

export interface Account {
  id: string;
  mode: "solo" | "system";
  partyName: string;
  activeCharacterId: string | null;
  showIntro: boolean;
}
