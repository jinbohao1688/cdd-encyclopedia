// /layers — World Layers L0–L17 overview

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CanonBadge } from "@/components/CanonBadge";
import { getArticlesByCategory } from "@/lib/data";

export default function LayersPage() {
  const layers = getArticlesByCategory("world").filter((a) =>
    /^L\d+$/.test(a.id),
  );
  // ensure numeric sort L1..L17
  layers.sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1)));

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">World Layers</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">World Layers</h1>
      <p className="text-ink-500 mt-1 mb-6 max-w-prose">
        The CDD universe is organised into 18 canonical layers, from fundamental
        physics (L0) to the contemporary world (L17). Each layer is a stratum of
        worldbuilding with its own canon status.
      </p>
      <div className="border border-ink-200 divide-y divide-ink-100">
        {layers.map((l) => (
          <Link
            key={l.id}
            href={`/layer/${l.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-ivory-50 hover:no-underline"
          >
            <span className="font-mono text-sm text-ink-400 w-10 shrink-0">{l.id}</span>
            <div className="flex-1 min-w-0">
              <div className="font-serif font-semibold text-ink-900">{l.title}</div>
              <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{l.summary}</p>
            </div>
            <CanonBadge tier={l.canonTier} size="sm" showLabel={false} />
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
