# scripts\backup.ps1 - Resguardo de la base de datos de MongoDB Atlas con mongodump
# Uso (desde la raíz del proyecto):  .\scripts\backup.ps1
# Requiere: MongoDB Database Tools (mongodump en el PATH) y un archivo .env en la raíz con
#   MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster...mongodb.net/?retryWrites=true&w=majority
#   DB_NAME=comisaria_db

$ErrorActionPreference = "Stop"

# Raíz del proyecto: un nivel arriba de la carpeta scripts
$raiz = Split-Path $PSScriptRoot -Parent

# 1) Cargar las variables del .env de la raíz (la conexión no queda escrita en el script)
$archivoEnv = Join-Path $raiz ".env"
if (Test-Path $archivoEnv) {
    Get-Content $archivoEnv | ForEach-Object {
        if ($_ -match '^\s*([^#=\s][^=]*)=(.*)$') {
            $valor = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $valor, "Process")
        }
    }
}
if (-not $env:MONGODB_URI -or -not $env:DB_NAME) {
    throw "Faltan MONGODB_URI o DB_NAME. Revisar el archivo .env en la raíz del proyecto"
}

# 2) Verificar que mongodump esté disponible
if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
    throw "No se encontró mongodump. Instalar las MongoDB Database Tools y agregarlas al PATH"
}

# 3) Crear resguardos_tpi\AAAA-MM-DD en la raíz del proyecto
$fecha = Get-Date -Format "yyyy-MM-dd"
$destino = Join-Path $raiz "resguardos_tpi\$fecha"
New-Item -ItemType Directory -Force -Path $destino | Out-Null

# 4) Descargar la base desde Atlas
Write-Host "Iniciando backup de '$($env:DB_NAME)' en $destino"
mongodump --uri="$env:MONGODB_URI" --db="$env:DB_NAME" --out="$destino"
if ($LASTEXITCODE -ne 0) {
    throw "mongodump falló (código $LASTEXITCODE). Revisar la conexión y Network Access en Atlas"
}

Write-Host "Backup completado: $destino\$($env:DB_NAME)"


# Script para restaurar la base de datos de prueba desde el resguardo
# Se tiene que cambiar la fecha en la ruta del resguardo según corresponda
mongorestore --uri="$env:MONGODB_URI" --nsFrom="logistica.*" --nsTo="logistica_test.*" .\resguardos_tpi\2026-10-20


# Script para medir el RTO (Recovery Time Objective) de la restauración de la base de datos de prueba
# Se tiene que cambiar la fecha en la ruta del resguardo según corresponda
Measure-Command {
  mongorestore --uri="$env:MONGODB_URI" --nsFrom="logistica.*" --nsTo="logistica_test.*" .\resguardos_tpi\2026-10-20
}