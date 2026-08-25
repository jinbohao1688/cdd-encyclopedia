// /society and /modern-world — hub pages for social & modern systems.
// These are sections of the source archive; articles live across categories.
// We provide navigation hubs rather than fabricated content.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getArticlesByType, getStats } from "@/lib/data";

export const metadata = { title: "Society" };

const SECTIONS = [
  { id: "family", label: "Family & Marriage", desc: "Five-civilization family structures" },
  { id: "medicine", label: "Medicine", desc: "凝迹诊断技术 and per-civilization healthcare" },
  { id: "religion", label: "Religion & Philosophy", desc: "Spiritual and philosophical traditions" },
  { id: "currency", label: "Currency", desc: "Five currencies and cross-border settlement" },
  { id: "festivals", label: "Festivals", desc: "Five-civilization festivals" },
  { id: "education", label: "Education", desc: "Founding educational institutions" },
];

export default function SocietyPage() {
  const civs = getArticlesByType("civilization").filter((c) => c.id !== "CIV-006");

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Society</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Society</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Social life across the five civilizations — family, medicine, religion,
        currency, festivals, and education. Derived from PART VII of the source
        archive; social structures marked NEW HISTORICAL CANON are distinguished
        from base SOCIAL GAP entries.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="card p-4 hover:no-underline">
            <div className="font-serif font-semibold text-ink-900">{s.label}</div>
            <div className="text-xs text-ink-500 mt-0.5">{s.desc}</div>
          </a>
        ))}
      </div>

      <h2 className="font-serif text-xl font-semibold text-ink-800 mb-3">
        By Civilization
      </h2>
      <div className="border border-ink-200 divide-y divide-ink-100">
        {civs.map((c) => (
          <Link key={c.id} href={`/wiki/${c.slug}`} className="block px-4 py-3 hover:bg-ivory-50 hover:no-underline">
            <span className="font-serif font-semibold text-ink-900">{c.title}</span>
            <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{c.summary}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-ink-400 mt-6 italic">
        Detailed social-system content is recorded in the source archive (PART
        VII). Per-civilization entries are accessible via each civilization page.
      </p>
    </PageShell>
  );
}
