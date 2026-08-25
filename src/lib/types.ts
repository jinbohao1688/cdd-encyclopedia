// CDD World Encyclopedia — Core data types
// All content sourced verbatim from CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md
// No facts invented; unstated fields are "UNRESOLVED".

export type CanonTier =
  | "TIER 0" | "TIER 1" | "TIER 2" | "TIER 3"
  | "TIER 4" | "TIER 5" | "TIER 6" | "TIER 7";

export type ArticleCategory =
  | "science" | "world" | "history" | "people"
  | "civilizations" | "institutions" | "society" | "modern-world" | "concept";

export type ArticleType =
  | "concept" | "event" | "person" | "institution" | "civilization";

export interface BodySection {
  heading: string;
  text?: string;
  list?: string[];
}

export interface SourceRef {
  ref: string;
  section: string;
  canonicality: string;
}

export interface Article {
  id: string;
  slug: string;
  type: ArticleType;
  category: ArticleCategory;
  title: string;
  titleEn?: string;
  aliases: string[];
  canonTier: CanonTier;
  canonStatusRaw: string;
  summary: string;
  fields: Record<string, string | undefined>;
  body: BodySection[];
  related: string[];
  sources: SourceRef[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  layer: string;
  status: string;
  assignedDomain: string;
  canonImpact: string;
  relatedArticles: string[];
  isCanonicalMystery: boolean;
}

export interface CanonConflict {
  id: string;
  title: string;
  status: string;
  description: string;
  involvedEvents: string[];
  involvedHistory: string[];
  originalSources: string[];
  interpretations: string[];
}

export interface CanonicalMystery {
  id: string;
  title: string;
  description: string;
  status: "PERMANENTLY UNRESOLVED";
  canonicalRule: string;
}

export interface TimelineEntry {
  era: string;
  date: string;
  title: string;
  description: string;
  canonTier: CanonTier;
  relatedIds: string[];
  civilization?: string;
}

export interface CanonTierInfo {
  tier: string;
  label: string;
  description: string;
}

export interface CanonRegistry {
  tiers: CanonTierInfo[];
  rules: string[];
}

export interface ChangeLogEntry {
  id: string;
  description: string;
  type: string;
}

export interface EncyclopediaData {
  generatedAt: string;
  version: string;
  sourceArchive: string;
  counts: {
    articles: number;
    openQuestions: number;
    canonConflicts: number;
    canonicalMysteries: number;
    timelineEntries: number;
  };
  articles: Article[];
  openQuestions: OpenQuestion[];
  canonConflicts: CanonConflict[];
  canonicalMysteries: CanonicalMystery[];
  timeline: TimelineEntry[];
  sources: { ref: string; title: string; canonicality: string; description: string }[];
  canonRegistry: CanonRegistry;
  changeLog: ChangeLogEntry[];
}

export interface SearchEntry {
  id: string;
  slug: string;
  type: ArticleType;
  category: ArticleCategory;
  title: string;
  titleEn: string;
  aliases: string[];
  canonTier: CanonTier;
  canonStatusRaw: string;
  summary: string;
  searchText: string;
}
