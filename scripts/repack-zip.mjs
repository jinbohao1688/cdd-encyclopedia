// Repack out/ into a zip for Cloudflare Pages.
// Uses archiver-free approach via child_process + System.IO.Compression through a simpler path.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const outDir   = process.env.OUT_DIR   ?? "E:/CCD世界/正典/cdd-encyclopedia/out";
const zipFinal = process.env.ZIP_FINAL ?? "E:/CCD世界/正典/cdd-encyclopedia/cdd-encyclopedia.zip";
const zipTmp   = zipFinal.replace(/\.zip$/, ".tmp.zip");

// 1. Remove existing
for (const p of [zipTmp, zipFinal]) if (fs.existsSync(p)) fs.unlinkSync(p);

// 2. Compress via PowerShell using byte-wise paths (avoid script file encoding issues)
const psCmd = `
$ErrorActionPreference = 'Stop'
$outDir   = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${Buffer.from(outDir).toString("base64")}'))
$zipTmp   = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${Buffer.from(zipTmp).toString("base64")}'))
$zipFinal = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${Buffer.from(zipFinal).toString("base64")}'))
Compress-Archive -Path (Join-Path $outDir "*") -DestinationPath $zipTmp -CompressionLevel Optimal -Force
if (-not (Test-Path $zipTmp)) { throw "TMP_ZIP_MISSING" }
Move-Item $zipTmp $zipFinal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [System.IO.Compression.ZipFile]::OpenRead($zipFinal)
$names = $z.Entries.FullName
Write-Host ("ENTRIES="       + $z.Entries.Count)
Write-Host ("HAS_headers="   + ($names -contains "_headers"))
Write-Host ("HAS_redirects=" + ($names -contains "_redirects"))
Write-Host ("HAS_index="     + ($names -contains "index.html"))
Write-Host ("HAS_404="       + ($names -contains "404.html"))
Write-Host ("CSS_FILES="     + (@($names -match "^_next[/\\\\]static[/\\\\]css[/\\\\].+\\.css$").Count))
Write-Host ("JS_FILES="      + (@($names -match "^_next[/\\\\]static[/\\\\]chunks[/\\\\].+\\.js$").Count))
Write-Host ("SIZE="          + (Get-Item $zipFinal).Length)
$z.Dispose()
`;

try {
  const out = execSync(`powershell -NoProfile -Command "${psCmd.replace(/"/g, '"""')}"`, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
  process.stdout.write(out);
  process.exit(0);
} catch (e) {
  process.stderr.write("ERROR:\n" + (e.stdout ?? "") + "\n" + (e.stderr ?? e.message) + "\n");
  process.exit(1);
}
