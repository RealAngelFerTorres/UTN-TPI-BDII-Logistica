# Script para restaurar la base de datos de prueba desde el resguardo
# IMPORTANTE:
# Se intentará restaurar a partir de archivo ubicado en carpeta con fecha de hoy
# Si ya hay una db restaurada por este script, entonces no se restaurará nada

$ErrorActionPreference = "Stop"

# Raíz del proyecto
$raiz = Split-Path $PSScriptRoot -Parent

# Cargar variables desde .env
$archivoEnv = Join-Path $raiz ".env"

if (Test-Path $archivoEnv) {
    Get-Content $archivoEnv | ForEach-Object {
        if ($_ -match '^\s*([^#=\s][^=]*)=(.*)$') {
            $valor = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable(
                $matches[1].Trim(),
                $valor,
                "Process"
            )
        }
    }
}

if (-not $env:MONGODB_URI -or -not $env:DB_NAME) {
    throw "Faltan MONGODB_URI o DB_NAME en el archivo .env"
}

if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
    throw "No se encontró mongorestore. Instalar MongoDB Database Tools."
}

# Carpeta del backup del día

$fecha = Get-Date -Format "yyyy-MM-dd"
$origen = Join-Path $raiz "resguardos_tpi\$fecha"

if (-not (Test-Path (Join-Path $origen $env:DB_NAME))) {
    throw "No existe el backup de hoy: $origen"
}

Write-Host "Restaurando '$($env:DB_NAME)' en 'logistica_test'..."
Write-Host "Origen: $origen"

mongorestore `
    --uri="$env:MONGODB_URI" `
    --nsFrom="$($env:DB_NAME).*" `
    --nsTo="logistica_test.*" `
    "$origen"

if ($LASTEXITCODE -ne 0) {
    throw "mongorestore falló (código $LASTEXITCODE)"
}

Write-Host "Restauración finalizada. Revisá los mensajes anteriores para confirmar cuántos documentos se restauraron."
