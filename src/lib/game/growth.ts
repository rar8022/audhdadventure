import { GROWTH_XP_BASE, STAT_BASELINE, STAT_MAX } from "@/lib/game/constants";
import { syncPoolMaxes } from "@/lib/game/pools";
import type { Character, StatKey } from "@/lib/game/types";

export function xpNeededForNextPoint(currentValue: number): number {
  const pointsAboveBaseline = currentValue - STAT_BASELINE;
  return GROWTH_XP_BASE * (pointsAboveBaseline + 1);
}

export interface GrowthResult {
  xpGained: number;
  leveledUp: boolean;
  pointsAfter: number;
  xpAfter: number;
  xpNeededNext: number | null;
}

/**
 * Applies XP toward a stat, leveling it up (possibly more than once, if a
 * single large XP grant crosses multiple thresholds) up to STAT_MAX.
 * Mutates character.physicalStats / character.statXP / character.pools
 * (via syncPoolMaxes, only when a level-up actually occurs) in place.
 */
export function applyGrowthXP(
  character: Character,
  statKey: StatKey,
  xpGain: number
): GrowthResult {
  const startingValue = character.physicalStats[statKey];
  if (startingValue >= STAT_MAX) {
    return { xpGained: 0, leveledUp: false, pointsAfter: startingValue, xpAfter: 0, xpNeededNext: null };
  }

  let leveledUp = false;
  character.statXP[statKey] = (character.statXP[statKey] || 0) + xpGain;

  while (
    character.physicalStats[statKey] < STAT_MAX &&
    character.statXP[statKey] >= xpNeededForNextPoint(character.physicalStats[statKey])
  ) {
    character.statXP[statKey] -= xpNeededForNextPoint(character.physicalStats[statKey]);
    character.physicalStats[statKey] += 1;
    leveledUp = true;
  }

  if (character.physicalStats[statKey] >= STAT_MAX) {
    character.physicalStats[statKey] = STAT_MAX;
    character.statXP[statKey] = 0;
  }

  if (leveledUp) {
    syncPoolMaxes(character);
  }

  const pointsAfter = character.physicalStats[statKey];
  const xpAfter = character.statXP[statKey];
  const xpNeededNext = pointsAfter >= STAT_MAX ? null : xpNeededForNextPoint(pointsAfter);

  return { xpGained: xpGain, leveledUp, pointsAfter, xpAfter, xpNeededNext };
}
