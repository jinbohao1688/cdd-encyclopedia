// /archive/sources — source archive.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getSources } from "@/lib/data";

export const metadata = { title: "Source Archive" };

export default function SourcesPage() {
  const sources = getSources();
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <Link href="/archive">Archives</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Sources</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Source Archive</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Every article in the encyclopedia cites its source. This is the master
        list of source documents. All content derives from the single v2.0
        assembly file; no facts are invented.
      </p>
      <div className="space-y-4">
        {sources.map((s) => (
          <div key={s.ref} className="border border-ink-200 p-4">
            <div className="font-serif font-semibold text-ink-900">{s.title}</div>
            <div className="font-mono text-xs text-ink-500 mt-0.5">{s.ref}</div>
            <div className="text-xs text-ink-400 mt-1">{s.canonicality}</div>
            <p className="text-sm text-ink-600 mt-2">{s.description}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
