// CDD Encyclopedia — Real full-text search via Fuse.js
// Searches across title, titleEn, aliases, id, summary, and full body text.
// Supports fuzzy matching and multiple keys (per the spec: Title, Full Text,
// ID, Alias, Chinese Name, English Name, Civilization, Category, Canon Status).

import Fuse from "fuse.js";
import type { SearchEntry } from "./types";
import { getSearchEntries } from "./data";

let fuseInstance: Fuse<SearchEntry> | null = null;

function getFuse(): Fuse<SearchEntry> {
  if (fuseInstance) return fuseInstance;
  const entries = getSearchEntries();
  fuseInstance = new Fuse(entries, {
    includeScore: true,
    includeMatches: true,
    threshold: 0.4, // fairly permissive fuzzy match
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: "title", weight: 0.35 },
      { name: "titleEn", weight: 0.2 },
      { name: "id", weight: 0.25 },
      { name: "aliases", weight: 0.2 },
      { name: "summary", weight: 0.15 },
      { name: "searchText", weight: 0.05 },
    ],
  });
  return fuseInstance;
}

export interface SearchResult {
  entry: SearchEntry;
  score: number;
}

export function search(query: string, limit = 50): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const fuse = getFuse();
  const results = fuse.search(q, { limit });
  return results.map((r) => ({ entry: r.item, score: r.score ?? 1 }));
}

// Exact prefix match helper for "starts with" queries (e.g. typing "Norh")
export function searchByPrefix(query: string, limit = 20): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const entries = getSearchEntries();
  const matched: SearchEntry[] = [];
  for (const e of entries) {
    if (
      e.title.toLowerCase().startsWith(q) ||
      e.titleEn.toLowerCase().startsWith(q) ||
      e.id.toLowerCase().startsWith(q) ||
      e.aliases.some((a) => a.toLowerCase().startsWith(q))
    ) {
      matched.push(e);
      if (matched.length >= limit) break;
    }
  }
  return matched;
}
