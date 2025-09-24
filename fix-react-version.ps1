# Fix mismatched React/react-native-renderer versions
# Uso: Ejecutar desde la raíz del proyecto o con:
#   powershell -ExecutionPolicy Bypass -File .\fix-react-version.ps1

# Moverse al directorio del script (normalmente la raíz del proyecto si lo guardaste ahí)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "Directorio de trabajo: $PWD"

function Get-PackageVersionFromNodeModules($pkgName) {
    $path = Join-Path -Path $PWD -ChildPath "node_modules\$pkgName\package.json"
    if (Test-Path $path) {
        try {
            return (Get-Content $path -Raw | ConvertFrom-Json).version
        } catch { return $null }
    }
    return $null
}

# Leer versiones actuales
$reactVersion = Get-PackageVersionFromNodeModules 'react'
$rendererVersion = Get-PackageVersionFromNodeModules 'react-native-renderer'

# Intentar leer desde package-lock.json si falta alguna
if (-not $rendererVersion -and (Test-Path .\package-lock.json)) {
    $lock = Get-Content .\package-lock.json -Raw
    if ($lock -match '"react-native-renderer"\s*:\s*"([^"]+)"') { $rendererVersion = $matches[1] }
}
if (-not $reactVersion -and (Test-Path .\package-lock.json)) {
    $lock = Get-Content .\package-lock.json -Raw
    if ($lock -match '"react"\s*:\s*"([^"]+)"') { $reactVersion = $matches[1] }
}

Write-Host "react -> $reactVersion"
Write-Host "react-native-renderer -> $rendererVersion"

if (-not $reactVersion -or -not $rendererVersion) {
    Write-Host "No se pudieron detectar ambas versiones. Asegúrate de que \"node_modules\" existe o pega aquí las versiones manualmente." -ForegroundColor Red
    exit 1
}

if ($reactVersion -eq $rendererVersion) {
    Write-Host "Las versiones ya coinciden ($reactVersion). No se requiere acción." -ForegroundColor Green
    exit 0
}

# Decidir versión objetivo: alinear react a la versión del renderer
$targetVersion = $rendererVersion
Write-Host "Alinear 'react' a la versión del renderer: $targetVersion" -ForegroundColor Cyan

# Backup de archivos importantes
$ts = (Get-Date).ToString('yyyyMMddHHmmss')
if (Test-Path .\package.json) { Copy-Item .\package.json ".\package.json.bak.$ts" -Force }
if (Test-Path .\package-lock.json) { Copy-Item .\package-lock.json ".\package-lock.json.bak.$ts" -Force }

# Actualizar package.json
try {
    $pkg = Get-Content .\package.json -Raw | ConvertFrom-Json
    if ($pkg.dependencies -and $pkg.dependencies.react) {
        $pkg.dependencies.react = $targetVersion
    } elseif ($pkg.devDependencies -and $pkg.devDependencies.react) {
        $pkg.devDependencies.react = $targetVersion
    } else {
        if (-not $pkg.dependencies) { $pkg | Add-Member -MemberType NoteProperty -Name dependencies -Value @{} }
        $pkg.dependencies.react = $targetVersion
    }
    $pkg | ConvertTo-Json -Depth 10 | Set-Content .\package.json -Encoding UTF8
    Write-Host "package.json actualizado: react -> $targetVersion"
} catch {
    Write-Host "Error al actualizar package.json: $_" -ForegroundColor Red
    exit 1
}

# Borrar node_modules y package-lock.json
Write-Host "Eliminando node_modules y package-lock.json..." -ForegroundColor Yellow
if (Test-Path .\node_modules) { Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue }
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue

# Verificar caché npm y reinstalar
Write-Host "Verificando caché npm..."
try { npm cache verify } catch { Write-Host "npm cache verify devolvió un error, se continúa..." -ForegroundColor Yellow }

Write-Host "Instalando dependencias (salida en npm-install-log.txt)..."
npm install --no-audit --no-fund 2>&1 | Tee-Object -FilePath .\npm-install-log.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install falló. Revisa npm-install-log.txt y pega las últimas líneas si necesitas ayuda." -ForegroundColor Red
    exit 1
}

# Mostrar versiones finales
$finalReact = Get-PackageVersionFromNodeModules 'react'
$finalRenderer = Get-PackageVersionFromNodeModules 'react-native-renderer'
Write-Host "Instalación completada. Versiones finales:" -ForegroundColor Green
Write-Host "react -> $finalReact"
Write-Host "react-native-renderer -> $finalRenderer"

Write-Host "Ahora reinicia Metro con: npx expo start -c" -ForegroundColor Green
