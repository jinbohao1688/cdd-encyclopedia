// /archive/canon-conflicts — conflicts are never auto-resolved.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getCanonConflicts } from "@/lib/data";

export const metadata = { title: "Canon Conflicts" };

const STATUS_LABELS: Record<string, string> = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  "CANONICAL MYSTERY": "CANONICAL MYSTERY",
  "SYSTEM QUESTION": "SYSTEM QUESTION",
};

export default function CanonConflictsPage() {
  const conflicts = getCanonConflicts();
  const groups: Record<string, typeof conflicts> = { OPEN: [], RESOLVED: [], "CANONICAL MYSTERY": [], "SYSTEM QUESTION": [] };
  for (const c of conflicts) {
    const key = STATUS_LABELS[c.status] || "OPEN";
    (groups[key] ||= []).push(c);
  }

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <Link href="/archive">Archives</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Canon Conflicts</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Canon Conflicts</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Recorded tensions between sources. The encyclopedia presents competing
        interpretations <strong>without</strong> adjudicating — it does not pick a
        winner. An OPEN conflict is a deliberately preserved tension, not an error.
      </p>

      <div className="mb-4 p-3 bg-ivory-100 border border-ink-200 text-xs text-ink-600">
        <strong>Rule:</strong> When two sources disagree, both are shown. The
        encyclopedia states “the academy is divided on this matter”, never “the AI
        resolved the contradiction”.
      </div>

      {(["CANONICAL MYSTERY", "OPEN", "SYSTEM QUESTION", "RESOLVED"] as const).map((status) => {
        const list = groups[status] || [];
        if (list.length === 0) return null;
        return (
          <section key={status} className="mb-8">
            <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2">
              {status}
              <span className="ml-2 text-xs font-normal text-ink-400">({list.length})</span>
            </h2>
            <div className="space-y-3">
              {list.map((c) => (
                <div key={c.id} id={c.id} className="border border-ink-200 p-4 scroll-mt-20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-ink-600">{c.id}</span>
                    {status === "OPEN" && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-700">
                        Deliberately unresolved
                      </span>
                    )}
                    {status === "CANONICAL MYSTERY" && (
                      <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                        Permanently unresolved
                      </span>
                    )}
                  </div>
                  <div className="font-serif font-semibold text-ink-900">{c.title}</div>
                  <p className="text-sm text-ink-600 mt-1">{c.description}</p>

                  {c.interpretations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs uppercase tracking-wide text-ink-400 mb-1">
                        Competing interpretations
                      </div>
                      <ul className="text-sm text-ink-700 list-disc ml-5 space-y-1">
                        {c.interpretations.map((itp, i) => (
                          <li key={i}>{itp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(c.involvedEvents.length > 0 || c.involvedHistory.length > 0) && (
                    <div className="mt-3 text-xs text-ink-400">
                      {c.involvedEvents.length > 0 && <div>Events: {c.involvedEvents.join(", ")}</div>}
                      {c.involvedHistory.length > 0 && <div>History: {c.involvedHistory.join(", ")}</div>}
                    </div>
                  )}

                  {status === "CANONICAL MYSTERY" && (
                    <Link href="/archive/canonical-mysteries" className="text-xs text-slateblue-700 mt-2 inline-block">
                      See Canonical Mysteries archive →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </PageShell>
  );
}
