// /archive — index of all archive sections.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "Archives" };

const ARCHIVES = [
  { href: "/archive/canon-registry", label: "Canon Registry", desc: "The TIER 0–7 hierarchy and integrity rules." },
  { href: "/archive/open-questions", label: "Open Questions", desc: "Registry of unresolved questions and gaps." },
  { href: "/archive/canon-conflicts", label: "Canon Conflicts", desc: "Recorded tensions between sources (never auto-resolved)." },
  { href: "/archive/canonical-mysteries", label: "Canonical Mysteries", desc: "The four permanently unresolved mysteries." },
  { href: "/archive/sources", label: "Source Archive", desc: "Master list of source documents." },
  { href: "/archive/change-log", label: "Change Log", desc: "The v2.0 integration changelog (0 Retcons)." },
];

export default function ArchiveIndexPage() {
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Archives</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Archives</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The reference apparatus of the encyclopedia — canon registry, open
        questions, conflicts, the permanent mysteries, sources, and the change
        log.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ARCHIVES.map((a) => (
          <Link key={a.href} href={a.href} className="card p-4 hover:no-underline">
            <div className="font-serif font-semibold text-ink-900">{a.label}</div>
            <div className="text-xs text-ink-500 mt-0.5">{a.desc}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
