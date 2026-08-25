// Shared page wrapper for non-article pages: adds top spacing + footer.

import { Footer } from "./Footer";

export function PageShell({
  children,
  maxWidth = "article",
}: {
  children: React.ReactNode;
  maxWidth?: "article" | "wide";
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className={`mx-auto w-full px-4 sm:px-6 py-6 ${maxWidth === "article" ? "max-w-article" : "max-w-[1280px]"}`}>
        {children}
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
