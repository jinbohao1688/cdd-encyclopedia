// /timeline — the full CDD chronology with era filters.

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CanonBadge } from "@/components/CanonBadge";
import TimelineClient from "./TimelineClient";
import { getTimeline } from "@/lib/data";

export const metadata = { title: "Timeline" };

const ERAS = [
  "Geological",
  "Biological",
  "Prehistoric",
  "Ancient",
  "Imperial",
  "Industrial",
  "Modern",
];

export default function TimelinePage() {
  const timeline = getTimeline();
  return (
    <PageShell maxWidth="wide">
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">Timeline</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">Timeline</h1>
      <p className="text-ink-500 mt-1 mb-2 max-w-prose">
        The unified chronology of the CDD universe, from cosmic formation to the
        contemporary AI era. Each event carries its date, canon level, and related
        entities.
      </p>
      <p className="text-xs text-ink-400 mb-6 italic">
        Note: the source archive preserves original date units without
        Earth-year/P3-year conversion (per the “no self-conversion” rule). Dates
        are shown verbatim.
      </p>
      <TimelineClient entries={timeline} eras={ERAS} />
    </PageShell>
  );
}
