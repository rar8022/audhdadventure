import { PHYS_STATS, STAT_MAX } from "@/lib/game/constants";
import { statSum } from "@/lib/game/pools";
import type { Character, HistoryRecord } from "@/lib/game/types";

interface CheckinData {
  mainRole?: string;
  activeMasks?: string[];
  activeBuffsDebuffs?: string[];
  pools: { HP: number; SP: number; MP: number };
  physicalStats: Character["physicalStats"];
}
interface GrowthData {
  stat: string;
  major?: boolean;
  leveledUp: boolean;
  pointsAfter: number;
  xpGained: number;
  xpAfter: number;
  xpNeededNext: number | null;
  challenge: string;
  skill: string;
}
interface BuffToggleData {
  label: string;
  polarity: "buff" | "debuff";
  turnedOn: boolean;
}
interface QuestData {
  title: string;
  tag: string;
}
interface ActionSpellData {
  label: string;
  kind: "action" | "spell";
  pool: "SP" | "MP";
  baseCost: number;
  cost: number;
}
interface LoginData {
  provider?: string;
}

function describeHistoryRecord(r: HistoryRecord): {
  badgeClass: string;
  badgeText: string;
  body: React.ReactNode;
} {
  const d = r.data as unknown;

  if (r.type === "login") {
    const data = d as LoginData;
    const providerNote =
      data.provider === "discord" ? " via Discord" : data.provider === "guest" ? " as guest" : "";
    return {
      badgeClass: "login",
      badgeText: "Login",
      body: <div className="text-xs text-muted">App opened{providerNote}</div>,
    };
  }

  if (r.type === "checkin") {
    const data = d as CheckinData;
    return {
      badgeClass: "checkin",
      badgeText: "Check-in",
      body: (
        <>
          <div className="text-xs text-muted">
            Role: {data.mainRole || "—"} · HP {data.pools.HP} / SP {data.pools.SP} / MP{" "}
            {data.pools.MP} · Stats total {statSum(data.physicalStats)}/
            {PHYS_STATS.length * STAT_MAX}
          </div>
          {data.activeMasks && data.activeMasks.length > 0 && (
            <div className="text-xs text-muted">Masks: {data.activeMasks.join(", ")}</div>
          )}
          {data.activeBuffsDebuffs && data.activeBuffsDebuffs.length > 0 && (
            <div className="text-xs text-muted">
              Buffs/debuffs: {data.activeBuffsDebuffs.join(", ")}
            </div>
          )}
        </>
      ),
    };
  }

  if (r.type === "growth") {
    const data = d as GrowthData;
    const statLabel = PHYS_STATS.find((s) => s.key === data.stat);
    const summary = data.leveledUp
      ? `Leveled up ${statLabel?.label ?? data.stat} to ${data.pointsAfter}/${STAT_MAX}`
      : `+${data.xpGained} XP toward ${statLabel?.label ?? data.stat} (${data.xpAfter}/${data.xpNeededNext})`;
    return {
      badgeClass: "growth",
      badgeText: "Growth",
      body: (
        <>
          <div className="text-xs text-muted">
            {summary}
            {data.major ? " · Major" : ""} — {data.challenge}
          </div>
          <div className="text-xs text-muted">Helped by: {data.skill}</div>
        </>
      ),
    };
  }

  if (r.type === "buff_toggle") {
    const data = d as BuffToggleData;
    return {
      badgeClass: data.polarity,
      badgeText: `${data.polarity === "buff" ? "Buff" : "Debuff"} ${data.turnedOn ? "on" : "off"}`,
      body: <div className="text-xs text-muted">{data.label}</div>,
    };
  }

  if (r.type === "quest_complete") {
    const data = d as QuestData;
    return {
      badgeClass: "quest",
      badgeText: "Quest",
      body: <div className="text-xs text-muted">Completed: {data.title}</div>,
    };
  }

  if (r.type === "action_spell_use") {
    const data = d as ActionSpellData;
    const costText = `${data.cost} ${data.pool}${
      data.cost !== data.baseCost ? ` (base ${data.baseCost})` : ""
    }`;
    return {
      badgeClass: data.kind === "spell" ? "spell" : "action",
      badgeText: `${data.kind === "spell" ? "Spell" : "Action"} used`,
      body: (
        <div className="text-xs text-muted">
          {data.label} — {costText}
        </div>
      ),
    };
  }

  return { badgeClass: "", badgeText: r.type, body: null };
}

export default function HistoryRow({
  record,
  characterName,
  showCharacter,
  actions,
}: {
  record: HistoryRecord;
  characterName?: string;
  showCharacter?: boolean;
  actions?: React.ReactNode;
}) {
  const info = describeHistoryRecord(record);
  return (
    <div className="border-b border-border py-3 text-sm last:border-b-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {info.badgeClass && <span className={`badge ${info.badgeClass}`}>{info.badgeText}</span>}
        {!info.badgeClass && <span className="badge">{info.badgeText}</span>}
        {record.edited && <span className="badge edited">Edited</span>}
        {showCharacter && characterName && (
          <strong className="text-accent-dark">{characterName}</strong>
        )}
        <strong>{record.at}</strong>
      </div>
      <div className="mt-1 space-y-0.5">{info.body}</div>
      {actions && <div className="mt-1.5 flex gap-2">{actions}</div>}
    </div>
  );
}
