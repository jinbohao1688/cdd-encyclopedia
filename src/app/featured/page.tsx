// /featured — a curated selection of TIER 0 / TIER 1 articles.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CanonBadge } from "@/components/CanonBadge";
import { getArticleById } from "@/lib/data";

export const metadata = { title: "Featured Articles" };

const FEATURED_IDS = [
  "L0-PHY-003", // 凝度场 Φ
  "L0-PHY-008", // 凝化方程 L-2
  "L1", // 宇宙学与恒星系
  "CIV-002", // 维罗
  "CIV-005", // 黑潮
  "INS-016", // 凝界公约体系
  "HIS-EVT-061", // 凝一号 / 零日凝峰
  "HIS-EVT-056", // CDD theory
  "CHAR-012", // 维析 (AI consciousness hook)
];

export default function FeaturedPage() {
  const articles = FEATURED_IDS
    .map((id) => getArticleById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Featured Articles</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Featured Articles</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        A curated selection of foundational and pivotal entries.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {articles.map((a) => (
          <Link key={a.id} href={`/wiki/${a.slug}`} className="card p-4 hover:no-underline">
            <div className="flex items-center justify-between gap-2">
              <span className="font-serif font-semibold text-ink-900">{a.title}</span>
              <CanonBadge tier={a.canonTier} size="sm" showLabel={false} />
            </div>
            <p className="text-xs text-ink-500 mt-1 line-clamp-2">{a.summary}</p>
            <div className="text-[10px] text-ink-400 mt-2 font-mono">{a.id}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
