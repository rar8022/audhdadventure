import { STAT_MAX } from "@/lib/game/constants";

export default function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-accent-bg/40 p-3 text-center">
      <div className="text-xl font-bold text-ink">
        {value}
        <span className="text-xs font-normal text-muted">/{STAT_MAX}</span>
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
