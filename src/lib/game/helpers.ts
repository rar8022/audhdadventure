import { BUFF_DEBUFF_CATALOG, GROWTH_RANGES } from "@/lib/game/constants";
import { statSum } from "@/lib/game/pools";
import type { Character, HistoryRecord, PoolType } from "@/lib/game/types";

export function combinedBuffCatalog(character: Pick<Character, "customBuffsDebuffs">) {
  return [...BUFF_DEBUFF_CATALOG, ...character.customBuffsDebuffs];
}

export function poolLabel(type: PoolType): string {
  if (type === "HP") return "Health Points (HP)";
  if (type === "SP") return "Stamina Points (SP)";
  return "Mana Points (MP)";
}

export function pad2(n: number): string {
  return (n < 10 ? "0" : "") + n;
}

export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function fmtChartDate(t: number): string {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export interface GrowthPoint {
  t: number;
  total: number;
}

/** Check-in history reduced to (timestamp, stat total) points for the growth chart. */
export function growthPointsFor(
  history: HistoryRecord[],
  characterId: string,
  rangeKey: string
): GrowthPoint[] {
  const range = GROWTH_RANGES.find((r) => r.key === rangeKey);
  if (!range) return [];
  const cutoff = Date.now() - range.ms;
  return history
    .filter((r) => r.characterId === characterId && r.type === "checkin" && r.ts >= cutoff)
    .map((r) => ({
      t: r.ts,
      total: statSum(r.data.physicalStats as Character["physicalStats"]),
    }))
    .sort((a, b) => a.t - b.t);
}

export function findHistoricalCheckin(
  history: HistoryRecord[],
  characterId: string,
  dateStr: string
): HistoryRecord | null {
  const matches = history
    .filter((r) => r.characterId === characterId && r.type === "checkin" && r.date === dateStr)
    .sort((a, b) => b.ts - a.ts);
  return matches[0] ?? null;
}

export function questCompletedToday(
  history: HistoryRecord[],
  characterId: string,
  title: string,
  today: string
): boolean {
  return history.some(
    (r) =>
      r.type === "quest_complete" &&
      r.characterId === characterId &&
      r.date === today &&
      (r.data as { title?: string }).title === title
  );
}
