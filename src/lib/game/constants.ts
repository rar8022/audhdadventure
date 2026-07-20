import type { BuffPolarity, StatKey } from "@/lib/game/types";

export interface BuffDebuffCatalogItem {
  id: string;
  label: string;
  category: string;
  polarity: BuffPolarity;
}

export const BUFF_DEBUFF_CATALOG: BuffDebuffCatalogItem[] = [
  { id: "auditory_overload", label: "Auditory overload", category: "Sensory", polarity: "debuff" },
  { id: "visual_overload", label: "Visual overload", category: "Sensory", polarity: "debuff" },
  { id: "proprioceptive_overload", label: "Proprioceptive overload", category: "Sensory", polarity: "debuff" },
  { id: "smell_touch_overload", label: "Smell / touch overload", category: "Sensory", polarity: "debuff" },
  { id: "info_overload", label: "Information overload", category: "Cognitive", polarity: "debuff" },
  { id: "time_pressure", label: "Time pressure", category: "Cognitive", polarity: "debuff" },
  { id: "ambiguity", label: "Ambiguity / unclear expectations", category: "Cognitive", polarity: "debuff" },
  { id: "social_performance", label: "Social performance pressure", category: "Social", polarity: "debuff" },
  { id: "crowds", label: "Crowded space", category: "Social", polarity: "debuff" },
  { id: "hunger", label: "Hunger / low blood sugar", category: "Physiological", polarity: "debuff" },
  { id: "dehydration", label: "Dehydration", category: "Physiological", polarity: "debuff" },
  { id: "temperature", label: "Temperature extreme", category: "Physiological", polarity: "debuff" },
  { id: "ableist_env", label: "Inaccessible / ableist environment", category: "Systemic", polarity: "debuff" },
  { id: "quiet_space", label: "Quiet space", category: "Sensory", polarity: "buff" },
  { id: "good_lighting", label: "Comfortable lighting", category: "Sensory", polarity: "buff" },
  { id: "stable_temp", label: "Stable, comfortable temperature", category: "Sensory", polarity: "buff" },
  { id: "written_reqs", label: "Written requirements / clear criteria", category: "Cognitive", polarity: "buff" },
  { id: "realistic_deadline", label: "Realistic deadline with buffer", category: "Cognitive", polarity: "buff" },
  { id: "focus_block", label: "Protected focus block", category: "Cognitive", polarity: "buff" },
  { id: "trusted_people", label: "Trusted, unmasked company", category: "Social", polarity: "buff" },
  { id: "advance_notice", label: "Advance notice of plans", category: "Social", polarity: "buff" },
  { id: "regular_meals", label: "Regular meals", category: "Physiological", polarity: "buff" },
  { id: "hydration", label: "Good hydration", category: "Physiological", polarity: "buff" },
  { id: "accessible_design", label: "Accessible, inclusive space", category: "Systemic", polarity: "buff" },
];

export const MAIN_ROLES = [
  "Explorer",
  "Builder",
  "Creator",
  "Ruler",
  "Guardian",
  "Teacher",
  "Other",
] as const;

export const PHYS_STATS: { key: StatKey; label: string }[] = [
  { key: "strength", label: "Strength" },
  { key: "endurance", label: "Endurance" },
  { key: "coordination", label: "Coordination" },
  { key: "memory", label: "Memory" },
  { key: "precision", label: "Precision" },
];

export const BUFF_CATEGORIES = [
  "Sensory",
  "Cognitive",
  "Social",
  "Physiological",
  "Systemic",
] as const;

export const ACTION_SPELL_COSTS = [1, 2, 5, 10] as const;

export const STAT_BASELINE = 5;
export const STAT_MAX = 50;
export const GROWTH_XP_BASE = 50;
export const GROWTH_XP_PER_ADVENTURE = 10;
export const GROWTH_XP_PER_MAJOR_ADVENTURE = 20;
export const POOL_POINTS_PER_STAT_POINT = 20;
export const HP_DAILY_LOSS_FRACTION = 0.12;
export const HP_HOURLY_LOSS_RATE = HP_DAILY_LOSS_FRACTION / 24;

export interface GrowthRange {
  key: string;
  label: string;
  ms: number;
}

export const GROWTH_RANGES: GrowthRange[] = [
  { key: "24h", label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { key: "1w", label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "1m", label: "1 month", ms: 30 * 24 * 60 * 60 * 1000 },
  { key: "6m", label: "6 months", ms: 182 * 24 * 60 * 60 * 1000 },
  { key: "1y", label: "1 year", ms: 365 * 24 * 60 * 60 * 1000 },
];

export interface QuestPlaceholder {
  title: string;
  desc: string;
  tag: string;
  locked?: boolean;
}

export const QUEST_PLACEHOLDERS: QuestPlaceholder[] = [
  { title: "Take a short rest", desc: "Spend 15-30 minutes in a low-stress environment with water and a small snack to recover some Stamina.", tag: "Stamina" },
  { title: "Protect a quiet block", desc: "Block off 30-60 minutes of low-stimulus time today to let Mana recharge — no notifications, no new information.", tag: "Mana" },
  { title: "Name today's mask", desc: "Notice which mask you're wearing right now, and bring it into your next check-in even if it feels obvious.", tag: "Awareness" },
  { title: "Log one buff", desc: "Find one thing in your environment that's actually helping today and add it on the Buffs & debuffs tab.", tag: "Buffs" },
  { title: "Sleep debt check", desc: "If Health has been trending low lately, plan for extra sleep tonight rather than pushing through tomorrow.", tag: "Health" },
  { title: "Party quest", desc: "Quests you take on together with friends in a Party or Guild will show up here once connected play is available.", tag: "Social", locked: true },
];
