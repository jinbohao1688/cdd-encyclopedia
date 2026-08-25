// CDD Encyclopedia — Data build script
// Transforms raw extracted JSON (data/raw/*.json) into a unified, normalized
// encyclopedia dataset (data/encyclopedia.json + per-type indexes).
//
// CORE PRINCIPLE: No facts invented. Fields not present in source are omitted or
// set to "UNRESOLVED". Canon tiers are preserved exactly. The four Canonical
// Mysteries are NEVER auto-resolved.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

function writeJson(p, obj) {
  writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

function nonEmpty(s) {
  if (s === undefined || s === null) return false;
  if (typeof s !== "string") return true;
  const v = s.trim();
  return v.length > 0 && v !== "UNRESOLVED" && v !== "未解决" && v !== "无";
}
function orUnresolved(s) {
  return nonEmpty(s) ? s : "UNRESOLVED";
}

// Normalize a possibly-string-or-object field into a clean string.
function toText(v) {
  if (v === undefined || v === null) return "UNRESOLVED";
  if (typeof v === "string") return v.trim().length ? v.trim() : "UNRESOLVED";
  if (typeof v === "object") {
    // Flatten object values that are themselves strings
    const parts = [];
    for (const [k, val] of Object.entries(v)) {
      if (typeof val === "string") {
        if (val.trim().length) parts.push(`${k}: ${val.trim()}`);
      } else if (Array.isArray(val)) {
        if (val.length) parts.push(`${k}: ${val.join("; ")}`);
      } else if (val && typeof val === "object") {
        parts.push(`${k}: ${JSON.stringify(val)}`);
      }
    }
    return parts.length ? parts.join(" | ") : "UNRESOLVED";
  }
  return String(v);
}

function toArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [v];
}

// Canon tier normalization — preserve the original tier label exactly.
const CANON_TIER_ORDER = [
  "TIER 0",
  "TIER 1",
  "TIER 2",
  "TIER 3",
  "TIER 4",
  "TIER 5",
  "TIER 6",
  "TIER 7",
];

// Map a source canonStatus string to a normalized tier key.
// Checks the START of the string first (the primary declared status), then
// falls back to substring contains — so a description that merely *mentions*
// "Master Canon" mid-sentence is not misclassified as TIER 0.
function canonTierFromStatus(raw) {
  if (!raw) return "TIER 3";
  const s = String(raw);
  const up = s.toUpperCase();
  const startsWith = (kw) => up.startsWith(kw);
  // Primary declared status (prefix) takes priority
  if (startsWith("MASTER CANON") || startsWith("TIER 0")) return "TIER 0";
  if (startsWith("ESTABLISHED")) return "TIER 1";
  if (startsWith("NEW HISTORICAL CANON") || startsWith("HISTORICAL")) return "TIER 1";
  if (startsWith("TIER 1")) return "TIER 1";
  if (startsWith("NEW SCIENTIFIC CANON") || startsWith("SCIENTIFIC")) return "TIER 2";
  if (startsWith("TIER 2")) return "TIER 2";
  if (startsWith("RECONSTRUCT")) return "TIER 3";
  if (startsWith("TIER 3")) return "TIER 3";
  if (startsWith("INFERENCE")) return "TIER 4";
  if (startsWith("TIER 4")) return "TIER 4";
  if (startsWith("PROPOSED")) return "TIER 6";
  if (startsWith("TIER 6")) return "TIER 6";
  if (startsWith("STORY")) return "TIER 7";
  if (startsWith("TIER 7")) return "TIER 7";
  if (startsWith("OPEN") || startsWith("GAP") || startsWith("CANON CONFLICT") || startsWith("MYSTERY")) return "TIER 5";
  // Fallback: substring contains (lower confidence)
  if (up.includes("MASTER CANON") && !up.includes("没有")) return "TIER 0";
  if (up.includes("NEW HISTORICAL CANON") || up.includes("HISTORICAL CANON") || up.includes("TIER 1")) return "TIER 1";
  if (up.includes("SCIENTIFIC") || up.includes("TIER 2")) return "TIER 2";
  if (up.includes("RECONSTRUCT")) return "TIER 3";
  if (up.includes("INFERENCE")) return "TIER 4";
  if (up.includes("OPEN") || up.includes("GAP") || up.includes("CONFLICT") || up.includes("MYSTERY")) return "TIER 5";
  if (up.includes("PROPOSED")) return "TIER 6";
  if (up.includes("STORY HOOK")) return "TIER 7";
  if (up.includes("ESTABLISHED")) return "TIER 1";
  return "TIER 3";
}

