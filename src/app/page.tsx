// CDD World Encyclopedia — Home page
// Wikipedia-style landing: intro, search hint, featured article, explore the
// world, current world overview, world layers, timeline preview, canonical
// mysteries, recently updated.

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { CanonBadge } from "@/components/CanonBadge";
import {
  getArticleById,
  getArticlesByType,
  getCanonicalMysteries,
  getTimeline,
  getStats,
  getCanonRegistry,
} from "@/lib/data";
import { renderLinkedText } from "@/lib/wiki-links";

export default function HomePage() {
  const featured = getArticleById("L0-PHY-003"); // 凝度场 Φ — TIER 0
  const civilizations = getArticlesByType("civilization").filter(
    (c) => c.id !== "CIV-006",
  );
  const civ006 = getArticleById("CIV-006");
  const timeline = getTimeline().slice(0, 12);
  const mysteries = getCanonicalMysteries();
  const stats = getStats();
  const tiers = getCanonRegistry().tiers;

  const exploreEntries = [
    { label: "History", href: "/category/history", desc: "Events, eras & chronology" },
    { label: "Science", href: "/science", desc: "CDD physics & Φ framework" },
    { label: "Civilizations", href: "/civilizations", desc: "The five extant civilizations" },
    { label: "People", href: "/people", desc: "Historical & founding figures" },
    { label: "Institutions", href: "/institutions", desc: "Governments, organizations" },
    { label: "Society", href: "/society", desc: "Family, medicine, religion" },
    { label: "Modern World", href: "/modern-world", desc: "Politics, trade, AI systems" },
    { label: "Mysteries", href: "/archive/canonical-mysteries", desc: "Permanently unresolved" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {/* Hero / intro */}
        <section className="border-b border-ink-200 bg-ivory-50">
          <div className="max-w-article mx-auto px-6 py-10">
            <h1 className="font-serif text-4xl font-semibold text-ink-900 tracking-tight">
              CDD World Encyclopedia
            </h1>
            <p className="mt-2 text-lg text-ink-600 italic font-serif">
              The authoritative public encyclopedia of the Condensation-Dispersion
              Dynamics universe.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Browse the world through history, science, civilizations,
              institutions, people, and systems.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-400">
              <span>{stats.articles} articles</span>
              <span>· {stats.characters} people</span>
              <span>· {stats.institutions} institutions</span>
              <span>· {stats.civilizations} civilizations</span>
              <span>· {stats.events} documented events</span>
              <span>· {stats.timelineEntries} timeline entries</span>
              <span>· Canon v2.0</span>
            </div>
          </div>
        </section>

        <div className="max-w-article mx-auto px-6 py-8 space-y-12">
          {/* Featured Article */}
          {featured && (
            <section>
              <SectionTitle eyebrow="Featured Article" title="凝度场 Φ" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 article-prose">
                  <div className="flex items-center gap-3 mb-2">
                    <CanonBadge tier={featured.canonTier} />
                    <span className="text-xs text-ink-400 font-mono">{featured.id}</span>
                  </div>
                  <p>{renderLinkedText(featured.summary)}</p>
                  <Link href={`/wiki/${featured.slug}`} className="text-sm text-slateblue-700">
                    Read full article →
                  </Link>
                </div>
                <aside className="border border-ink-200 bg-ivory-50 p-4 text-sm">
                  <div className="font-serif font-semibold text-ink-800 mb-2">At a glance</div>
                  <dl className="space-y-1.5 text-xs">
                    {Object.entries(featured.fields)
                      .filter(([, v]) => v && v !== "UNRESOLVED")
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-ink-400 shrink-0">{k}:</dt>
                          <dd className="text-ink-700">{v}</dd>
                        </div>
                      ))}
                  </dl>
                </aside>
              </div>
            </section>
          )}

          {/* Explore the World */}
          <section>
            <SectionTitle eyebrow="Explore the World" title="Browse by domain" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {exploreEntries.map((e) => (
                <Link key={e.href} href={e.href} className="card p-4 hover:no-underline">
                  <div className="font-serif text-base font-semibold text-ink-900">{e.label}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{e.desc}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* Current World Overview — Five Civilizations */}
          <section>
            <SectionTitle eyebrow="Current World Overview" title="The Five Extant Civilizations" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {civilizations.map((c) => (
                <Link key={c.id} href={`/wiki/${c.slug}`} className="card p-4 hover:no-underline">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-lg font-semibold text-ink-900">{c.title}</span>
                    <CanonBadge tier={c.canonTier} size="sm" showLabel={false} />
                  </div>
                  {c.titleEn && c.titleEn !== "UNRESOLVED" && (
                    <div className="text-xs italic text-ink-500">{c.titleEn}</div>
                  )}
                  <p className="text-xs text-ink-600 mt-2 line-clamp-3">{c.summary}</p>
                  <div className="text-[10px] text-ink-400 mt-2 font-mono">{c.id}</div>
                </Link>
              ))}
              {civ006 && (
                <div className="card p-4 border-dashed bg-ivory-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-lg font-semibold text-ink-700">{civ006.title}</span>
                    <CanonBadge tier={civ006.canonTier} size="sm" showLabel={false} />
                  </div>
                  <p className="text-xs text-ink-500 mt-2 italic">
                    Reconstructed analytical framework — not an independent extant civilization.
                  </p>
                  <Link href={`/wiki/${civ006.slug}`} className="text-xs text-slateblue-700 mt-2 inline-block">
                    View framework →
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* World Layers L0–L17 */}
          <section>
            <SectionTitle eyebrow="World Layers" title="The L0–L17 stratification" />
            <p className="text-sm text-ink-500 mb-3">
              The CDD universe is organised into 18 canonical layers, from fundamental physics
              (L0) to the contemporary world (L17). Each is a clickable entry.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tiers.length > 0 && (
                <Link href="/layers" className="text-xs px-2.5 py-1 border border-ink-300 text-ink-600 hover:border-slateblue-500 hover:text-slateblue-700">
                  All layers →
                </Link>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {LAYERS.map((l) => (
                <Link
                  key={l.id}
                  href={`/layer/${l.id}`}
                  className="text-xs px-2 py-1 bg-ivory-100 border border-ink-200 text-ink-700 hover:border-slateblue-500 hover:text-slateblue-700"
                >
                  <span className="font-mono text-ink-400">{l.id}</span>{" "}
                  {l.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Timeline preview */}
          <section>
            <SectionTitle eyebrow="Timeline" title="Abridged chronology" />
            <div className="border-l-2 border-ink-200 ml-2">
              {timeline.map((t, i) => (
                <div key={i} className="relative pl-5 pb-3">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 bg-slateblue-500 rounded-full" />
                  <div className="text-xs text-ink-400 font-mono">{t.date}</div>
                  <div className="text-sm text-ink-800">
                    {t.relatedIds[0] ? (
                      <Link href={`/wiki/${slugify(t.relatedIds[0])}`}>{t.title}</Link>
                    ) : (
                      t.title
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/timeline" className="text-sm text-slateblue-700 mt-2 inline-block">
              View full timeline →
            </Link>
          </section>

          {/* Canonical Mysteries */}
          {mysteries.length > 0 && (
            <section>
              <SectionTitle eyebrow="Canonical Mysteries" title="Permanently unresolved" />
              <p className="text-sm text-ink-500 mb-3 italic">
                Questions that the CDD canon intentionally refuses to answer.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mysteries.map((m) => (
                  <div key={m.id} className="mystery-callout p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs text-ink-600">{m.id}</span>
                      <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                        Permanently Unresolved
                      </span>
                    </div>
                    <div className="font-serif font-semibold text-ink-900">{m.title}</div>
                    <p className="text-xs text-ink-600 mt-1">{m.description}</p>
                    <Link href={`/archive/canonical-mysteries#${m.id}`} className="text-xs text-slateblue-700 mt-2 inline-block">
                      View entry →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{eyebrow}</div>
      <h2 className="font-serif text-2xl font-semibold text-ink-900 mt-0.5">{title}</h2>
    </div>
  );
}

const LAYERS = [
  { id: "L1", name: "Cosmology" },
  { id: "L2", name: "Geology" },
  { id: "L3", name: "Atmosphere" },
  { id: "L4", name: "Oceanography" },
  { id: "L5", name: "Biochemistry" },
  { id: "L6", name: "Ecology" },
  { id: "L7", name: "Intelligent Species" },
  { id: "L8", name: "Prehistory" },
  { id: "L9", name: "Ancient History" },
  { id: "L10", name: "Geography" },
  { id: "L11", name: "Imperial Era" },
  { id: "L12", name: "Industrial Era" },
  { id: "L13", name: "AI Era" },
  { id: "L14", name: "Language" },
  { id: "L15", name: "Economy" },
  { id: "L16", name: "Religion & Philosophy" },
  { id: "L17", name: "Modern World" },
];

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
