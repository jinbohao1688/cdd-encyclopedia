// /archive/open-questions — registry of open questions. Never auto-answered.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getOpenQuestions, getCanonicalMysteries } from "@/lib/data";

export const metadata = { title: "Open Questions" };

export default function OpenQuestionsPage() {
  const all = getOpenQuestions();
  const mysteries = getCanonicalMysteries();
  const mysteryIds = new Set(mysteries.map((m) => m.id));
  const mysteryIdsRelated = new Set([
    "OP-L13-001",
    ...all.filter((q) => q.isCanonicalMystery).map((q) => q.id),
  ]);

  const regular = all.filter((q) => !mysteryIdsRelated.has(q.id));
  const mysteryRelated = all.filter((q) => mysteryIdsRelated.has(q.id));

  const byLayer: Record<string, typeof regular> = {};
  for (const q of regular) {
    const key = q.layer || "Unspecified";
    (byLayer[key] ||= []).push(q);
  }
  const layers = Object.keys(byLayer).sort();

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <Link href="/archive">Archives</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Open Questions</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Open Questions</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The registry of unresolved questions, gaps, and system questions. The
        encyclopedia <strong>never</strong> auto-generates answers. Each question
        preserves its original ID, layer, and status exactly.
      </p>

      <div className="mb-4 p-3 bg-ivory-100 border border-ink-200 text-xs text-ink-600">
        <strong>Rule:</strong> OPEN QUESTION ≠ ERROR. An open question is a
        recorded gap, not a defect to be patched. Resolved items keep their
        RESOLVED status; unresolved items remain OPEN indefinitely.
      </div>

      {mysteryRelated.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2">
            Canonical Mystery — Related
          </h2>
          <p className="text-xs text-ink-500 mb-3 italic">
            These questions are bound to the four permanent Canonical Mysteries
            and must never be answered. See the Mysteries archive.
          </p>
          <QuestionList questions={mysteryRelated} />
        </section>
      )}

      {layers.map((layer) => (
        <section key={layer} className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-ink-800 mb-2">{layer}</h2>
          <QuestionList questions={byLayer[layer]} />
        </section>
      ))}
    </PageShell>
  );
}

function QuestionList({ questions }: { questions: ReturnType<typeof getOpenQuestions> }) {
  return (
    <div className="border border-ink-200 divide-y divide-ink-100">
      {questions.map((q) => (
        <div key={q.id} id={q.id} className="px-4 py-3 scroll-mt-20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-ink-600">{q.id}</span>
            <span className="text-[10px] uppercase tracking-wide text-ink-400">[{q.status}]</span>
            {q.isCanonicalMystery && (
              <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                Canonical Mystery
              </span>
            )}
          </div>
          <p className="text-sm text-ink-800 mt-1">{q.question}</p>
          {q.assignedDomain && q.assignedDomain !== "UNRESOLVED" && (
            <p className="text-xs text-ink-400 mt-0.5">Domain: {q.assignedDomain}</p>
          )}
          {q.canonImpact && q.canonImpact !== "UNRESOLVED" && (
            <p className="text-xs text-ink-400">Canon impact: {q.canonImpact}</p>
          )}
        </div>
      ))}
    </div>
  );
}
