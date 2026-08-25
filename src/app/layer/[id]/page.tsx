// /layer/[id] — a single world layer (renders as a wiki article).

import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { Footer } from "@/components/Footer";
import { getAllArticles, getArticleById } from "@/lib/data";

export function generateStaticParams() {
  return getAllArticles()
    .filter((a) => /^L\d+$/.test(a.id))
    .map((a) => ({ id: a.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const layer = getArticleById(params.id);
  return { title: layer ? `${layer.id} — ${layer.title}` : "Layer" };
}

export default function LayerPage({ params }: { params: { id: string } }) {
  const layer = getArticleById(params.id);
  if (!layer) notFound();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <ArticleView article={layer} />
      </div>
      <Footer />
    </div>
  );
}
