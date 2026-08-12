# Verificacao executada antes do F5. Sai com 0 quando o ambiente esta pronto.
# Compativel com Windows PowerShell 5.1: sem ??, sem ternario, sem &&.
# Mensagens sem acento de proposito, para nao depender do encoding do console.

$root = Split-Path -Parent $PSScriptRoot

function Write-Falha($mensagem, $link) {
    Write-Host ""
    Write-Host "[preflight] $mensagem" -ForegroundColor Red
    if ($link) { Write-Host "[preflight] $link" -ForegroundColor Yellow }
    Write-Host ""
    exit 1
}

function Write-Ok($mensagem) {
    Write-Host "[preflight] $mensagem" -ForegroundColor Green
}

function Test-DockerDaemon {
    & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# --- 1) .NET SDK 10 ---
$sdks = $null
try { $sdks = & dotnet --list-sdks 2>$null } catch { $sdks = $null }
$sdkOk = $false
if ($sdks) {
    foreach ($linha in $sdks) {
        $versao = ($linha -split ' ')[0]
        $partes = $versao -split '\.'
        $major = 0
        try { $major = [int]$partes[0] } catch { $major = 0 }
        if ($major -ge 10) { $sdkOk = $true }
    }
}
if (-not $sdkOk) {
    Write-Falha "Falta o .NET SDK 10. Instale, feche e reabra o VS Code." "https://dotnet.microsoft.com/download/dotnet/10.0"
}
Write-Ok "dotnet SDK 10 encontrado."

# --- 2) Node 20+ ---
$nodeVersao = $null
try { $nodeVersao = & node -v 2>$null } catch { $nodeVersao = $null }
if (-not $nodeVersao) {
    Write-Falha "Falta o Node.js (20 ou superior). O front-end roda com npm." "https://nodejs.org/en/download"
}
$nodeMajor = 0
try { $nodeMajor = [int](($nodeVersao.TrimStart('v') -split '\.')[0]) } catch { $nodeMajor = 0 }
if ($nodeMajor -lt 20) {
    Write-Falha "Node $nodeVersao e antigo demais. Use a versao 20 ou superior." "https://nodejs.org/en/download"
}
Write-Ok "node $nodeVersao encontrado."

# --- 3) Daemon do Docker (o banco local roda em container) ---
if (-not (Test-DockerDaemon)) {
    Write-Host "[preflight] Docker nao esta respondendo. Tentando abrir o Docker Desktop..." -ForegroundColor Yellow
    $candidatos = @(
        (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Docker\Docker\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe')
    )
    $exe = $null
    foreach ($c in $candidatos) {
        if ($c) {
            if (Test-Path $c) { $exe = $c; break }
        }
    }
    if (-not $exe) {
        Write-Falha "Docker Desktop nao encontrado. O banco local roda em container, entao ele e obrigatorio." "https://www.docker.com/products/docker-desktop/"
    }
    Start-Process -FilePath $exe | Out-Null
    $limite = 120
    $decorrido = 0
    while ($decorrido -lt $limite) {
        Start-Sleep -Seconds 3
        $decorrido = $decorrido + 3
        if (Test-DockerDaemon) { break }
        Write-Host "[preflight] aguardando o Docker subir... ($decorrido s)"
    }
    if (-not (Test-DockerDaemon)) {
        Write-Falha "O Docker Desktop nao respondeu em $limite segundos. Abra ele na mao e tente o F5 de novo." ""
    }
}
Write-Ok "docker respondendo."

# --- 4) Dependencias do front-end ---
$frontDir = Join-Path $root 'front-end'
$nodeModules = Join-Path $frontDir 'node_modules'
if (-not (Test-Path $nodeModules)) {
    Write-Host "[preflight] node_modules ausente. Rodando npm ci (pode levar alguns minutos)..." -ForegroundColor Yellow
    Push-Location $frontDir
    & npm ci
    $codigo = $LASTEXITCODE
    Pop-Location
    if ($codigo -ne 0) {
        Write-Falha "npm ci falhou (codigo $codigo). Rode na mao dentro de front-end/ para ver o erro." ""
    }
}
Write-Ok "dependencias do front-end presentes."

Write-Host "[preflight] ambiente pronto." -ForegroundColor Green
exit 0
