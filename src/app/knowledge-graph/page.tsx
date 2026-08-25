// /knowledge-graph — relationship graph of major entities.
// Pure SVG, no heavy deps. Nodes are clickable.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import KnowledgeGraphClient from "./KnowledgeGraphClient";
import { getArticlesByType, getArticleById, getAllArticles } from "@/lib/data";

export const metadata = { title: "Knowledge Graph" };

export default function KnowledgeGraphPage() {
  // Pick anchor nodes: the five civilizations + key institutions + key people + Φ
  const civs = getArticlesByType("civilization").filter((c) => c.id !== "CIV-006");
  const anchorIds = [
    "L0-PHY-003", // Φ
    ...civs.map((c) => c.id),
    "INS-016", // 凝界公约体系
    "HIS-EVT-061", // 凝一号 / 零日凝峰
    "HIS-EVT-056", // CDD theory
  ];
  const anchors = anchorIds
    .map((id) => getArticleById(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  // Edges derived from related[] (source → target)
  const allArticles = getAllArticles();
  const idSet = new Set(anchors.map((a) => a.id));
  const edges: { from: string; to: string }[] = [];
  for (const a of anchors) {
    for (const r of a.related) {
      if (idSet.has(r)) edges.push({ from: a.id, to: r });
    }
  }
  // also pull in institutions that reference civs
  for (const a of allArticles) {
    if (a.type !== "institution") continue;
    for (const r of a.related) {
      if (idSet.has(r) && idSet.has(a.id)) {
        edges.push({ from: a.id, to: r });
      }
    }
  }

  return (
    <PageShell maxWidth="wide">
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Knowledge Graph</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Knowledge Graph</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        A relationship map of anchor entities — the five civilizations, the Φ
        field, the 凝界公约体系, and pivotal events. Nodes are clickable.
      </p>
      <KnowledgeGraphClient anchors={anchors} edges={edges} />
    </PageShell>
  );
}
