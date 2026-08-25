// /maps — geographic index. Old-map + academic style, clickable regions.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { getArticlesByType, getArticleById } from "@/lib/data";

export const metadata = { title: "Maps" };

// Geographic regions from the source archive (L10 geography layer)
const REGIONS = [
  { name: "P3", nameEn: "Planet P3", desc: "The world itself — orbit, rotation, geology.", articleId: "L1" },
  { name: "阿斯兰", nameEn: "Aslan", desc: "The largest main continent.", articleId: "L10" },
  { name: "双河平原", nameEn: "Shuanghe Plain", desc: "Cradle of the 双河 civilization.", articleId: "CIV-001" },
  { name: "维罗", nameEn: "Vero", desc: "Mineral-rich northern region.", articleId: "CIV-002" },
  { name: "诺弧高原", nameEn: "Norh Arc Plateau", desc: "Highland priest-state.", articleId: "CIV-004" },
  { name: "中央海", nameEn: "Central Sea", desc: "Trade maritime region.", articleId: "CIV-003" },
  { name: "南环海", nameEn: "South Ring Sea", desc: "Southern oceanic region.", articleId: "L4" },
  { name: "西极洋", nameEn: "West Polar Ocean", desc: "Western ocean.", articleId: "L4" },
  { name: "黑潮弧群", nameEn: "Black Tide Arc Islands", desc: "Island arc civilization.", articleId: "CIV-005" },
  { name: "凝脊山口", nameEn: "Ningji Mountain Pass", desc: "Trade corridor between civilizations.", articleId: "L10" },
];

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function MapsPage() {
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Maps</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Geography</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        Geographic regions of the CDD universe, drawn from the L10 geography layer
        and civilization records. Each region links to its encyclopedia entry.
      </p>

      <div className="border border-ink-300 bg-ivory-50 p-6 mb-8">
        <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">
          Cartographic note
        </div>
        <p className="text-sm text-ink-600 italic">
          A formal atlas of P3 is recorded as a SOCIAL GAP in the source archive.
          The entries below index the geographic entities established in canon;
          precise coastlines and borders are not specified.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REGIONS.map((r) => {
          const article = getArticleById(r.articleId);
          return (
            <Link
              key={r.name}
              href={`/wiki/${slugify(r.articleId)}`}
              className="card p-4 hover:no-underline"
            >
              <div className="font-serif text-lg font-semibold text-ink-900">{r.name}</div>
              <div className="text-xs italic text-ink-500">{r.nameEn}</div>
              <p className="text-xs text-ink-600 mt-2">{r.desc}</p>
              <div className="text-[10px] text-ink-400 mt-2 font-mono">{r.articleId}</div>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
