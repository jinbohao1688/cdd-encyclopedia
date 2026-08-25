// CDD Encyclopedia — Data access layer
// Loads the prebuilt encyclopedia dataset (data/encyclopedia.json) at build time.

import data from "../../data/encyclopedia.json";
import searchIndex from "../../data/search-index.json";
import type {
  Article,
  CanonConflict,
  CanonicalMystery,
  ChangeLogEntry,
  EncyclopediaData,
  OpenQuestion,
  SearchEntry,
  TimelineEntry,
} from "./types";

const typedData = data as unknown as EncyclopediaData;

export function getEncyclopediaData(): EncyclopediaData {
  return typedData;
}

export function getAllArticles(): Article[] {
  return typedData.articles;
}

export function getArticleBySlug(slug: string): Article | undefined {
  return typedData.articles.find((a) => a.slug === slug);
}

export function getArticleById(id: string): Article | undefined {
  return typedData.articles.find((a) => a.id === id);
}

export function getArticlesByCategory(category: string): Article[] {
  return typedData.articles.filter((a) => a.category === category);
}

export function getArticlesByType(type: string): Article[] {
  return typedData.articles.filter((a) => a.type === type);
}

export function getOpenQuestions(): OpenQuestion[] {
  return typedData.openQuestions;
}

export function getCanonConflicts(): CanonConflict[] {
  return typedData.canonConflicts;
}

export function getCanonicalMysteries(): CanonicalMystery[] {
  return typedData.canonicalMysteries;
}

export function getTimeline(): TimelineEntry[] {
  return typedData.timeline;
}

export function getCanonRegistry() {
  return typedData.canonRegistry;
}

export function getChangeLog(): ChangeLogEntry[] {
  return typedData.changeLog;
}

export function getSources() {
  return typedData.sources;
}

// Reverse links: which articles reference a given id?
export function getBacklinks(id: string): Article[] {
  return typedData.articles.filter((a) => a.related.includes(id));
}

// Random article — excludes PROPOSED / STORY HOOK unless includeNonCanon=true
export function getRandomArticle(includeNonCanon = false): Article {
  const pool = typedData.articles.filter((a) => {
    if (includeNonCanon) return true;
    return a.canonTier !== "TIER 6" && a.canonTier !== "TIER 7";
  });
  const arr = pool.length ? pool : typedData.articles;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getSearchEntries(): SearchEntry[] {
  return searchIndex as unknown as SearchEntry[];
}

// Build a quick lookup of title -> article for internal-link resolution
const TITLE_INDEX: Map<string, Article> = new Map();
for (const a of typedData.articles) {
  TITLE_INDEX.set(a.title, a);
  if (a.titleEn) TITLE_INDEX.set(a.titleEn, a);
  for (const alias of a.aliases) TITLE_INDEX.set(alias, a);
  TITLE_INDEX.set(a.id, a);
}

// Known entity names for auto-linking, ordered by length desc so longer
// phrases win over substrings.
const LINKABLE_NAMES: { name: string; article: Article }[] = Array.from(
  TITLE_INDEX.entries(),
)
  .filter(([k]) => k && k.length >= 2 && k !== "UNRESOLVED")
  .sort((a, b) => b[0].length - a[0].length)
  .map(([name, article]) => ({ name, article }));

export function getLinkableNames() {
  return LINKABLE_NAMES;
}

export function findArticleByTitle(title: string): Article | undefined {
  return TITLE_INDEX.get(title);
}

// Stats for home page
export function getStats() {
  const d = typedData;
  return {
    articles: d.articles.length,
    characters: d.articles.filter((a) => a.type === "person").length,
    institutions: d.articles.filter((a) => a.type === "institution").length,
    civilizations: d.articles.filter((a) => a.type === "civilization").length,
    events: d.articles.filter((a) => a.type === "event").length,
    concepts: d.articles.filter((a) => a.type === "concept").length,
    openQuestions: d.openQuestions.length,
    canonConflicts: d.canonConflicts.length,
    canonicalMysteries: d.canonicalMysteries.length,
    timelineEntries: d.timeline.length,
  };
}
