// /modern-world — Modern World Systems hub.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getArticlesByType, getOpenQuestions } from "@/lib/data";

export const metadata = { title: "Modern World" };

const SECTIONS = [
  { id: "political", label: "Political Systems", desc: "Government structures of the five civilizations" },
  { id: "global", label: "Global Systems", desc: "凝界公约体系, trade & data governance" },
  { id: "ai-supply-chain", label: "AI Supply Chain", desc: "Five-step global AI supply chain" },
  { id: "international", label: "International Organizations", desc: "Multilateral bodies" },
];

export default function ModernWorldPage() {
  const institutions = getArticlesByType("institution").filter((a) => {
    // Modern-era political entities (post-imperial) — heuristic by ID range
    const n = parseInt(a.id.replace(/^INS-0?/, "").replace(/^INS-/, ""));
    return !Number.isNaN(n) && n >= 9;
  });
  const osqs = getOpenQuestions().filter((q) => q.id.startsWith("OSQ-"));

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Modern World</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Modern World</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Contemporary political and global systems of the CDD universe — government
        structures, the 凝界公约体系, the global AI supply chain, and international
        organisations. Derived from PART VIII of the source archive.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="card p-4 hover:no-underline">
            <div className="font-serif font-semibold text-ink-900">{s.label}</div>
            <div className="text-xs text-ink-500 mt-0.5">{s.desc}</div>
          </a>
        ))}
      </div>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">
        Modern Institutions
      </h2>
      <div className="border border-ink-200 divide-y divide-ink-100 mb-8">
        {institutions.map((a) => (
          <Link key={a.id} href={`/wiki/${a.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ivory-50 hover:no-underline">
            <span className="font-mono text-xs text-ink-400 w-20 shrink-0">{a.id}</span>
            <div className="flex-1 min-w-0">
              <div className="font-serif font-semibold text-ink-900">{a.title}</div>
              <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{a.summary}</p>
            </div>
          </Link>
        ))}
      </div>

      {osqs.length > 0 && (
        <>
          <h2 id="open-system-questions" className="font-serif text-xl font-semibold text-ink-800 mb-3">
            Open System Questions
          </h2>
          <div className="border border-ink-200 divide-y divide-ink-100">
            {osqs.map((q) => (
              <Link key={q.id} href={`/archive/open-questions#${q.id}`} className="block px-4 py-3 hover:bg-ivory-50 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-400">{q.id}</span>
                  <span className="text-[10px] uppercase text-ink-400">[{q.status}]</span>
                </div>
                <p className="text-sm text-ink-700 mt-0.5">{q.question}</p>
              </Link>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-3 italic">
            OSQ-007 (global AI supply-chain node-failure cascade) is of mixed
            RECONSTRUCTED SYSTEM / STORY HOOK nature and does not constitute a
            confirmed crisis-response institution.
          </p>
        </>
      )}
    </PageShell>
  );
}
