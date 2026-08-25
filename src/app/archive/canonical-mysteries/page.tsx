// /archive/canonical-mysteries — the four permanent mysteries.
// Visually distinct from regular wiki pages. Never resolved.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getCanonicalMysteries } from "@/lib/data";

export const metadata = { title: "Canonical Mysteries" };

export default function CanonicalMysteriesPage() {
  const mysteries = getCanonicalMysteries();

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <Link href="/archive">Archives</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Canonical Mysteries</span>
      </nav>

      <h1 className="font-serif text-3xl font-semibold text-ink-900">Canonical Mysteries</h1>
      <p className="text-ink-500 italic mt-1 mb-2 font-serif">
        Questions that the CDD canon intentionally refuses to answer.
      </p>

      <div className="mystery-callout p-4 mb-6 text-sm text-ink-700">
        <strong>Canonical Rule:</strong> No official resolution exists. These are
        not errors to be fixed or puzzles to be solved — they are permanent
        unknowns of the universe. The encyclopedia must not auto-generate, infer,
        or settle any of them, nor display speculation as canon.
      </div>

      <div className="space-y-5">
        {mysteries.map((m, i) => (
          <article key={m.id} id={m.id} className="mystery-callout p-5 scroll-mt-20">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="font-mono text-xs text-ink-600">Mystery {String(i + 1).padStart(2, "0")} · {m.id}</div>
                <h2 className="font-serif text-xl font-semibold text-ink-900 mt-1">{m.title}</h2>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold whitespace-nowrap">
                Permanently Unresolved
              </span>
            </div>
            <p className="text-sm text-ink-700">{m.description}</p>
            <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs text-ink-500">
              <div><strong className="text-ink-700">Status:</strong> {m.status}</div>
              <div className="mt-0.5"><strong className="text-ink-700">Canonical Rule:</strong> {m.canonicalRule}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 text-xs text-ink-400">
        Related: <Link href="/archive/open-questions">Open Questions registry</Link>
        {" · "}
        <Link href="/archive/canon-conflicts">Canon Conflicts</Link>
      </div>
    </PageShell>
  );
}
