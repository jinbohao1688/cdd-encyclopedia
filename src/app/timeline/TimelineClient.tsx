// Timeline client component — era filtering + canon-level display.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CanonBadge } from "@/components/CanonBadge";
import type { TimelineEntry } from "@/lib/types";

export default function TimelineClient({
  entries,
  eras,
}: {
  entries: TimelineEntry[];
  eras: string[];
}) {
  const [activeEra, setActiveEra] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = entries;
    if (activeEra !== "All") list = list.filter((e) => e.era === activeEra);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.date.toLowerCase().includes(q) ||
          (e.civilization || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [entries, activeEra, query]);

  return (
    <div>
      {/* Era filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setActiveEra("All")}
          className={`text-xs px-2.5 py-1 border ${
            activeEra === "All"
              ? "border-slateblue-700 text-slateblue-700 bg-slateblue-50"
              : "border-ink-300 text-ink-600"
          }`}
        >
          All eras
        </button>
        {eras.map((era) => (
          <button
            key={era}
            onClick={() => setActiveEra(era)}
            className={`text-xs px-2.5 py-1 border ${
              activeEra === era
                ? "border-slateblue-700 text-slateblue-700 bg-slateblue-50"
                : "border-ink-300 text-ink-600"
            }`}
          >
            {era}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter timeline…"
          className="search-input ml-auto px-2 py-1 text-xs w-48"
        />
      </div>
      <div className="mb-3 text-xs text-ink-400">{filtered.length} entries</div>

      {/* Timeline */}
      <div className="border-l-2 border-ink-200 ml-2">
        {filtered.map((t, i) => (
          <div key={i} className="relative pl-5 pb-4" id={`tl-${i}`}>
            <span className="absolute -left-[5px] top-1.5 w-2 h-2 bg-slateblue-500 rounded-full" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-400 font-mono">{t.date}</span>
              <span className="text-[10px] uppercase tracking-wide text-ink-400">{t.era}</span>
              <CanonBadge tier={t.canonTier} size="sm" showLabel={false} />
              {t.civilization && (
                <span className="text-[10px] text-ink-400">· {t.civilization}</span>
              )}
            </div>
            <div className="text-sm text-ink-800 mt-0.5">
              {t.relatedIds[0] ? (
                <Link href={`/wiki/${slugify(t.relatedIds[0])}`}>{t.title}</Link>
              ) : (
                t.title
              )}
            </div>
            {t.description && (
              <p className="text-xs text-ink-500 mt-0.5">{t.description}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-ink-400 italic text-sm pl-5">No entries match this filter.</p>
        )}
      </div>
    </div>
  );
}

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
