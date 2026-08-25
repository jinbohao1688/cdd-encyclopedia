// /institutions — index of all institutions.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ArticleList } from "@/components/ArticleList";
import { getArticlesByType } from "@/lib/data";

export const metadata = { title: "Institutions" };

export default function InstitutionsPage() {
  const all = getArticlesByType("institution").sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const established = all.filter((a) => a.canonTier !== "TIER 6");
  const proposed = all.filter((a) => a.canonTier === "TIER 6");

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Institutions</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Institutions</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Governments, organisations, religious bodies, scientific institutions, and
        international entities. Each retains its original INS-xxx or PIN-xxx ID.
        Proposed institutions (PIN-001) are clearly marked and not treated as
        established.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2">
        Established / Reconstructed
      </h2>
      <div className="mb-3 text-xs text-ink-400">{established.length} entries</div>
      <ArticleList articles={established} />

      {proposed.length > 0 && (
        <>
          <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2 mt-8">
            Proposed
          </h2>
          <p className="text-xs text-ink-500 mb-3 italic">
            Candidate institutions not yet established in canon. Do not treat as
            extant.
          </p>
          <ArticleList articles={proposed} />
        </>
      )}
    </PageShell>
  );
}
