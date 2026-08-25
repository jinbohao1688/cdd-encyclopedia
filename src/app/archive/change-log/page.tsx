// /archive/change-log — v2.0 changelog. No fabricated history.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getChangeLog } from "@/lib/data";

export const metadata = { title: "Change Log" };

export default function ChangeLogPage() {
  const entries = getChangeLog();
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <Link href="/archive">Archives</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Change Log</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Change Log</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The v2.0 integration changelog. Every entry traces back to a specific Wave
        file or the integration audit. No revision history is fabricated — only
        recorded changes are shown.
      </p>

      <div className="mb-4 p-3 bg-ivory-100 border border-ink-200 text-xs text-ink-600">
        <strong>v2.0 statistics:</strong> 18 main changes (CHG-001–018), 2 MINIMAL
        REPAIRs, <strong>0 Retcons</strong>. The four Canonical Mysteries remain
        untouched.
      </div>

      <div className="border border-ink-200 divide-y divide-ink-100">
        {entries.map((c) => (
          <div key={c.id} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-ink-600">{c.id}</span>
              <span className="text-[10px] uppercase tracking-wide text-ink-400">[{c.type}]</span>
            </div>
            <p className="text-sm text-ink-700">{c.description}</p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="px-4 py-6 text-ink-400 italic text-sm">
            No recorded changes.
          </p>
        )}
      </div>
    </PageShell>
  );
}
