// Client-side search results renderer.
// Static-export safe: reads ?q from URL via useSearchParams.

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { search } from "@/lib/search";
import { CanonBadge } from "@/components/CanonBadge";

export default function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const results = useMemo(() => (query ? search(query, 100) : []), [query]);

  if (!query) {
    return (
      <div className="border border-ink-200 bg-ivory-50 p-6 text-center text-ink-500">
        Enter a query above to search the encyclopedia.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-sm text-ink-500">
        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
      </div>
      {results.length === 0 ? (
        <div className="border border-ink-200 bg-ivory-50 p-6 text-center text-ink-500">
          No matching entries. The encyclopedia does not fabricate content; if a
          topic is absent, it has not been established in canon.
        </div>
      ) : (
        <ul className="divide-y divide-ink-200 border border-ink-200 rounded-md overflow-hidden">
          {results.map((r) => (
            <li key={r.entry.slug} className="p-4 hover:bg-ivory-50/70">
              <div className="flex items-start gap-3">
                <CanonBadge tier={r.entry.canonTier} size="sm" />
                <div className="flex-1 min-w-0">
                  <Link href={`/wiki/${r.entry.slug}`} className="block font-medium text-ink-900 hover:text-ink-600">
                    {r.entry.title}
                    {r.entry.titleEn ? (
                      <span className="ml-2 text-ink-400 font-normal text-sm">{r.entry.titleEn}</span>
                    ) : null}
                    <span className="ml-2 text-xs text-ink-400">{r.entry.id}</span>
                  </Link>
                  {r.entry.summary ? (
                    <p className="text-sm text-ink-600 mt-1 line-clamp-2">{r.entry.summary}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {query && (
        <p className="mt-6 text-xs text-ink-400">
          Tip: search supports fuzzy matching. Try “Φ”, “Norh”, “AI”, or a CHAR-xxx
          / INS-xxx / CIV-xxx / OP-xxx ID.
        </p>
      )}
    </div>
  );
}
