// Knowledge graph — client-side SVG renderer with hover highlighting.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";

interface Edge { from: string; to: string }

const TYPE_COLOR: Record<string, string> = {
  civilization: "#3d5570",
  institution: "#5b7a99",
  event: "#7a5a00",
  concept: "#2a3c50",
  person: "#525252",
};

function slugify(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function KnowledgeGraphClient({
  anchors,
  edges,
}: {
  anchors: Article[];
  edges: Edge[];
}) {
  const [hover, setHover] = useState<string | null>(null);

  // Position nodes in a circle
  const W = 900, H = 600, R = 220;
  const cx = W / 2, cy = H / 2;
  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    anchors.forEach((a, i) => {
      const angle = (i / anchors.length) * Math.PI * 2 - Math.PI / 2;
      map[a.id] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });
    return map;
  }, [anchors]);

  const linkedToHover = useMemo(() => {
    if (!hover) return new Set<string>();
    const s = new Set<string>([hover]);
    for (const e of edges) {
      if (e.from === hover) s.add(e.to);
      if (e.to === hover) s.add(e.from);
    }
    return s;
  }, [hover, edges]);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto border border-ink-200 bg-ivory-50" role="img" aria-label="Knowledge graph">
        {/* Edges */}
        {edges.map((e, i) => {
          const p1 = positions[e.from], p2 = positions[e.to];
          if (!p1 || !p2) return null;
          const active = !hover || hover === e.from || hover === e.to;
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={active ? "#5b7a99" : "#e0d8c0"}
              strokeWidth={active ? 1.5 : 0.8}
              opacity={active ? 0.7 : 0.3}
            />
          );
        })}
        {/* Nodes */}
        {anchors.map((a) => {
          const p = positions[a.id];
          if (!p) return null;
          const isHover = hover === a.id;
          const isLinked = linkedToHover.has(a.id);
          const dim = hover && !isLinked;
          const color = TYPE_COLOR[a.type] || "#525252";
          return (
            <g
              key={a.id}
              transform={`translate(${p.x},${p.y})`}
              onMouseEnter={() => setHover(a.id)}
              onMouseLeave={() => setHover(null)}
              opacity={dim ? 0.25 : 1}
              style={{ cursor: "pointer" }}
            >
              <Link href={`/wiki/${slugify(a.id)}`} prefetch={false}>
                <circle
                  r={isHover ? 9 : 7}
                  fill={color}
                  stroke="#fbfaf6"
                  strokeWidth={2}
                />
                <text
                  y={-14}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#1a1a1a"
                  fontFamily="serif"
                >
                  {a.title.length > 8 ? a.title.slice(0, 7) + "…" : a.title}
                </text>
                <text
                  y={22}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#8a8a8a"
                  fontFamily="monospace"
                >
                  {a.id}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-500">
        {Object.entries(TYPE_COLOR).map(([t, c]) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            {t}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-400">
        Hover a node to highlight its connections. Click to open the article. This
        is an abridged graph of anchor entities — full relationships are listed on
        each article page under “Related Knowledge”.
      </p>
    </div>
  );
}
