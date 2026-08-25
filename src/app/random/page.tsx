// /random — client-side redirect to a random canon article.
// Uses client redirect so it works with static export (Cloudflare Pages).
// Excludes PROPOSED (TIER 6) and STORY HOOK (TIER 7) by default.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRandomArticle } from "@/lib/data";

export default function RandomPage() {
  const router = useRouter();
  useEffect(() => {
    const article = getRandomArticle(false);
    router.replace(`/wiki/${article.slug}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-ink-500 text-sm">
      <div className="text-center">
        <div className="text-ink-700 font-semibold mb-1">Redirecting…</div>
        Picking a random canon article.
      </div>
    </div>
  );
}
