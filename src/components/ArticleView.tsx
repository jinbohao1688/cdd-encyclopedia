// CDD Encyclopedia — Article view
// Wikipedia-style article page: title, canon badge, breadcrumb, infobox,
// table of contents, body sections (with auto wiki-links), open questions,
// canon conflicts, related articles, backlinks, sources.

import Link from "next/link";
import { CanonBadge } from "./CanonBadge";
import { WORLD_MAPS } from "@/lib/world-maps";
import { renderLinkedText } from "@/lib/wiki-links";
import type { Article } from "@/lib/types";
import { getBacklinks, getArticleById, getOpenQuestions, getCanonConflicts } from "@/lib/data";

const CATEGORY_LABELS: Record<string, string> = {
  science: "Science",
  world: "World",
  history: "History",
  people: "People",
  civilizations: "Civilizations",
  institutions: "Institutions",
  society: "Society",
  "modern-world": "Modern World",
  concept: "Concepts",
};

export function ArticleView({ article }: { article: Article }) {
  const backlinks = getBacklinks(article.id);
  const relatedResolved = article.related
    .map((id) => getArticleById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  // unique related by id
  const seen = new Set<string>();
  const relatedUnique = relatedResolved.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const relatedOpenQs = getOpenQuestions().filter((q) =>
    q.relatedArticles?.includes(article.id),
  );
  const relatedConflicts = getCanonConflicts().filter(
    (c) =>
      c.involvedEvents?.includes(article.id) ||
      c.involvedHistory?.includes(article.id),
  );

  const infoboxFields = Object.entries(article.fields ?? {}).filter(
    ([, v]) => v && v !== "UNRESOLVED",
  );

  // 选择相关的 Planet P3 地图在文章顶部展示
  let relatedMaps = [] as typeof WORLD_MAPS;
  {
    const id = article.id;
    const cat = article.category;
    if (
      cat === "civilizations" ||
      id.startsWith("CIV-") ||
      id.includes("CULTURAL") ||
      id.includes("REGION")
    ) {
      relatedMaps = WORLD_MAPS.filter((m) => m.id === "civilizations-regions");
    } else if (
      cat === "science" &&
      (id.startsWith("L2") ||
        id.startsWith("L3") ||
        id.startsWith("L4") ||
        id.includes("CSM") ||
        id.includes("GEO") ||
        id.includes("ECO"))
    ) {
      relatedMaps = WORLD_MAPS.filter((m) => m.id !== "civilizations-regions");
    } else if (cat === "world") {
      relatedMaps = WORLD_MAPS;
    }
  }

  return (
    <article className="max-w-article mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-3" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="mx-1">›</span>
        <Link href={`/category/${article.category}`}>
          {CATEGORY_LABELS[article.category] || article.category}
        </Link>
        <span className="mx-1">›</span>
        <span className="text-ink-500">{article.title}</span>
      </nav>

      {/* Title */}
      <header className="mb-1">
        <h1 className="text-3xl font-serif font-semibold text-ink-900 leading-tight">
          {article.title}
        </h1>
        {article.titleEn && article.titleEn !== "UNRESOLVED" && (
          <div className="text-lg text-ink-500 mt-0.5 font-serif italic">
            {article.titleEn}
          </div>
        )}
      </header>

      {/* Canon status row */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-ink-200">
        <CanonBadge tier={article.canonTier} />
        <span className="text-xs text-ink-400 font-mono">{article.id}</span>
        <span className="text-xs text-ink-400">·</span>
        <span className="text-xs text-ink-400">{article.canonStatusRaw}</span>
        <span className="ml-auto text-xs text-ink-400">Last updated: v2.0</span>
      </div>

      {/* Related atlas maps (for geography / climate / civilizations articles) */}
      {relatedMaps.length > 0 && (
        <div className="mb-6 border border-ink-200 rounded overflow-hidden bg-white">
          <div className="grid gap-0 grid-cols-1">
            {relatedMaps.map((m) => (
              <figure key={m.id} className={relatedMaps.length > 1 ? "border-b border-ivory-200 last:border-b-0" : ""}>
                <img
                  src={m.src}
                  alt={m.title}
                  loading="lazy"
                  className="w-full max-h-[380px] object-contain bg-ivory-50"
                />
                <figcaption className="px-4 py-2 border-t border-ivory-200 bg-ivory-50">
                  <div className="text-[12px] font-semibold text-ink-800">{m.title}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{m.description}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="article-prose flex-1 min-w-0">
          {/* Summary */}
          {article.summary && article.summary !== "UNRESOLVED" && (
            <p className="text-[15.5px] text-ink-700 mb-4">
              {renderLinkedText(article.summary)}
            </p>
          )}

          {/* Table of contents */}
          {article.body.length > 2 && (
            <details className="mb-5 border border-ink-200 bg-ivory-50" open>
              <summary className="px-3 py-2 text-sm font-semibold cursor-pointer text-ink-700">
                Contents
              </summary>
              <ol className="px-6 py-2 text-sm text-slateblue-700 list-decimal space-y-0.5">
                {article.body.map((s, i) => (
                  <li key={i}>
                    <a href={`#sec-${i}`}>{s.heading}</a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {/* Body sections */}
          {article.body.map((section, i) => (
            <section key={i} id={`sec-${i}`} className="mb-5 scroll-mt-20">
              <h2>{section.heading}</h2>
              {section.text && section.text !== "UNRESOLVED" && (
                <p>{renderLinkedText(section.text)}</p>
              )}
              {section.list && section.list.length > 0 && (
                <ul>
                  {section.list.map((item, j) => (
                    <li key={j}>{renderLinkedText(item)}</li>
                  ))}
                </ul>
              )}
              {(!section.text || section.text === "UNRESOLVED") &&
                (!section.list || section.list.length === 0) && (
                  <p className="text-ink-400 italic">Not specified in canon.</p>
                )}
            </section>
          ))}

          {/* Open questions */}
          {relatedOpenQs.length > 0 && (
            <section className="mb-5">
              <h2>Open Questions</h2>
              <ul>
                {relatedOpenQs.map((q) => (
                  <li key={q.id}>
                    <Link href={`/archive/open-questions#${q.id}`}>
                      {q.id}
                    </Link>
                    {q.question && q.question !== "UNRESOLVED" ? ` — ${q.question}` : ""}
                    <span className="text-xs text-ink-400 ml-2">[{q.status}]</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Canon conflicts */}
          {relatedConflicts.length > 0 && (
            <section className="mb-5">
              <h2>Canon Conflicts</h2>
              <ul>
                {relatedConflicts.map((c) => (
                  <li key={c.id}>
                    <Link href={`/archive/canon-conflicts#${c.id}`}>{c.id}</Link>
                    {c.title && c.title !== "UNRESOLVED" ? ` — ${c.title}` : ""}
                    <span className="text-xs text-ink-400 ml-2">[{c.status}]</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sources */}
          <section className="mb-5">
            <h2>Sources</h2>
            <ol className="list-decimal ml-5 text-sm text-ink-600 space-y-1">
              {article.sources.length > 0 ? (
                article.sources.map((s, i) => (
                  <li key={i}>
                    <span className="font-medium">{s.ref}</span>
                    <span className="text-ink-400"> · Section: {s.section}</span>
                    <span className="text-ink-400"> · Canonicality: {s.canonicality}</span>
                  </li>
                ))
              ) : (
                <li className="italic text-ink-400">No source recorded.</li>
              )}
            </ol>
          </section>

          {/* What links here */}
          {backlinks.length > 0 && (
            <section className="mb-5">
              <h2>What Links Here</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {backlinks.slice(0, 20).map((b) => (
                  <li key={b.id}>
                    <Link href={`/wiki/${b.slug}`}>{b.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Infobox */}
        {infoboxFields.length > 0 && (
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 self-start">
            <table className="infobox w-full">
              <tbody>
                <tr>
                  <th colSpan={2} className="text-center !block py-2">
                    <div className="font-serif text-base text-ink-900">{article.title}</div>
                    {article.titleEn && article.titleEn !== "UNRESOLVED" && (
                      <div className="text-xs italic text-ink-500 font-sans">{article.titleEn}</div>
                    )}
                  </th>
                </tr>
                {infoboxFields.map(([k, v]) => (
                  <tr key={k} className="border-t border-ink-200">
                    <th className="px-2 py-1 align-top">{k}</th>
                    <td className="px-2 py-1">{renderLinkedText(v as string)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {article.aliases.length > 0 && (
              <div className="mt-2 px-1 text-[11px] text-ink-400">
                Also: {article.aliases.join(", ")}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Related articles */}
      {relatedUnique.length > 0 && (
        <section className="mt-8 pt-5 border-t border-ink-200">
          <h2 className="text-xl font-serif font-semibold mb-3 text-ink-800">Related Knowledge</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {relatedUnique.slice(0, 9).map((r) => (
              <Link
                key={r.id}
                href={`/wiki/${r.slug}`}
                className="card block p-3 hover:no-underline"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-900">{r.title}</span>
                  <CanonBadge tier={r.canonTier} size="sm" showLabel={false} />
                </div>
                <div className="text-[11px] text-ink-400 mt-1 font-mono">{r.id}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
