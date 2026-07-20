import {
  HP_HOURLY_LOSS_RATE,
  PHYS_STATS,
  POOL_POINTS_PER_STAT_POINT,
} from "@/lib/game/constants";
import type { Character, PoolType } from "@/lib/game/types";

export function statSum(stats: Character["physicalStats"]): number {
  return PHYS_STATS.reduce((sum, s) => sum + stats[s.key], 0);
}

export function computePoolMax(character: Pick<Character, "physicalStats">): number {
  const avgStat = statSum(character.physicalStats) / PHYS_STATS.length;
  return Math.round(avgStat * POOL_POINTS_PER_STAT_POINT);
}

/** Mutates character.pools[HP|SP|MP].max in place to match current stats. */
export function syncPoolMaxes(character: Character): void {
  const max = computePoolMax(character);
  character.pools.HP.max = max;
  character.pools.SP.max = max;
  character.pools.MP.max = max;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resets poolSpent back to {SP:0, MP:0} if the calendar day has rolled over. */
export function ensurePoolSpentFresh(character: Character): void {
  const today = todayStr();
  if (character.poolSpentDate !== today) {
    character.poolSpent = { SP: 0, MP: 0 };
    character.poolSpentDate = today;
  }
}

function dayBoundary(now: Date, hour: number, minute: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
}

/**
 * Computes the current value of a pool given the character's day-rhythm
 * settings and (for SP/MP) how much extra has been spent today via
 * Actions & Spells. HP drains at a fixed 12%-of-max-per-day rate; SP/MP
 * taper linearly toward a floor fraction across the day window.
 */
export function computePoolCurrent(character: Character, type: PoolType): number {
  const pool = character.pools[type];
  const ds = character.daySettings;
  const now = new Date();
  const start = dayBoundary(now, ds.startHour, ds.startMinute);
  let end = dayBoundary(now, ds.endHour, ds.endMinute);
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  let clampedNow = now.getTime();
  if (clampedNow < start.getTime()) clampedNow = start.getTime();
  if (clampedNow > end.getTime()) clampedNow = end.getTime();
  const hoursElapsed = (clampedNow - start.getTime()) / (60 * 60 * 1000);

  if (type === "HP") {
    const hourlyLoss = pool.max * HP_HOURLY_LOSS_RATE;
    let hpValue = pool.max - hourlyLoss * hoursElapsed;
    if (hpValue < 0) hpValue = 0;
    if (hpValue > pool.max) hpValue = pool.max;
    return Math.round(hpValue);
  }

  ensurePoolSpentFresh(character);
  const totalHours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
  const frac = totalHours > 0 ? hoursElapsed / totalHours : 0;
  const floor = pool.max * (pool.floorFraction ?? 0);
  const baseValue = pool.max - (pool.max - floor) * frac;
  const spent = character.poolSpent[type as "SP" | "MP"] || 0;
  let finalValue = baseValue - spent;
  if (finalValue < 0) finalValue = 0;
  if (finalValue > pool.max) finalValue = pool.max;
  return Math.round(finalValue);
}

export function activeMaskMultiplier(character: Pick<Character, "subRoles">): number {
  const active = character.subRoles.filter((m) => m.active);
  if (!active.length) return 1;
  return active.reduce((max, m) => Math.max(max, m.multiplier), 1);
}

export function adjustedActionCost(
  character: Pick<Character, "subRoles">,
  baseCost: number
): number {
  const mult = activeMaskMultiplier(character);
  return Math.max(1, Math.round(baseCost * mult));
}
