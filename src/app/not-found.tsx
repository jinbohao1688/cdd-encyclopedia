import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-article mx-auto px-6 py-20 text-center">
        <div className="font-serif text-6xl text-ink-300 mb-4">404</div>
        <h1 className="font-serif text-2xl font-semibold text-ink-800 mb-2">
          Article not found
        </h1>
        <p className="text-ink-500 mb-6">
          The requested entry does not exist in the encyclopedia, or its ID has not
          been established in canon.
        </p>
        <Link href="/" className="text-slateblue-700">
          ← Return to Main Page
        </Link>
      </div>
      <Footer />
    </div>
  );
}
