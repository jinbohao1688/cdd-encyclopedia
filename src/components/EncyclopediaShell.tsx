// Encyclopedia shell — responsive Wikipedia-style layout.
// Client component so it can manage the mobile sidebar drawer state and pass
// the toggle handler into the header.

"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export function EncyclopediaShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="shell">
      <Header onToggleSidebar={() => setDrawerOpen((v) => !v)} />
      <div className="flex">
        {/* Desktop sidebar — sticky, persistent */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-[49px] h-[calc(100vh-49px)]">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-ivory-50 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200">
                <span className="text-sm font-semibold text-ink-700">Navigation</span>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="text-ink-500">✕</button>
              </div>
              <div onClickCapture={(e) => {
                const t = e.target as HTMLElement;
                if (t.closest("a")) setDrawerOpen(false);
              }}>
                <Sidebar onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
