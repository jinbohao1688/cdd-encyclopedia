// CDD Encyclopedia — root layout
// Wikipedia-style three-pane: header, persistent left sidebar, main content.

import type { Metadata } from "next";
import "./globals.css";
import { EncyclopediaShell } from "@/components/EncyclopediaShell";

export const metadata: Metadata = {
  title: {
    default: "CDD World Encyclopedia",
    template: "%s — CDD World Encyclopedia",
  },
  description:
    "The authoritative public encyclopedia of the Condensation-Dispersion Dynamics universe. Browse history, science, civilizations, institutions, people, and systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <EncyclopediaShell>{children}</EncyclopediaShell>
      </body>
    </html>
  );
}
