import { poolLabel } from "@/lib/game/helpers";
import type { PoolType } from "@/lib/game/types";

export default function PoolBar({
  type,
  current,
  max,
}: {
  type: PoolType;
  current: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const cls = type === "HP" ? "p-hp" : type === "SP" ? "p-sp" : "p-mp";
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{poolLabel(type)}</span>
        <span className="text-muted">
          {current}/{max}
        </span>
      </div>
      <div className="pool-track">
        <div className={`pool-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
