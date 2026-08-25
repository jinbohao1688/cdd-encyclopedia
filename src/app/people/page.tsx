// /people — index of all characters.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ArticleList } from "@/components/ArticleList";
import { getArticlesByType } from "@/lib/data";

export const metadata = { title: "People" };

export default function PeoplePage() {
  const people = getArticlesByType("person").sort((a, b) => a.id.localeCompare(b.id));
  const historical = people.filter((p) => !p.id.startsWith("FF-"));
  const founding = people.filter((p) => p.id.startsWith("FF-"));

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">People</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">People</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Historical figures, founding figures, and named individuals of the CDD
        universe. Character slots retain their original CHAR-xxx IDs; founding
        figures are deliberately kept at FOUNDING FIGURE status and not upgraded
        to CHAR numbering.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2">
        Historical Characters
      </h2>
      <div className="mb-3 text-xs text-ink-400">{historical.length} entries</div>
      <ArticleList articles={historical} />

      {founding.length > 0 && (
        <>
          <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2 mt-8">
            Founding Figures
          </h2>
          <p className="text-xs text-ink-500 mb-3 italic">
            Not upgraded to CHAR-xxx numbering — see PART IV Appendix.
          </p>
          <ArticleList articles={founding} />
        </>
      )}
    </PageShell>
  );
}
