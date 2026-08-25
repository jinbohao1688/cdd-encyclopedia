// /science — Science hub: CDD physics, Φ framework, world layers.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CanonBadge } from "@/components/CanonBadge";
import { getArticlesByCategory, getArticleById, getCanonRegistry } from "@/lib/data";

export const metadata = { title: "Science" };

export default function SciencePage() {
  const physics = getArticlesByCategory("science")
    .filter((a) => a.id.startsWith("L0-PHY"))
    .sort((a, b) => a.id.localeCompare(b.id));
  const phiField = getArticleById("L0-PHY-003");
  const comparison = getArticleById("L0-PHY-CMP");

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Science</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Science</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The scientific foundation of the CDD universe — built on the master canon
        of Condensation-Dispersion Dynamics and the Φ framework. Physics axioms
        are TIER 0 (MASTER CANON): absolutely unmodifiable.
      </p>

      {/* Φ highlight */}
      {phiField && (
        <section id="phi" className="mb-8 border border-ink-300 bg-ivory-50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CanonBadge tier={phiField.canonTier} />
            <span className="text-xs text-ink-400 font-mono">{phiField.id}</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-ink-900">{phiField.title}</h2>
          {phiField.titleEn && (
            <div className="text-sm italic text-ink-500">{phiField.titleEn}</div>
          )}
          <p className="text-sm text-ink-600 mt-2 max-w-prose">{phiField.summary}</p>
          <Link href={`/wiki/${phiField.slug}`} className="text-sm text-slateblue-700 mt-2 inline-block">
            Read full article →
          </Link>
        </section>
      )}

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">
        Foundational Axioms (TIER 0)
      </h2>
      <div className="border border-ink-200 divide-y divide-ink-100 mb-8">
        {physics.map((a) => (
          <Link key={a.id} href={`/wiki/${a.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-ivory-50 hover:no-underline">
            <span className="font-mono text-xs text-ink-400 w-24 shrink-0">{a.id}</span>
            <div className="flex-1 min-w-0">
              <div className="font-serif font-semibold text-ink-900">{a.title}</div>
              <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{a.summary}</p>
            </div>
            <CanonBadge tier={a.canonTier} size="sm" showLabel={false} />
          </Link>
        ))}
      </div>

      {comparison && (
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2">
            CDD vs Reality Physics
          </h2>
          <Link href={`/wiki/${comparison.slug}`} className="text-sm text-slateblue-700">
            View comparison table →
          </Link>
        </section>
      )}

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">
        World Layers (scientific strata)
      </h2>
      <p className="text-sm text-ink-500 mb-3">
        The L0–L17 stratification spans cosmology, geology, biology, ecology and
        the intelligent-species layer.
      </p>
      <Link href="/layers" className="text-sm text-slateblue-700">Browse all layers →</Link>
    </PageShell>
  );
}
