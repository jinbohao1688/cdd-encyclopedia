// One-off fixer: convert relative component/lib imports to the "@/ alias.
// Walks the filesystem directly (no git dependency).
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "e:/CCD世界/正典/cdd-encyclopedia/src";

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p, acc);
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      acc.push(p);
    }
  }
  return acc;
}

const files = walk(root);
let changed = 0;

for (const abs of files) {
  let src;
  try { src = readFileSync(abs, "utf-8"); } catch { continue; }
  const orig = src;
  // Replace any number of ../ leading to components/ or lib/
  src = src.replace(/from\s+["'](\.\.\/)+components\//g, 'from "@/components/');
  src = src.replace(/from\s+["'](\.\.\/)+lib\//g, 'from "@/lib/');
  // Also handle ./ for files inside app/ that import siblings like ../components
  src = src.replace(/from\s+["']\.\/components\//g, 'from "@/components/');
  src = src.replace(/from\s+["']\.\/lib\//g, 'from "@/lib/');
  if (src !== orig) {
    writeFileSync(abs, src, "utf-8");
    changed++;
    console.log("fixed:", abs.replace(root, ""));
  }
}
console.log("Total changed:", changed);
