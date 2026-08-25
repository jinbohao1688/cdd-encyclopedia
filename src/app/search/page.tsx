// /search — full search results page.
// Static-export safe: search params are read client-side in SearchResults.

import { Suspense } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import SearchResults from "./SearchResults";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Search</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900 mb-1">Search</h1>
      <p className="text-ink-500 mb-4 text-sm">
        Full-text search across titles, IDs, aliases, summaries, and article bodies.
      </p>
      <Suspense fallback={
        <div className="border border-ink-200 bg-ivory-50 p-6 text-center text-ink-500">
          Loading search…
        </div>
      }>
        <SearchResults />
      </Suspense>
    </PageShell>
  );
}
