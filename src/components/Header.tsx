// CDD Encyclopedia — Top header with global search box

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { search, type SearchResult } from "@/lib/search";

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const r = search(query, 10);
    setResults(r);
    setOpen(true);
    setFocused(-1);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(entry: SearchResult["entry"]) {
    setOpen(false);
    setQuery("");
    router.push(`/wiki/${entry.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focused >= 0) go(results[focused].entry);
      else router.push(`/search?q=${encodeURIComponent(query.trim())}`), setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <header className="header-bar sticky top-0 z-30">
      <div className="flex items-center gap-4 px-4 py-2.5">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1 -ml-1 text-ink-600"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        {/* Logo / wordmark */}
        <Link href="/" className="flex items-baseline gap-2 shrink-0 hover:no-underline">
          <span className="font-serif text-xl font-semibold text-ink-900 tracking-tight">CDD</span>
          <span className="hidden sm:inline text-[11px] text-ink-500 leading-tight max-w-[180px]">
            Condensation-Dispersion<br />Dynamics
          </span>
        </Link>

        {/* Search */}
        <div ref={boxRef} className="relative flex-1 max-w-2xl mx-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search CDD World Encyclopedia…"
            aria-label="Search the encyclopedia"
            className="search-input w-full px-3 py-1.5 text-sm rounded-sm"
          />
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-ink-200 shadow-sm max-h-[60vh] overflow-y-auto z-40">
              {results.map((r, i) => (
                <button
                  key={r.entry.id}
                  onClick={() => go(r.entry)}
                  onMouseEnter={() => setFocused(i)}
                  className={`w-full text-left px-3 py-2 border-b border-ink-100 last:border-0 ${
                    focused === i ? "bg-ivory-100" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink-900">{r.entry.title}</span>
                    <span className="text-[10px] uppercase tracking-wide text-ink-400">{r.entry.id}</span>
                  </div>
                  {r.entry.summary && (
                    <div className="text-xs text-ink-500 line-clamp-1 mt-0.5">{r.entry.summary}</div>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 bg-ivory-50 text-xs text-slateblue-700 hover:bg-ivory-100"
              >
                See all results for “{query}” →
              </button>
            </div>
          )}
        </div>

        {/* Right nav */}
        <nav className="hidden md:flex items-center gap-3 text-[13px] shrink-0">
          <Link href="/timeline" className="text-ink-600 hover:text-slateblue-700">Timeline</Link>
          <Link href="/random" className="text-ink-600 hover:text-slateblue-700">Random</Link>
          <Link href="/about" className="text-ink-600 hover:text-slateblue-700">About</Link>
        </nav>
      </div>
    </header>
  );
}
