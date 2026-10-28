# Script para medir el RTO (Recovery Time Objective) de la restauración de la base de datos de prueba
# IMPORTANTE: Se intentará restaurar en la carpeta con la fecha de hoy
#             No debe existir el backup en mongodb            

$ErrorActionPreference = "Stop"

# ---------- 1. Raíz del proyecto ----------
$raiz = Split-Path $PSScriptRoot -Parent

# ---------- 2. Cargar variables del .env ----------
$archivoEnv = Join-Path $raiz ".env"

if (Test-Path $archivoEnv) {
    Get-Content $archivoEnv | ForEach-Object {
        if ($_ -match '^\s*([^#=\s][^=]*)=(.*)$') {
            $nombre = $matches[1].Trim()
            $valor = $matches[2].Trim().Trim('"').Trim("'")

            [Environment]::SetEnvironmentVariable(
                $nombre,
                $valor,
                "Process"
            )
        }
    }
}

if (-not $env:MONGODB_URI -or -not $env:DB_NAME) {
    throw "Faltan MONGODB_URI o DB_NAME. Revisar el .env en la raíz del proyecto."
}

# ---------- 3. Verificar mongorestore ----------
if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
    throw "No se encontró mongorestore. Instalar MongoDB Database Tools y agregarlas al PATH."
}

# ---------- 4. Buscar el backup del día ----------
$fecha = Get-Date -Format "yyyy-MM-dd"

$origen = Join-Path $raiz "resguardos_tpi\$fecha"
$carpetaBase = Join-Path $origen $env:DB_NAME

if (-not (Test-Path $carpetaBase)) {
    throw "No existe el backup de hoy: $carpetaBase. Ejecutar primero npm run backup."
}

# ---------- 5. Medir la restauración ----------
Write-Host ""
Write-Host "========== MEDICION DEL RTO =========="
Write-Host "Base de origen: $($env:DB_NAME)"
Write-Host "Base de destino: logistica_test_rto"
Write-Host "Fecha del backup: $fecha"
Write-Host "Directorio: $origen"
Write-Host ""
Write-Host "Iniciando restauración y medición..."

$cronometro = Measure-Command {
    mongorestore `
        --uri="$env:MONGODB_URI" `
        --nsFrom="$($env:DB_NAME).*" `
        --nsTo="logistica_test_rto.*" `
        "$origen"

    if ($LASTEXITCODE -ne 0) {
        throw "mongorestore falló (código $LASTEXITCODE)."
    }
}

# ---------- 6. Mostrar resultados ----------
Write-Host ""
Write-Host "========== RESULTADO =========="
Write-Host ("Tiempo de restauración (RTO): {0:N2} segundos" -f $cronometro.TotalSeconds)
Write-Host ("Tiempo de restauración (RTO): {0:N2} minutos" -f $cronometro.TotalMinutes)
Write-Host ""
Write-Host "Proceso de restauración finalizado."
