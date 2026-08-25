// CDD Encyclopedia — Wiki article dynamic route
// /wiki/[slug] — renders any encyclopedia article via ArticleView.

import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { Footer } from "@/components/Footer";
import { getAllArticles, getArticleBySlug } from "@/lib/data";

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return { title: "Not found" };
  return {
    title: `${article.title}${article.titleEn ? ` (${article.titleEn})` : ""}`,
    description: article.summary?.slice(0, 160),
  };
}

export default function WikiArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <ArticleView article={article} />
      </div>
      <Footer />
    </div>
  );
}
