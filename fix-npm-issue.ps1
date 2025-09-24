# ...existing code...
$workspace = "C:\Users\Usuario\Desktop\Raveapp"

if (-not (Test-Path $workspace)) {
    Write-Host "La ruta $workspace no existe. Ejecuta desde el equipo correcto." -ForegroundColor Red
    exit 1
}

Set-Location $workspace

$timestamp = (Get-Date).ToString("yyyyMMddHHmmss")

if (Test-Path .\package-lock.json) {
    Copy-Item .\package-lock.json ".\package-lock.json.bak.$timestamp" -Force
    Write-Host "Backup creado: package-lock.json.bak.$timestamp"
}

# Buscar referencias problemáticas
$patterns = @('..\..\..\..','file:../../../','"undefined"')
$found = $false
if (Test-Path .\package-lock.json) {
    foreach ($p in $patterns) {
        $matches = Select-String -Path .\package-lock.json -Pattern $p -ErrorAction SilentlyContinue
        if ($matches) {
            Write-Host "Referencias problemáticas para patrón '$p':"
            $matches | ForEach-Object { Write-Host "  $_" }
            $found = $true
        }
    }
}

if (-not $found) {
    Write-Host "No se detectaron referencias obvias en package-lock.json."
}

# Eliminar lockfile y node_modules
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue

Write-Host "Ejecutando: npm cache verify"
try {
    npm cache verify
} catch {
    Write-Host "npm cache verify devolvió un error, pero se continúa." -ForegroundColor Yellow
}

Write-Host "Ejecutando: npm install --verbose (salida guardada en npm-install-log.txt)"
npm install --verbose 2>&1 | Tee-Object -FilePath .\npm-install-log.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "npm install completado correctamente."
} else {
    Write-Host "npm install falló con código de salida $LASTEXITCODE. Revisa npm-install-log.txt" -ForegroundColor Red
}
# ...existing code...