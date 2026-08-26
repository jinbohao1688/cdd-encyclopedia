// /category/[category] — list all articles in a category.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleList } from "@/components/ArticleList";
import { PageShell } from "@/components/PageShell";
import { MapGallery } from "@/components/MapGallery";
import { getArticlesByCategory } from "@/lib/data";

const CATEGORIES: Record<string, { label: string; description: string }> = {
  science: { label: "Science", description: "CDD physics, the Φ framework, and scientific layers." },
  world: { label: "World", description: "The universe, planet P3, and its world layers." },
  history: { label: "History", description: "Historical events and eras of the CDD universe." },
  people: { label: "People", description: "Historical figures, founders, and characters." },
  civilizations: { label: "Civilizations", description: "Civilizations and political entities." },
  institutions: { label: "Institutions", description: "Governments, organisations, and bodies." },
  society: { label: "Society", description: "Social life, family, medicine, and culture." },
  "modern-world": { label: "Modern World", description: "Contemporary political and global systems." },
  concept: { label: "Concepts", description: "Foundational concepts and definitions." },
};

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const meta = CATEGORIES[params.category];
  return { title: meta ? meta.label : "Category" };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const meta = CATEGORIES[params.category];
  if (!meta) notFound();
  const articles = getArticlesByCategory(params.category).sort((a, b) =>
    a.title.localeCompare(b.title, "zh"),
  );

  return (
    <PageShell>
      <nav className="breadcrumb mb-3">
        <Link href="/">Home</Link> <span className="mx-1">›</span>
        <span className="text-ink-500">{meta.label}</span>
      </nav>
      <h1 className="font-serif text-3xl font-semibold text-ink-900">{meta.label}</h1>
      <p className="text-ink-500 mt-1 mb-4">{meta.description}</p>
      {/* World / Civilizations categories show the atlas */}
      {["world", "civilizations", "science"].includes(params.category) && (
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-400 mb-2">
            Atlas · Planet P3
          </div>
          <MapGallery />
        </div>
      )}
      <div className="mb-4 text-xs text-ink-400">{articles.length} entries</div>
      <ArticleList articles={articles} />
    </PageShell>
  );
}
