// /civilizations — index of civilizations with the CIV-006 special warning.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CanonBadge } from "@/components/CanonBadge";
import { getArticlesByType, getArticleById } from "@/lib/data";

export const metadata = { title: "Civilizations" };

export default function CivilizationsPage() {
  const civs = getArticlesByType("civilization").sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const extant = civs.filter((c) => c.id !== "CIV-006");
  const civ006 = getArticleById("CIV-006");

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Civilizations</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Civilizations</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The five extant civilizations of the CDD universe, plus the reconstructed
        Pan-Aslan civilizational sphere.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">
        Five Extant Civilizations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {extant.map((c) => (
          <Link key={c.id} href={`/wiki/${c.slug}`} className="card p-5 hover:no-underline">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl font-semibold text-ink-900">{c.title}</div>
                {c.titleEn && c.titleEn !== "UNRESOLVED" && (
                  <div className="text-xs italic text-ink-500">{c.titleEn}</div>
                )}
              </div>
              <CanonBadge tier={c.canonTier} size="sm" showLabel={false} />
            </div>
            <p className="text-sm text-ink-600 mt-2 line-clamp-3">{c.summary}</p>
            <div className="text-[10px] text-ink-400 mt-3 font-mono">{c.id}</div>
          </Link>
        ))}
      </div>

      {civ006 && (
        <>
          <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">
            Reconstructed Framework
          </h2>
          <Link href={`/wiki/${civ006.slug}`} className="card block p-5 border-dashed hover:no-underline">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl font-semibold text-ink-700">{civ006.title}</div>
                {civ006.titleEn && civ006.titleEn !== "UNRESOLVED" && (
                  <div className="text-xs italic text-ink-500">{civ006.titleEn}</div>
                )}
              </div>
              <CanonBadge tier={civ006.canonTier} size="sm" showLabel={false} />
            </div>
            <p className="text-sm text-ink-600 mt-2 italic">
              Reconstructed analytical framework / not an independent extant
              civilization. Do not list as a sixth extant civilization.
            </p>
            <div className="text-[10px] text-ink-400 mt-3 font-mono">{civ006.id}</div>
          </Link>
        </>
      )}
    </PageShell>
  );
}
