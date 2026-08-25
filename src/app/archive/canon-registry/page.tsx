// /archive/canon-registry — the TIER hierarchy and canon rules.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CanonBadge } from "@/components/CanonBadge";
import { CANON_TIERS, CANON_INTEGRITY_RULES } from "@/lib/canon";
import { getCanonRegistry } from "@/lib/data";

export const metadata = { title: "Canon Registry" };

export default function CanonRegistryPage() {
  const registry = getCanonRegistry();
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <Link href="/archive">Archives</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Canon Registry</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Canon Registry</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The CDD canon hierarchy — eight tiers from MASTER CANON (TIER 0) to STORY
        HOOK (TIER 7). Low-tier content is never auto-promoted. The four
        Canonical Mysteries sit at TIER 5 and are permanently unresolved.
      </p>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">Tier Hierarchy</h2>
      <div className="border border-ink-200 divide-y divide-ink-100 mb-8">
        {CANON_TIERS.map((t) => (
          <div key={t.tier} className="px-4 py-3 flex items-start gap-4">
            <div className="shrink-0 pt-0.5">
              <CanonBadge tier={t.tier} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-ink-400">{t.tier}</div>
              <p className="text-sm text-ink-600 mt-1">{t.description}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">Integrity Rules</h2>
      <div className="bg-ivory-100 border border-ink-200 p-4">
        <ul className="text-sm text-ink-700 list-disc ml-5 space-y-1.5">
          {registry.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 text-xs text-ink-400">
        See also: <Link href="/archive/canonical-mysteries">Canonical Mysteries</Link>
        {" · "}<Link href="/archive/canon-conflicts">Canon Conflicts</Link>
        {" · "}<Link href="/archive/change-log">Change Log</Link>
      </div>
    </PageShell>
  );
}
