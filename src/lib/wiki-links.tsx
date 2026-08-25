// CDD Encyclopedia — Internal wiki-link renderer
// Converts known entity names found in body text into clickable internal links.
// Only links names that exist in the article registry; longer names win over
// substrings to avoid partial mismatches.

import React from "react";
import { getLinkableNames } from "./data";

// Cache the sorted list once
let linkables: { name: string; slug: string; id: string }[] | null = null;

function getLinkables() {
  if (linkables) return linkables;
  const names = getLinkableNames();
  linkables = names
    .filter(({ name }) => name.length >= 2)
    .map(({ name, article }) => ({ name, slug: article.slug, id: article.id }))
    // de-dup by name (keep first)
    .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i);
  return linkables;
}

// Escape regex special chars
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderLinkedText(text: string): React.ReactNode {
  if (!text || text === "UNRESOLVED") return text;
  const names = getLinkables();
  if (names.length === 0) return text;

  // Build a single alternation regex of all names (longest first)
  const pattern = names.map((n) => escapeRe(n.name)).join("|");
  const re = new RegExp(`(${pattern})`, "g");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const matched = match[0];
    const found = names.find((n) => n.name === matched);
    if (found) {
      parts.push(
        React.createElement(
          "a",
          {
            key: `l-${key++}`,
            href: `/wiki/${found.slug}`,
            className: "wiki-link",
          },
          matched,
        ),
      );
    } else {
      parts.push(matched);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
