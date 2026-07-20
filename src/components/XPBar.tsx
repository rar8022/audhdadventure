import { STAT_MAX } from "@/lib/game/constants";
import { xpNeededForNextPoint } from "@/lib/game/growth";
import type { Character, StatKey } from "@/lib/game/types";

export default function XPBar({
  character,
  statKey,
  label,
}: {
  character: Character;
  statKey: StatKey;
  label: string;
}) {
  const current = character.physicalStats[statKey];
  const xp = character.statXP[statKey] || 0;
  const maxed = current >= STAT_MAX;
  const needed = maxed ? 0 : xpNeededForNextPoint(current);
  const pct = maxed ? 100 : Math.round((xp / needed) * 100);
  const subLabel = maxed ? "Maxed out" : `${xp}/${needed} XP to next point`;

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">
          {label} · {current}/{STAT_MAX}
        </span>
        <span className="text-muted">{subLabel}</span>
      </div>
      <div className="pool-track">
        <div className="pool-fill p-mp" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
