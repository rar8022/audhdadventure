import { PHYS_STATS, STAT_MAX } from "@/lib/game/constants";
import { fmtChartDate, type GrowthPoint } from "@/lib/game/helpers";

export default function GrowthChart({ points }: { points: GrowthPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="empty">
        Not enough history in this range yet. Save a few check-ins (or widen the range) to see a
        trend.
      </p>
    );
  }

  const w = 640;
  const h = 160;
  const padL = 26;
  const padR = 10;
  const padT = 12;
  const padB = 22;
  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const minV = PHYS_STATS.length;
  const maxV = PHYS_STATS.length * STAT_MAX;
  const xFor = (t: number) =>
    padL + (maxT === minT ? 0 : (t - minT) / (maxT - minT)) * (w - padL - padR);
  const yFor = (v: number) => padT + (1 - (v - minV) / (maxV - minV)) * (h - padT - padB);
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(p.t).toFixed(1)},${yFor(p.total).toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L${xFor(points[points.length - 1].t).toFixed(1)},${h - padB} L${xFor(
    points[0].t
  ).toFixed(1)},${h - padB} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.total - first.total;
  const deltaText = `${delta > 0 ? "+" : ""}${delta} point${
    Math.abs(delta) === 1 ? "" : "s"
  } since the start of this range`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <path d={areaD} fill="var(--mp-bg)" stroke="none" />
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xFor(p.t).toFixed(1)}
            cy={yFor(p.total).toFixed(1)}
            r={3}
            fill="var(--accent-dark)"
          />
        ))}
        <text x={padL} y={h - 6} fontSize={10} fill="var(--muted)">
          {fmtChartDate(minT)}
        </text>
        <text x={w - padR} y={h - 6} fontSize={10} fill="var(--muted)" textAnchor="end">
          {fmtChartDate(maxT)}
        </text>
      </svg>
      <p className="mt-1.5 text-sm text-muted">
        Current total: {last.total}/{maxV} · {deltaText}
      </p>
    </div>
  );
}
