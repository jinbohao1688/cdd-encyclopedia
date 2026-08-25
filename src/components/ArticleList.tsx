// Reusable article list — table-like index used across category/index pages.

import Link from "next/link";
import { CanonBadge } from "./CanonBadge";
import type { Article } from "@/lib/types";

export function ArticleList({
  articles,
  emptyMessage = "No entries in this category yet.",
}: {
  articles: Article[];
  emptyMessage?: string;
}) {
  if (articles.length === 0) {
    return <p className="text-ink-400 italic text-sm">{emptyMessage}</p>;
  }
  return (
    <div className="border border-ink-200 divide-y divide-ink-100">
      {articles.map((a) => (
        <Link
          key={a.id}
          href={`/wiki/${a.slug}`}
          className="flex items-start gap-3 px-4 py-3 hover:bg-ivory-50 hover:no-underline"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-ink-900">{a.title}</span>
              {a.titleEn && a.titleEn !== "UNRESOLVED" && (
                <span className="text-xs italic text-ink-400">{a.titleEn}</span>
              )}
            </div>
            <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{a.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <CanonBadge tier={a.canonTier} size="sm" showLabel={false} />
            <span className="text-[10px] text-ink-400 font-mono">{a.id}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
