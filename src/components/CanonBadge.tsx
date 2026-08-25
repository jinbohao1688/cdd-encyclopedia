// Canon Status badge — uses label + icon + tooltip (not color alone) for
// accessibility, per the encyclopedia spec.

import { getCanonMeta } from "@/lib/canon";
import type { CanonTier } from "@/lib/types";

export function CanonBadge({
  tier,
  showLabel = true,
  size = "md",
}: {
  tier: CanonTier | string;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const meta = getCanonMeta(tier);
  const label = showLabel ? meta.label : meta.shortLabel;
  return (
    <span
      className={`canon-badge ${meta.className} ${size === "sm" ? "text-[10px] px-1.5 py-0.5" : ""}`}
      title={meta.description}
      role="img"
      aria-label={`Canon: ${meta.label}. ${meta.description}`}
    >
      <span aria-hidden="true">{meta.iconName}</span>
      <span>{label}</span>
    </span>
  );
}
