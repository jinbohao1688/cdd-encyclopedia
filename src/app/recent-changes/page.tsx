// /recent-changes — mirrors the v2.0 changelog (no fabricated history).

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getChangeLog } from "@/lib/data";

export const metadata = { title: "Recent Changes" };

export default function RecentChangesPage() {
  const entries = getChangeLog();
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Recent Changes</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Recent Changes</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The encyclopedia does not fabricate revision history. The only recorded
        changes are those of the v2.0 integration. See the full{" "}
        <Link href="/archive/change-log">Change Log</Link>.
      </p>
      <div className="border border-ink-200 divide-y divide-ink-100">
        {entries.slice(0, 30).map((c) => (
          <div key={c.id} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-ink-600">{c.id}</span>
              <span className="text-[10px] uppercase tracking-wide text-ink-400">[{c.type}]</span>
            </div>
            <p className="text-sm text-ink-700">{c.description}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
