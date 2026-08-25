// Minimal static file server for testing Next.js output: export (Cloudflare Pages parity)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "out");
const PORT = Number(process.env.PORT || 3125);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js":  "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function send(res, code, headers, body) {
  res.writeHead(code, { ...headers, "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  // Prevent path traversal
  const unsafe = urlPath.split("/").includes("..");
  if (unsafe) return send(res, 400, {}, "Bad Request");

  let filePath = path.join(ROOT, urlPath);

  // Cloudflare Pages clean-URL resolution (same as Pages default behavior):
  // 1. Exact match
  // 2. /foo → try /foo.html   (flat .html output)
  // 3. /foo → try /foo/index.html
  // 4. / → /index.html
  const candidates = [filePath];
  if (!path.extname(filePath)) {
    candidates.push(filePath + ".html");
    candidates.push(path.join(filePath, "index.html"));
  } else if (urlPath.endsWith("/")) {
    candidates.push(path.join(filePath, "index.html"));
  }

  let resolved = null;
  for (const c of candidates) {
    try {
      const st = fs.statSync(c);
      if (st.isFile()) { resolved = c; break; }
      if (st.isDirectory()) {
        const idx = path.join(c, "index.html");
        if (fs.existsSync(idx)) { resolved = idx; break; }
      }
    } catch { /* missing */ }
  }

  if (!resolved) {
    // Try /404.html (Cloudflare-style)
    const nf = path.join(ROOT, "404.html");
    if (fs.existsSync(nf)) {
      resolved = nf;
    } else {
      return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found: " + urlPath);
    }
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const content = fs.readFileSync(resolved);
  send(res, 200, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(content),
    "Cache-Control": ext === ".html" ? "public, max-age=0, must-revalidate" : "public, max-age=3600, immutable",
  }, content);
});

server.listen(PORT, () => {
  console.log(`Static out/ server running on http://localhost:${PORT} (root: ${ROOT})`);
});
