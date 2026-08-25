$outDir     = 'E:\CCD世界\正典\cdd-encyclopedia\out'
$zipFinal    = 'E:\CCD世界\正典\cdd-encyclopedia\cdd-encyclopedia.zip'
$zipTmp      = 'E:\CCD世界\正典\cdd-encyclopedia\cdd-encyclopedia.tmp.zip'
Remove-Item $zipTmp  -Force -ErrorAction SilentlyContinue
Remove-Item $zipFinal -Force -ErrorAction SilentlyContinue

try {
  Compress-Archive -Path (Join-Path $outDir '*') -DestinationPath $zipTmp -CompressionLevel Optimal -Force
  if (-not (Test-Path $zipTmp)) { Write-Host 'ERR: tmp zip missing'; exit 3 }
  Move-Item $zipTmp $zipFinal -Force

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $z = [System.IO.Compression.ZipFile]::OpenRead($zipFinal)
  $names = $z.Entries.FullName
  $cssCount = @($names -match '^_next[/\\]static[/\\]css[/\\].+\.css$').Count
  $jsCount  = @($names -match '^_next[/\\]static[/\\]chunks[/\\].+\.js$').Count
  Write-Host ("ENTRIES="       + $z.Entries.Count)
  Write-Host ("HAS_headers="   + ($names -contains '_headers'))
  Write-Host ("HAS_redirects=" + ($names -contains '_redirects'))
  Write-Host ("HAS_index="     + ($names -contains 'index.html'))
  Write-Host ("HAS_404="       + ($names -contains '404.html'))
  Write-Host ("CSS_FILES="     + $cssCount)
  Write-Host ("JS_FILES="      + $jsCount)
  Write-Host ("SIZE="          + (Get-Item $zipFinal).Length)
  $z.Dispose()
  exit 0
} catch {
  Write-Host ("ERR: " + $_)
  exit 4
}
