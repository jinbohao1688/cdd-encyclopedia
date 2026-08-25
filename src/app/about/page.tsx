// /about — about + canon policy.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CANON_INTEGRITY_RULES } from "@/lib/canon";
import { getStats } from "@/lib/data";

export const metadata = { title: "About" };

export default function AboutPage() {
  const stats = getStats();
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">About</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">
        About the CDD World Encyclopedia
      </h1>
      <p className="text-ink-600 mt-3 max-w-prose leading-relaxed">
        The CDD World Encyclopedia is the authoritative public encyclopedia of the
        Condensation-Dispersion Dynamics universe. It is presented as an
        in-universe reference work — not an author&rsquo;s notes site, not a novel
        promo page, and not a game wiki. Its voice is encyclopedic, neutral, and
        academic.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mt-6 mb-2">
        Content Basis
      </h2>
      <p className="text-sm text-ink-600 max-w-prose">
        All content derives verbatim from{" "}
        <span className="font-mono">CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md</span>. No
        facts are invented. Fields the archive does not specify are shown as{" "}
        <span className="font-mono">UNRESOLVED</span> rather than filled in. The
        encyclopedia currently indexes {stats.articles} articles across{" "}
        {stats.civilizations} civilizations, {stats.institutions} institutions,{" "}
        {stats.characters} people, and {stats.events} documented historical events.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mt-6 mb-2">
        Canon Policy
      </h2>
      <p className="text-sm text-ink-600 max-w-prose mb-3">
        The CDD canon is stratified into eight tiers, TIER 0 (MASTER CANON)
        through TIER 7 (STORY HOOK). The encyclopedia faithfully preserves these
        tiers and never promotes low-tier content to high-tier canon.
      </p>
      <ul className="text-sm text-ink-700 list-disc ml-5 space-y-1.5 mb-2">
        {CANON_INTEGRITY_RULES.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mt-6 mb-2">
        The Four Canonical Mysteries
      </h2>
      <p className="text-sm text-ink-600 max-w-prose">
        The universe contains four deliberately permanent unknowns. The
        encyclopedia does not — and will not — answer them:
      </p>
      <ul className="text-sm text-ink-700 list-disc ml-5 space-y-1 mt-2">
        <li><span className="font-mono">OP-L13-001</span> — whether AI possesses true self-awareness</li>
        <li>The Black Tide&rsquo;s ~28,000-year prehistoric gap</li>
        <li><span className="font-mono">CANON CONFLICT-001</span> — the S3 Norh-Arc group timing question</li>
        <li><span className="font-mono">CANON CONFLICT-003 / Issue 006</span> — the Central Sea Maritime Alliance mediation timing question</li>
      </ul>
      <p className="text-sm text-ink-500 mt-2">
        See the{" "}
        <Link href="/archive/canonical-mysteries">Canonical Mysteries archive</Link>.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mt-6 mb-2">
        Editing
      </h2>
      <p className="text-sm text-ink-600 max-w-prose">
        Editing is restricted to authorized Canon maintainers. Public visitors may
        browse but not modify articles.
      </p>

      <div className="mt-8 text-xs text-ink-400">
        Canon Version 2.0 · Source: CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md
      </div>
    </PageShell>
  );
}