// --- Generate URL-safe slug from a name (zh) ---
function slugify(name, id) {
  // Use the stable id when possible (more reliable than names)
  if (id) {
    const s = String(id).toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (s.length) return s;
  }
  return String(name || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "entry";
}

// ===========================================================================
// LOAD RAW
// ===========================================================================
const RAW = resolve(ROOT, "data", "raw");
const part1 = readJson(resolve(RAW, "part1-physics-layers.json"));
const part23 = readJson(resolve(RAW, "part2-3-chronology-events.json"));
const part4 = readJson(resolve(RAW, "part4-characters.json"));
const part56 = readJson(resolve(RAW, "part5-6-institutions-civs.json"));
const part78 = readJson(resolve(RAW, "part7-8-social-modern.json"));
const part916 = readJson(resolve(RAW, "part9-16-canon-archives.json"));

// ===========================================================================
// BUILD ARTICLES (the unified, searchable entity set)
// ===========================================================================
/** @type {Array<any>} */
const articles = [];

function addArticle(a) {
  if (!a || !a.id) return;
  a.slug = a.slug || slugify(a.title || a.name, a.id);
  a.aliases = Array.from(new Set(toArray(a.aliases).filter(Boolean)));
  a.related = Array.from(new Set(toArray(a.related).filter(Boolean)));
  a.sources = toArray(a.sources);
  if (!a.canonTier) a.canonTier = "TIER 3";
  a.canonStatusRaw = a.canonStatusRaw || a.canonTier;
  articles.push(a);
}

// ---- 1. Physics axioms (Master Canon) ----
for (const ax of part1.physicsAxioms || []) {
  addArticle({
    id: ax.id,
    type: "concept",
    category: "science",
    title: ax.name,
    titleEn: ax.nameEn === "UNRESOLVED" ? undefined : ax.nameEn,
    canonTier: "TIER 0",
    canonStatusRaw: ax.canonTier || "TIER 1 公理层 (绝对不可修改)",
    summary: ax.description || "UNRESOLVED",
    fields: {
      "Symbol / Name": ax.nameEn !== "UNRESOLVED" ? ax.nameEn : undefined,
      "Formula": ax.formula !== "UNRESOLVED" ? ax.formula : undefined,
      "Domain": "Physics",
      "Canon": "TIER 0 — MASTER CANON",
    },
    body: [
      { heading: "Definition", text: ax.description || "UNRESOLVED" },
      ...(ax.formula && ax.formula !== "UNRESOLVED"
        ? [{ heading: "Mathematical Framework", text: ax.formula }]
        : []),
    ],
    sources: [
      { ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: "PART I · 第一章 底层物理公理", canonicality: "TIER 0" },
    ],
  });
}

// ---- 2. World layers (L1–L17) ----
for (const layer of part1.worldLayers || []) {
  addArticle({
    id: layer.id,
    type: "concept",
    category: "world",
    title: layer.name,
    canonTier: layer.canonTier || "TIER 3",
    canonStatusRaw: layer.canonTier || "UNRESOLVED",
    summary: layer.summary || "UNRESOLVED",
    fields: {
      "Layer": layer.id,
      "Canon": layer.canonTier || "UNRESOLVED",
    },
    body: [
      { heading: "Overview", text: layer.summary || "UNRESOLVED" },
      ...(layer.keyTopics && layer.keyTopics.length
        ? [{ heading: "Key Topics", text: layer.keyTopics.join(" · ") }]
        : []),
    ],
    sources: [
      { ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: "PART I · 第二章 世界分层结构", canonicality: "TIER 1" },
    ],
  });
}

// ---- 3. CDD vs Reality ----
if (part1.cddVsReality && Array.isArray(part1.cddVsReality)) {
  addArticle({
    id: "L0-PHY-CMP",
    type: "concept",
    category: "science",
    title: "CDD 与现实物理对照",
    titleEn: "CDD vs Reality Physics",
    canonTier: "TIER 0",
    canonStatusRaw: "MASTER CANON",
    summary: "CDD 宇宙物理公理与现实世界物理的系统性对照。",
    body: [
      {
        heading: "Comparison",
        text: part1.cddVsReality.map(r => `${r.aspect || r.item || ""}: CDD=${r.cdd || ""}; Reality=${r.reality || ""}`).join("\n"),
      },
    ],
    sources: [{ ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: "PART I · §1.5", canonicality: "TIER 0" }],
  });
}

// ---- 4. Historical events ----
for (const ev of part23.historicalEvents || []) {
  const bi = ev.basicInfo || {};
  addArticle({
    id: ev.eventId,
    type: "event",
    category: "history",
    title: ev.name || ev.eventId,
    canonTier: canonTierFromStatus(bi.canonTier || bi.canonStatus || ev.canonStatus),
    canonStatusRaw: bi.canonTier || bi.canonStatus || ev.canonStatus || "RECONSTRUCTED",
    summary: ev.officialSummary || "UNRESOLVED",
    fields: {
      "Event ID": ev.eventId,
      "Date": bi.date || "UNRESOLVED",
      "Location": bi.location || "UNRESOLVED",
      "Era": bi.era || "UNRESOLVED",
      "Civilizations": bi.civilizations || "UNRESOLVED",
      "Canon": bi.canonTier || bi.canonStatus || "UNRESOLVED",
    },
    body: [
      { heading: "Official Historical Summary", text: ev.officialSummary || "UNRESOLVED" },
      { heading: "Historical Context", text: toText(ev.historicalContext) },
      { heading: "Immediate Causes", text: toText(ev.immediateCauses) },
      { heading: "Structural Causes", text: toText(ev.structuralCauses) },
      { heading: "Principal Actors", text: toText(ev.principalActors) },
      { heading: "Course of Events", text: toText(ev.courseOfEvents) },
      { heading: "Immediate Outcome", text: toText(ev.immediateOutcome) },
      { heading: "Long-Term Consequences", text: toText(ev.longTermConsequences) },
      { heading: "Associated Civilizations", text: toText(ev.associatedCivilizations) },
      { heading: "Associated Technology", text: toText(ev.associatedTechnology) },
      { heading: "CDD Physical Dimension", text: toText(ev.cddPhysicalDimension) },
      ...(ev.openQuestions && ev.openQuestions.length
        ? [{ heading: "Open Questions", list: ev.openQuestions }]
        : []),
      ...(ev.historicalGaps && ev.historicalGaps.length
        ? [{ heading: "Historical Gaps", list: ev.historicalGaps }]
        : []),
      { heading: "STORY HOOKS", text: "See STORY HOOKS section in source archive (NOT CANON)." },
    ],
    related: [
      ...(ev.associatedCivilizations ? toArray(ev.associatedCivilizations) : []),
      ...(ev.principalActors ? toArray(ev.principalActors) : []),
    ],
    sources: [
      { ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: `PART III · ${ev.eventId}`, canonicality: "TIER 1" },
    ],
  });
}

// ---- 5. Characters ----
for (const ch of part4.characters || []) {
  const bi = ch.basicIdentity || {};
  addArticle({
    id: ch.charId,
    type: "person",
    category: "people",
    title: ch.name,
    titleEn: ch.namePinyin !== "UNRESOLVED" ? ch.namePinyin : undefined,
    aliases: ch.namePinyin && ch.namePinyin !== "UNRESOLVED" ? [ch.namePinyin] : [],
    canonTier: canonTierFromStatus(ch.canonStatus),
    canonStatusRaw: ch.canonStatus || "UNRESOLVED",
    summary: toText({
      era: bi.era,
      civilization: bi.civilization,
      occupation: bi.occupation,
      role: bi.role,
    }),
    fields: {
      "Character ID": ch.charId,
      "Native Name": bi.nativeName !== "UNRESOLVED" ? bi.nativeName : undefined,
      "Era": bi.era || "UNRESOLVED",
      "Civilization": bi.civilization || "UNRESOLVED",
      "Occupation": bi.occupation || "UNRESOLVED",
      "Role": bi.role || "UNRESOLVED",
      "Status": bi.status || "UNRESOLVED",
      "Canon": ch.canonStatus || "UNRESOLVED",
    },
    body: [
      { heading: "Canon Status", text: ch.canonStatus || "UNRESOLVED" },
      { heading: "Birth Context", text: ch.birthContext || "UNRESOLVED" },
      { heading: "Early Life", text: ch.earlyLife || "UNRESOLVED" },
      { heading: "Beliefs", text: toText(ch.beliefs) },
      { heading: "Professional Profile", text: ch.professionalProfile || "UNRESOLVED" },
      { heading: "Historical Agency", text: toText(ch.historicalAgency) },
      { heading: "Historical Event Relations", list: toArray(ch.historicalEventRelations) },
      { heading: "Known Relationships", list: toArray(ch.knownRelationships) },
      { heading: "Language & Culture", text: ch.languageCulture || "UNRESOLVED" },
      { heading: "Limitations", text: ch.limitations || "UNRESOLVED" },
      { heading: "Historical Assessment", text: toText(ch.historicalAssessment) },
      { heading: "Historical Controversies", text: ch.historicalControversies || "UNRESOLVED" },
      { heading: "Death", text: toText(ch.death) },
      { heading: "Legacy", text: ch.legacy || "UNRESOLVED" },
      { heading: "Φ Relation", text: ch.phiRelation || "UNRESOLVED" },
      { heading: "FICTION INTERFACE (NOT CANON)", text: toText(ch.fictionInterface) },
    ],
    related: toArray(ch.historicalEventRelations),
    sources: [
      { ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: `PART IV · ${ch.charId}`, canonicality: "TIER 1" },
    ],
  });
}

// Founding figures (kept as lower-tier entries)
for (const ff of part4.foundingFigures || []) {
  addArticle({
    id: `FF-${ff.name}`,
    type: "person",
    category: "people",
    title: ff.name,
    titleEn: ff.namePinyin && ff.namePinyin !== "UNRESOLVED" ? ff.namePinyin : undefined,
    aliases: ff.namePinyin && ff.namePinyin !== "UNRESOLVED" ? [ff.namePinyin] : [],
    canonTier: "TIER 1",
    canonStatusRaw: "FOUNDING FIGURE (not upgraded to CHAR id)",
    summary: ff.role || "UNRESOLVED",
    fields: {
      "Name": ff.name,
      "Pinyin": ff.namePinyin || "UNRESOLVED",
      "Role": ff.role || "UNRESOLVED",
      "Status": "FOUNDING FIGURE — not upgraded to a CHAR-xxx id.",
      "Canon": "TIER 1",
    },
    body: [
      { heading: "Overview", text: `${ff.name} (${ff.namePinyin || "—"}) — ${ff.role || "UNRESOLVED"}.` },
      { heading: "Canon Status", text: "FOUNDING FIGURE (not upgraded to CHAR id). See PART IV Appendix." },
    ],
    sources: [{ ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: "PART IV · APPENDIX Founding Figures", canonicality: "TIER 1" }],
  });
}

// ---- 6. Institutions ----
for (const inst of part56.institutions || []) {
  const bi = inst.basicIdentity || {};
  addArticle({
    id: inst.instId,
    type: "institution",
    category: "institutions",
    title: inst.name,
    titleEn: inst.nameEn !== "UNRESOLVED" ? inst.nameEn : undefined,
    canonTier: canonTierFromStatus(inst.canonStatus),
    canonStatusRaw: inst.canonStatus || "UNRESOLVED",
    summary: toText({
      type: bi.type,
      civilization: bi.civilization,
      era: bi.era,
      status: bi.status,
      currentStatus: bi.currentStatus,
    }),
    fields: {
      "Institution ID": inst.instId,
      "Type": bi.type || "UNRESOLVED",
      "Civilization": bi.civilization || "UNRESOLVED",
      "Era": bi.era || "UNRESOLVED",
      "Status": bi.status || "UNRESOLVED",
      "Current Status": bi.currentStatus || "UNRESOLVED",
      "Canon": inst.canonStatus || "UNRESOLVED",
    },
    body: [
      { heading: "Canon Status", text: inst.canonStatus || "UNRESOLVED" },
      { heading: "Historical Origin", text: inst.historicalOrigin || "UNRESOLVED" },
      { heading: "Founding Context", text: toText(inst.foundingContext) },
      { heading: "Purpose", text: inst.purpose || "UNRESOLVED" },
      { heading: "Structure", text: inst.structure || "UNRESOLVED" },
      { heading: "Resources", text: inst.resources || "UNRESOLVED" },
      { heading: "Technologies", text: inst.technologies || "UNRESOLVED" },
      { heading: "Political Role", text: inst.politicalRole || "UNRESOLVED" },
      { heading: "Economic Role", text: inst.economicRole || "UNRESOLVED" },
      { heading: "Religious / Philosophical Role", text: inst.religiousRole || "UNRESOLVED" },
      { heading: "Scientific Role", text: inst.scientificRole || "UNRESOLVED" },
      { heading: "Military Role", text: inst.militaryRole || "UNRESOLVED" },
      { heading: "Cultural Role", text: inst.culturalRole || "UNRESOLVED" },
      { heading: "Historical Events", list: toArray(inst.historicalEvents) },
      { heading: "Historical Figures", list: toArray(inst.historicalFigures) },
      { heading: "Rival / Partner Institutions", list: toArray(inst.rivalPartnerInstitutions) },
      { heading: "Decline / Transformation", text: inst.declineTransformation || "UNRESOLVED" },
      { heading: "Legacy", text: inst.legacy || "UNRESOLVED" },
      { heading: "CDD / Φ Dimension", text: inst.cddPhiDimension || "UNRESOLVED" },
    ],
    related: [
      ...toArray(inst.historicalEvents),
      ...toArray(inst.historicalFigures),
      ...toArray(inst.rivalPartnerInstitutions),
    ],
    sources: [{ ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: `PART V · ${inst.instId}`, canonicality: "TIER 1" }],
  });
}

// ---- 7. Civilizations ----
for (const civ of part56.civilizations || []) {
  const isCiv006 = civ.civId === "CIV-006";
  addArticle({
    id: civ.civId,
    type: "civilization",
    category: "civilizations",
    title: civ.name,
    titleEn: civ.nameEn !== "UNRESOLVED" ? civ.nameEn : undefined,
    canonTier: canonTierFromStatus(civ.canonStatus),
    canonStatusRaw: civ.canonStatus || (isCiv006 ? "RECONSTRUCTED analytical framework" : "UNRESOLVED"),
    summary: isCiv006
      ? "Reconstructed analytical framework / not an independent extant civilization."
      : civ.summary || "UNRESOLVED",
    fields: {
      "Civilization ID": civ.civId,
      "Region": civ.region || "UNRESOLVED",
      "Status": isCiv006 ? "Reconstructed framework (NOT a sixth extant civilization)" : (civ.status || "Extant"),
      "Canon": civ.canonStatus || (isCiv006 ? "RECONSTRUCTED" : "UNRESOLVED"),
    },
    body: [
      isCiv006
        ? { heading: "⚠ Special Status", text: "Reconstructed analytical framework / not an independent extant civilization. Do NOT list as one of the six extant civilizations." }
        : { heading: "Overview", text: civ.summary || "UNRESOLVED" },
      { heading: "Geography", text: civ.geography || "UNRESOLVED" },
      { heading: "Currency", text: civ.currency || "UNRESOLVED" },
      { heading: "Government", text: civ.government || "UNRESOLVED" },
      { heading: "Philosophy / Religion", text: civ.philosophyReligion || "UNRESOLVED" },
      { heading: "Economy", text: civ.economy || "UNRESOLVED" },
      { heading: "Modern Fate", text: civ.modernFate || "UNRESOLVED" },
      ...(civ.specialNote ? [{ heading: "Special Note", text: civ.specialNote }] : []),
      ...(civ.fictionInterface ? [{ heading: "FICTION INTERFACE (NOT CANON)", text: toText(civ.fictionInterface) }] : []),
    ],
    sources: [{ ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0", section: `PART VI · ${civ.civId}`, canonicality: "TIER 1" }],
  });
}

// ===========================================================================
// BUILD ARCHIVE COLLECTIONS (questions / conflicts / mysteries / timeline)
// ===========================================================================
const oqRegistry = (part916.openQuestions && part916.openQuestions.registry) || [];
const oqAdditional = (part916.openQuestions && part916.openQuestions.additionalGapCategories) || [];
const openQuestions = [
  ...oqRegistry.map(q => ({
    id: q.id || "OP-UNNAMED",
    question: q.question || "UNRESOLVED",
    layer: q.layer || q.relatedLayer || "UNRESOLVED",
    status: q.status || "OPEN",
    assignedDomain: q.assignedDomain || "UNRESOLVED",
    canonImpact: q.canonImpact || "UNRESOLVED",
    relatedArticles: toArray(q.relatedArticles),
    isCanonicalMystery: q.id === "OP-L13-001",
  })),
  ...(Array.isArray(oqAdditional) ? oqAdditional.flatMap(cat => {
    if (Array.isArray(cat)) return cat;
    if (cat && Array.isArray(cat.items)) return cat.items;
    return [];
  }).map(q => ({
    id: q.id || "OP-UNNAMED",
    question: q.question || "UNRESOLVED",
    layer: q.layer || "UNRESOLVED",
    status: q.status || "OPEN",
    assignedDomain: q.assignedDomain || "UNRESOLVED",
    canonImpact: q.canonImpact || "UNRESOLVED",
    relatedArticles: toArray(q.relatedArticles),
    isCanonicalMystery: q.id === "OP-L13-001",
  })) : []),
];

const conflictArr = (part916.canonConflicts && part916.canonConflicts.conflicts) || [];
const canonConflicts = conflictArr.map(c => ({
  id: c.id || "CONFLICT-UNNAMED",
  title: c.title || "UNRESOLVED",
  status: c.status || "OPEN",
  description: c.description || "UNRESOLVED",
  involvedEvents: toArray(c.involvedEvents),
  involvedHistory: toArray(c.involvedHistory),
  originalSources: toArray(c.originalSources),
  interpretations: toArray(c.interpretations),
}));

const mysteryArr = (part916.canonicalMysteries && part916.canonicalMysteries.mysteries) || [];
const mysteryRule = (part916.canonicalMysteries && part916.canonicalMysteries.canonicalRule) || "No official resolution exists.";
const canonicalMysteries = mysteryArr.map(m => ({
  id: m.id || "MYSTERY-UNNAMED",
  title: m.title || m.description || "UNRESOLVED",
  description: m.description || "UNRESOLVED",
  status: "PERMANENTLY UNRESOLVED",
  canonicalRule: mysteryRule,
}));

// Merge any conflicts from part23 (CANON CONFLICT-001/002)
for (const c of part23.canonConflicts || []) {
  if (!canonConflicts.find(x => x.id === c.id)) {
    canonConflicts.push({
      id: c.id,
      title: c.title || c.id,
      status: c.status || "OPEN",
      description: c.description || "UNRESOLVED",
      involvedEvents: [],
      involvedHistory: [],
      originalSources: [],
      interpretations: [c.explanation].filter(Boolean),
    });
  }
}

// Timeline (macro eras + unified timeline + historical events)
const timeline = [];
for (const e of part23.macroEras || []) {
  timeline.push({
    era: "Geological",
    date: e.range || "UNRESOLVED",
    title: e.name,
    description: e.notes || "",
    canonTier: /TIER 2/.test(e.notes || "") ? "TIER 2" : "TIER 3",
    relatedIds: [],
  });
}
for (const t of part23.unifiedTimeline || []) {
  timeline.push({
    era: classifyEra(t),
    date: t.date || "UNRESOLVED",
    title: t.event || "UNRESOLVED",
    description: "",
    canonTier: t.canonTier || "TIER 3",
    relatedIds: [t.eventId].filter(Boolean),
    civilization: t.civilization,
  });
}
function classifyEra(t) {
  const d = String(t.date || "");
  if (/亿年|万年前|亿年前/.test(d) && /亿年|亿年前/.test(d)) return "Geological";
  if (/万年前|万年内/.test(d) && parseInt(d) >= 1) {
    const n = parseFloat(d);
    if (n >= 100) return "Geological";
    if (n >= 1) return "Prehistoric";
  }
  if (/年前/.test(d)) {
    const n = parseFloat(d);
    if (n >= 7000) return "Ancient";
    if (n >= 1400) return "Imperial";
    if (n >= 350) return "Industrial";
    return "Modern";
  }
  return "Modern";
}

// Sources registry
const sources = [
  {
    ref: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0",
    title: "CDD Complete World Archive v2.0",
    canonicality: "Master single-file assembly (TIER 0–7 mixed)",
    description: "Current authoritative assembly of all completed CDD worldbuilding content. This is the sole content basis for the encyclopedia.",
  },
];

// Canon registry
const canonRegistry = {
  tiers: [
    { tier: "TIER 0", label: "MASTER CANON", description: "CDD_World_Master.md (L0–L17 / SUPP / 正式变更记录). Absolutely unmodifiable foundation." },
    { tier: "TIER 1", label: "HISTORICAL EXPANSION CANON", description: "Unified Chronology, Historical/Institutional/Civilization/Social/Modern archives, Wave 1–4 NEW HISTORICAL CANON." },
    { tier: "TIER 2", label: "SCIENTIFIC EXPANSION CANON", description: "Φ量纲 / k,λ,D 系数 / Φ-能量唯象关系 (Wave 1 §III)." },
    { tier: "TIER 3", label: "RECONSTRUCTED", description: "Reasonable structural reconstruction (RECONSTRUCTED CANON / RECONSTRUCTED SYSTEM)." },
    { tier: "TIER 4", label: "INFERENCE", description: "Inferred judgement, not established fact." },
    { tier: "TIER 5", label: "OPEN / GAP / CONFLICT", description: "Unresolved questions, missing data, canon conflicts (incl. 4 Canonical Mysteries)." },
    { tier: "TIER 6", label: "PROPOSED", description: "Candidate content possibly added later (e.g. PIN-001 玄枢会)." },
    { tier: "TIER 7", label: "STORY HOOK", description: "Pure fiction interface, does NOT constitute worldbuilding fact." },
  ],
  rules: [
    "Low-tier content must NEVER be auto-promoted to high-tier canon.",
    "RECONSTRUCTED ≠ CANON. INFERENCE ≠ FACT. STORY HOOK ≠ CANON. PROPOSED ≠ ESTABLISHED. OPEN QUESTION ≠ ERROR.",
    "The four Canonical Mysteries are permanently unresolved. The encyclopedia must not auto-generate, infer, or settle them.",
  ],
};

// Change log
const cl = part916.changeLog || {};
const changeLog = [
  ...((cl.mainChanges || []).map(c => ({
    id: c.id || c.changeId || "CHG-?",
    description: c.description || c.summary || c.content || "UNRESOLVED",
    type: c.type || c.wave || "CHANGE",
  }))),
  ...((cl.minimalRepairs || []).map(c => ({
    id: c.id || c.repairId || "REPAIR-?",
    description: c.description || c.summary || c.content || "UNRESOLVED",
    type: "MINIMAL REPAIR",
  }))),
  ...((cl.unapprovedRepairRequests || []).map(c => ({
    id: c.id || "REQ-?",
    description: c.description || c.summary || c.content || "UNRESOLVED",
    type: "UNAPPROVED",
  }))),
];

// ===========================================================================
// WRITE OUTPUT
// ===========================================================================
const OUT = resolve(ROOT, "data");
mkdirSync(OUT, { recursive: true });

// De-duplicate articles by id (keep first occurrence)
const seen = new Set();
const deduped = [];
for (const a of articles) {
  if (seen.has(a.id)) continue;
  seen.add(a.id);
  deduped.push(a);
}

// Build a search index payload (lightweight, all text concatenated)
const searchIndex = deduped.map(a => ({
  id: a.id,
  slug: a.slug,
  type: a.type,
  category: a.category,
  title: a.title,
  titleEn: a.titleEn || "",
  aliases: a.aliases || [],
  canonTier: a.canonTier,
  canonStatusRaw: a.canonStatusRaw,
  summary: a.summary || "",
  searchText: [
    a.title,
    a.titleEn,
    ...(a.aliases || []),
    a.summary,
    a.id,
    (a.body || []).map(b => b.text || (b.list || []).join(" ")).join(" "),
  ].filter(Boolean).join(" \n "),
}));

writeJson(resolve(OUT, "encyclopedia.json"), {
  generatedAt: new Date().toISOString(),
  version: "2.0.0",
  sourceArchive: "CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md",
  counts: {
    articles: deduped.length,
    openQuestions: openQuestions.length,
    canonConflicts: canonConflicts.length,
    canonicalMysteries: canonicalMysteries.length,
    timelineEntries: timeline.length,
  },
  articles: deduped,
  openQuestions,
  canonConflicts,
  canonicalMysteries,
  timeline,
  sources,
  canonRegistry,
  changeLog,
});

writeJson(resolve(OUT, "search-index.json"), searchIndex);

// Per-category index
const byCategory = {};
for (const a of deduped) {
  (byCategory[a.category] ||= []).push({ id: a.id, slug: a.slug, title: a.title, canonTier: a.canonTier });
}
writeJson(resolve(OUT, "categories.json"), byCategory);

console.log(`✓ Built encyclopedia.json: ${deduped.length} articles`);
console.log(`✓ search-index.json: ${searchIndex.length} entries`);
console.log(`✓ ${openQuestions.length} open questions, ${canonConflicts.length} conflicts, ${canonicalMysteries.length} mysteries`);
console.log(`✓ timeline: ${timeline.length} entries`);
