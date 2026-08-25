// CDD Encyclopedia — Canon tier system
// Canonical source: CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md (Canon Hierarchy — TIER体系)
// The four Canonical Mysteries must NEVER be auto-resolved.

import type { CanonTier } from "./types";

export interface CanonTierMeta {
  tier: CanonTier;
  label: string;
  shortLabel: string;
  description: string;
  // Accessible visual cue — colors are restrained/academic, not the sole signal
  className: string;
  iconName: string; // simple glyph, not emoji decoration
}

// Ordered high → low authority
export const CANON_TIERS: CanonTierMeta[] = [
  {
    tier: "TIER 0",
    label: "MASTER CANON",
    shortLabel: "MASTER CANON",
    description:
      "CDD_World_Master.md (L0–L17 / SUPP / 正式变更记录). The absolutely unmodifiable foundation of the entire universe.",
    className: "canon-tier-0",
    iconName: "■",
  },
  {
    tier: "TIER 1",
    label: "HISTORICAL EXPANSION CANON",
    shortLabel: "HISTORICAL CANON",
    description:
      "Unified Chronology, Historical / Institutional / Civilization / Social / Modern archives, and Wave 1–4 NEW HISTORICAL CANON.",
    className: "canon-tier-1",
    iconName: "◆",
  },
  {
    tier: "TIER 2",
    label: "SCIENTIFIC EXPANSION CANON",
    shortLabel: "SCIENTIFIC CANON",
    description:
      "Φ量纲 / k,λ,D 系数 / Φ-能量唯象关系 (Wave 1 §III). Formal scientific expansion of the master framework.",
    className: "canon-tier-2",
    iconName: "◆",
  },
  {
    tier: "TIER 3",
    label: "RECONSTRUCTED",
    shortLabel: "RECONSTRUCTED",
    description:
      "Reasonable structural reconstruction (RECONSTRUCTED CANON / RECONSTRUCTED SYSTEM). NOT equivalent to established canon.",
    className: "canon-tier-3",
    iconName: "◇",
  },
  {
    tier: "TIER 4",
    label: "INFERENCE",
    shortLabel: "INFERENCE",
    description: "Inferred judgement — not established fact.",
    className: "canon-tier-4",
    iconName: "◇",
  },
  {
    tier: "TIER 5",
    label: "OPEN / GAP / CONFLICT",
    shortLabel: "OPEN",
    description:
      "Unresolved questions, missing data, or canon conflicts (includes the four Canonical Mysteries).",
    className: "canon-tier-5",
    iconName: "?",
  },
  {
    tier: "TIER 6",
    label: "PROPOSED",
    shortLabel: "PROPOSED",
    description:
      "Candidate content that may be added later (e.g. PIN-001 玄枢会). NOT established.",
    className: "canon-tier-6",
    iconName: "○",
  },
  {
    tier: "TIER 7",
    label: "STORY HOOK",
    shortLabel: "STORY HOOK",
    description:
      "Pure fiction interface. Does NOT constitute worldbuilding fact. Must never be promoted to canon.",
    className: "canon-tier-7",
    iconName: "○",
  },
];

const TIER_MAP: Record<string, CanonTierMeta> = Object.fromEntries(
  CANON_TIERS.map((t) => [t.tier, t]),
);

export function getCanonMeta(tier: string): CanonTierMeta {
  return TIER_MAP[tier] ?? CANON_TIERS[CANON_TIERS.length - 1];
}

// Critical integrity rules — surfaced in the UI wherever relevant
export const CANON_INTEGRITY_RULES = [
  "Low-tier content must never be auto-promoted to high-tier canon.",
  "RECONSTRUCTED ≠ CANON. INFERENCE ≠ FACT. STORY HOOK ≠ CANON. PROPOSED ≠ ESTABLISHED. OPEN QUESTION ≠ ERROR.",
  "The four Canonical Mysteries are permanently unresolved — the encyclopedia must not auto-generate, infer, or settle them.",
];

// The four permanent Canonical Mysteries (by id). These must remain unresolved.
export const PERMANENT_MYSTERY_IDS = [
  "OP-L13-001", // AI self-awareness
  // Black Tide ~28,000-year prehistoric gap, S3 timing, Central Sea mediation timing
  // are carried as CANON CONFLICT-001 / CANON CONFLICT-003 in the archive data.
];
