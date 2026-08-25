// CDD Encyclopedia — Footer

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 mt-16 bg-ivory-50">
      <div className="max-w-article mx-auto px-6 py-8 text-sm text-ink-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="font-serif text-base font-semibold text-ink-800">CDD World Encyclopedia</div>
            <p className="mt-1 text-xs leading-relaxed">
              The authoritative public encyclopedia of the Condensation-Dispersion
              Dynamics universe.
            </p>
            <p className="mt-2 text-xs">Canon Version 2.0</p>
          </div>
          <div>
            <div className="nav-section-title mb-2">Reference</div>
            <ul className="space-y-1 text-xs">
              <li><Link href="/archive/canon-registry">Canon Registry</Link></li>
              <li><Link href="/archive/canonical-mysteries">Canonical Mysteries</Link></li>
              <li><Link href="/archive/sources">Source Archive</Link></li>
              <li><Link href="/about">About & Canon Policy</Link></li>
            </ul>
          </div>
          <div>
            <div className="nav-section-title mb-2">Content Basis</div>
            <p className="text-xs leading-relaxed">
              All content is derived verbatim from
              <span className="font-mono"> CDD_COMPLETE_WORLD_ARCHIVE_v2.0.md</span>.
              No facts invented. Unstated fields are marked UNRESOLVED.
            </p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-ink-100 text-[11px] text-ink-400">
          In-universe reference work. RECONSTRUCTED ≠ CANON · INFERENCE ≠ FACT ·
          STORY HOOK ≠ CANON · OPEN QUESTION ≠ ERROR.
        </div>
      </div>
    </footer>
  );
}
