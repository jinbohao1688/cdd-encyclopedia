// CDD Encyclopedia — Wikipedia-style left sidebar navigation

import Link from "next/link";

interface NavGroup {
  title: string;
  links: { label: string; href: string }[];
}

const NAV: NavGroup[] = [
  {
    title: "CDD Encyclopedia",
    links: [
      { label: "Main Page", href: "/" },
      { label: "Featured Articles", href: "/featured" },
      { label: "Random Article", href: "/random" },
      { label: "Recent Changes", href: "/recent-changes" },
    ],
  },
  {
    title: "World",
    links: [
      { label: "Universe & Planet P3", href: "/category/world" },
      { label: "World Layers (L0–L17)", href: "/layers" },
      { label: "Geography", href: "/maps" },
      { label: "Timeline", href: "/timeline" },
    ],
  },
  {
    title: "History",
    links: [
      { label: "Historical Events", href: "/category/history" },
      { label: "Prehistory (L8)", href: "/layer/L8" },
      { label: "Ancient History (L9)", href: "/layer/L9" },
      { label: "Imperial Era (L11)", href: "/layer/L11" },
      { label: "Industrial Era (L12)", href: "/layer/L12" },
    ],
  },
  {
    title: "People",
    links: [
      { label: "All Characters", href: "/people" },
      { label: "Historical Figures", href: "/people?type=historical" },
      { label: "Founding Figures", href: "/people?founding=1" },
    ],
  },
  {
    title: "Civilizations",
    links: [
      { label: "All Civilizations", href: "/civilizations" },
      { label: "双河 (Shuanghe)", href: "/wiki/civ-001" },
      { label: "维罗 (Vero)", href: "/wiki/civ-002" },
      { label: "中央海 (Central Sea)", href: "/wiki/civ-003" },
      { label: "诺弧 (Norh Arc)", href: "/wiki/civ-004" },
      { label: "黑潮 (Black Tide)", href: "/wiki/civ-005" },
    ],
  },
  {
    title: "Institutions",
    links: [
      { label: "All Institutions", href: "/institutions" },
      { label: "Governments", href: "/institutions?type=government" },
      { label: "Universities", href: "/institutions?type=university" },
      { label: "International Orgs", href: "/institutions?type=international" },
    ],
  },
  {
    title: "Society",
    links: [
      { label: "Social Life", href: "/society" },
      { label: "Family & Marriage", href: "/society#family" },
      { label: "Medicine", href: "/society#medicine" },
      { label: "Religion & Philosophy", href: "/society#religion" },
      { label: "Currency", href: "/society#currency" },
      { label: "Festivals", href: "/society#festivals" },
    ],
  },
  {
    title: "Science",
    links: [
      { label: "CDD Physics", href: "/science" },
      { label: "Φ Framework", href: "/science#phi" },
      { label: "CDD vs Reality", href: "/wiki/l0-phy-cmp" },
      { label: "World Layers", href: "/layers" },
    ],
  },
  {
    title: "Modern World",
    links: [
      { label: "Political Systems", href: "/modern-world" },
      { label: "Global Systems", href: "/modern-world#global" },
      { label: "AI Supply Chain", href: "/modern-world#ai-supply-chain" },
    ],
  },
  {
    title: "Archives",
    links: [
      { label: "Canon Registry", href: "/archive/canon-registry" },
      { label: "Open Questions", href: "/archive/open-questions" },
      { label: "Canon Conflicts", href: "/archive/canon-conflicts" },
      { label: "Canonical Mysteries", href: "/archive/canonical-mysteries" },
      { label: "Source Archive", href: "/archive/sources" },
      { label: "Change Log", href: "/archive/change-log" },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="sidebar h-full overflow-y-auto px-4 py-5" aria-label="Encyclopedia navigation">
      {NAV.map((group) => (
        <div key={group.title} className="mb-5">
          <div className="nav-section-title mb-1.5">{group.title}</div>
          <ul className="space-y-0.5">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="nav-link" onClick={onNavigate}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="mt-6 pt-4 border-t border-ink-200 text-[11px] text-ink-400">
        <div>Canon Version 2.0</div>
        <div className="mt-1">Source: CDD_COMPLETE_WORLD_ARCHIVE_v2.0</div>
      </div>
    </nav>
  );
}
