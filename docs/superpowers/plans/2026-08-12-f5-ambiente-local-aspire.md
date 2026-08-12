# Ambiente local com um F5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir a pasta `sys-adivert/` no VS Code, apertar F5 e ter banco PostgreSQL em container com dados fictícios, back-end .NET e front-end Vite rodando juntos, sem nunca tocar o banco de produção.

**Architecture:** Um projeto Aspire AppHost passa a ser o único lugar que descreve o ambiente de desenvolvimento. Ele sobe um container Postgres efêmero (porta 5432 fixa, credenciais conhecidas), a API do back-end com a connection string injetada por variável de ambiente, e o `npm run dev` do front-end com a URL real da API injetada. Um script de preflight roda antes do F5 para verificar pré-requisitos e resolver o que é resolvível. Um seeder dev-only popula o banco com dados fictícios determinísticos, protegido por uma guarda que se recusa a escrever em host não-local.

**Tech Stack:** .NET 10 (SDK 10.0.103), Aspire 13.4.6 (CLI + `Aspire.Hosting.PostgreSQL` + `Aspire.Hosting.JavaScript`), EF Core 10 + Npgsql, PostgreSQL em container, Node 24 + Vite 8 + React 19, Windows PowerShell 5.1 para o preflight, VS Code com `microsoft-aspire.aspire-vscode` e `ms-dotnettools.csdevkit`.

**Spec:** `docs/superpowers/specs/2026-08-12-f5-ambiente-local-aspire-design.md`

## Global Constraints

- **Nunca alterar `back-end/sys-adivert.Api/appsettings.json`.** Contém a connection string de produção; sai do escopo deste plano.
- **Nunca alterar `front-end/.env`.** É o que o build de produção usa (Render).
- **Nunca alterar `back-end/Dockerfile`, migrations existentes, ou qualquer componente em `front-end/src/`.**
- **Nenhum pacote NuGet ou npm novo** além dos pacotes de hospedagem do Aspire no projeto AppHost. Em especial: nada de Bogus, nada de biblioteca de imagem, nada de projeto de teste.
- **Porta da API: 5010** (perfil `http` do `launchSettings.json` existente, preservado como está).
- **Banco local:** `Host=localhost;Port=5432;Database=sysadivert;Username=postgres;Password=postgres`. Esses cinco valores aparecem no AppHost e no `appsettings.Development.json` e precisam bater exatamente.
- **Container Postgres sem volume de dados.** Nada de `WithDataVolume()`: o banco tem de nascer limpo a cada execução.
- **Seed determinístico:** semente fixa `20260812`, sem nenhuma fonte de aleatoriedade não semeada.
- **`scripts/preflight.ps1` roda em Windows PowerShell 5.1:** sem `??`, sem operador ternário, sem `&&`, e sem caracteres acentuados nas mensagens (evita ruído de encoding no console).
- **Versões do Aspire fixadas em 13.4.6** (versão do CLI instalado nesta máquina).

---

## File Structure

**Criados:**

| Arquivo | Responsabilidade |
|---|---|
| `global.json` | Fixa o SDK .NET major 10 |
| `scripts/preflight.ps1` | Verifica SDK/Node/Docker e resolve Docker parado e `node_modules` ausente |
| `.vscode/tasks.json` | Expõe `preflight` e `build-apphost` como tarefas |
| `.vscode/extensions.json` | Recomenda as extensões Aspire e C# Dev Kit |
| `.vscode/launch.json` | Os dois alvos de F5 |
| `apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj` | Projeto AppHost e suas referências |
| `apphost/sys-adivert.AppHost/AppHost.cs` | Descrição do ambiente (banco + API + front) |
| `apphost/.gitignore` | Ignora `bin/` e `obj/` |
| `back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs` | Dados fictícios e guarda de host local |
| `back-end/sys-adivert.Infrastructure/Seed/PngSimples.cs` | Gera PNG de cor sólida para as evidências do seed |
| `front-end/.env.development` | `VITE_API_URL` local, usado por `npm run dev` avulso |
| `README.md` | Pré-requisitos, como rodar, credenciais locais, solução de problemas |

**Modificados:**

| Arquivo | Alteração |
|---|---|
| `back-end/sys-adivert.Api/Program.cs` | Chamada ao seeder dentro do escopo já existente |
| `back-end/sys-adivert.Api/appsettings.Development.json` | Connection string local |
| `back-end/sys-adivert.slnx` | Registra o projeto AppHost |
| `front-end/vite.config.ts` | Respeita `process.env.PORT` |

Por que o seeder fica em dois arquivos: `DevDataSeeder.cs` responde "quais dados existem no ambiente de dev" e `PngSimples.cs` responde "como fabricar um PNG sem biblioteca". São responsabilidades independentes, e `PngSimples` é a peça que a spec autoriza cortar se custar demais — separada, ela sai sem tocar no resto.

---

## Task 1: Preflight e pré-requisitos de máquina nova

**Files:**
- Create: `global.json`
- Create: `scripts/preflight.ps1`
- Create: `.vscode/tasks.json`
- Create: `.vscode/extensions.json`

**Interfaces:**
- Consumes: nada (primeira task).
- Produces: a tarefa do VS Code de rótulo **`preflight`**, usada como `preLaunchTask` na Task 6. O script sai com código **0** quando o ambiente está pronto e **1** com mensagem quando falta algo que só o usuário pode instalar.

- [ ] **Step 1: Criar `global.json`**

Fixa o SDK major 10, para que uma máquina com SDK 8 falhe dizendo isso em vez de dar erro de MSBuild.

```json
{
  "sdk": {
    "version": "10.0.100",
    "rollForward": "latestFeature"
  }
}
```

- [ ] **Step 2: Verificar que o `global.json` não quebrou a resolução do SDK**

Run: `dotnet --version`
Expected: `10.0.103` (ou outro `10.0.1xx`). Se aparecer erro de SDK não encontrado, o `rollForward` está errado — corrija antes de seguir.

- [ ] **Step 3: Criar `scripts/preflight.ps1`**

```powershell
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
    # A guarda com Get-Command e obrigatoria, nao defensivismo. Sem ela, numa maquina
    # onde o docker nao existe, `& docker` escreve um erro, o script SEGUE em frente e
    # $LASTEXITCODE continua valendo 0 das checagens de dotnet/node — a funcao devolveria
    # $true e o preflight anunciaria "docker respondendo" numa maquina sem Docker.
    # Comportamento medido em 2026-08-12, nao inferido.
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { return $false }
    try {
        & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    }
    catch {
        return $false
    }
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
```

- [ ] **Step 4: Rodar o preflight com o Docker Desktop fechado**

Run (na raiz do repositório):
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```
Expected: as linhas verdes de `dotnet` e `node`, depois `Docker nao esta respondendo. Tentando abrir o Docker Desktop...`, algumas linhas de `aguardando o Docker subir...`, e por fim `docker respondendo.` e `ambiente pronto.` com saída 0.

Confirme o código de saída:
Run: `echo $LASTEXITCODE`
Expected: `0`

- [ ] **Step 5: Verificar o ramo do `npm ci`**

```powershell
Rename-Item -Path .\front-end\node_modules -NewName node_modules_bkp
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```
Expected: a linha `node_modules ausente. Rodando npm ci`, o `npm ci` completa, e termina com `ambiente pronto.` e saída 0.

Depois de confirmar, remova o backup:
```powershell
Remove-Item -Recurse -Force .\front-end\node_modules_bkp
```

- [ ] **Step 6: Criar `.vscode/tasks.json`**

Só a tarefa `preflight` neste momento. A tarefa `build-apphost` entra na Task 6, quando o projeto AppHost já existir — assim nenhuma tarefa deste arquivo aponta para algo inexistente.

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "preflight",
      "detail": "Verifica .NET SDK, Node, Docker e node_modules antes de subir o ambiente",
      "type": "process",
      "command": "powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${workspaceFolder}/scripts/preflight.ps1"
      ],
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated",
        "clear": true
      }
    }
  ]
}
```

- [ ] **Step 7: Criar `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "microsoft-aspire.aspire-vscode",
    "ms-dotnettools.csdevkit"
  ]
}
```

- [ ] **Step 8: Validar o JSON dos dois arquivos**

Run:
```powershell
Get-Content .\.vscode\tasks.json -Raw | ConvertFrom-Json | Out-Null; Get-Content .\.vscode\extensions.json -Raw | ConvertFrom-Json | Out-Null; Write-Host "json ok"
```
Expected: `json ok`, sem exceção.

- [ ] **Step 9: Rodar a tarefa pelo VS Code**

Abra a pasta `sys-adivert/` no VS Code, `Ctrl+Shift+P` → `Tasks: Run Task` → `preflight`.
Expected: a tarefa aparece na lista, roda no painel dedicado e termina sem erro.

- [ ] **Step 10: Commit**

```bash
git add global.json scripts/preflight.ps1 .vscode/tasks.json .vscode/extensions.json
git commit -m "chore: preflight de ambiente e pre-requisitos para o F5"
```

---

## Task 2: AppHost com Postgres efêmero e API isolada de produção

**Files:**
- Create: `apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj` (via CLI)
- Create: `apphost/sys-adivert.AppHost/AppHost.cs` (via CLI, conteúdo substituído)
- Create: `apphost/.gitignore`
- Modify: `back-end/sys-adivert.Api/appsettings.Development.json`
- Modify: `back-end/sys-adivert.slnx`

**Interfaces:**
- Consumes: nada da Task 1 (as tasks são independentes até a Task 6).
- Produces: recurso Aspire `postgres` (container, host `localhost:5432`, usuário `postgres`, senha `postgres`), banco `sysadivert`, e recurso `api` com endpoint HTTP em `http://localhost:5010`. O identificador do endpoint da API é `"http"` — a Task 3 consome via `api.GetEndpoint("http")`. A variável injetada na API é `ConnectionStrings__DefaultConnection`.

- [ ] **Step 1: Criar o projeto AppHost vazio**

Run (na raiz do repositório):
```powershell
aspire new aspire-empty --name sys-adivert.AppHost --output apphost/sys-adivert.AppHost --language csharp --non-interactive --suppress-agent-init
```
Expected: projeto criado em `apphost/sys-adivert.AppHost/`.

Se o CLI rejeitar `--language csharp`, rode sem `--language` e sem `--non-interactive` e escolha C# no prompt:
```powershell
aspire new aspire-empty --name sys-adivert.AppHost --output apphost/sys-adivert.AppHost --suppress-agent-init
```

- [ ] **Step 2: Inspecionar exatamente o que o template criou**

Run: `git status --short`
Expected: apenas arquivos dentro de `apphost/sys-adivert.AppHost/`. Anote o nome do arquivo de entrada — o template cria `AppHost.cs`; se na sua versão vier `Program.cs`, é esse o arquivo editado no Step 6.

Se aparecer qualquer arquivo **fora** de `apphost/` (uma solução na raiz, uma pasta de configuração de agente, um `.gitignore` de raiz), apague antes de seguir: este plano não usa nenhum deles e eles não devem entrar no commit.

- [ ] **Step 3: Adicionar a integração PostgreSQL**

Run:
```powershell
aspire add postgresql --apphost apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj --version 13.4.6 --non-interactive
```
Expected: `PackageReference` para `Aspire.Hosting.PostgreSQL` versão `13.4.6` adicionada ao csproj.

- [ ] **Step 4: Referenciar o projeto da API**

Run:
```powershell
dotnet add apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj reference back-end/sys-adivert.Api/sys-adivert.Api.csproj
```
Expected: `ProjectReference` adicionada. É ela que faz o Aspire gerar a classe `Projects.sys_adivert_Api` usada no Step 6.

- [ ] **Step 5: Criar `apphost/.gitignore`**

```gitignore
# Saida de build do .NET
bin/
obj/
```

- [ ] **Step 6: Escrever o `AppHost.cs`**

Substitua todo o conteúdo do arquivo de entrada criado no Step 1:

```csharp
// Descreve o ambiente de desenvolvimento completo. Rodar este projeto (F5 no VS Code
// ou `aspire run`) sobe banco, API e front-end juntos.
var builder = DistributedApplication.CreateBuilder(args);

// Usuario, senha e porta fixos de proposito: assim a connection string escrita em
// appsettings.Development.json bate com este container, e da para abrir o banco num
// cliente (DBeaver/pgAdmin) com credenciais conhecidas.
var pgUser = builder.AddParameter("pg-user", "postgres");
var pgPassword = builder.AddParameter("pg-password", "postgres");

// Sem WithDataVolume(): o container e efemero, entao cada execucao comeca com banco novo.
var postgres = builder.AddPostgres("postgres", userName: pgUser, password: pgPassword, port: 5432);

var db = postgres.AddDatabase("sysadivert");

// launchProfileName "http": o Program.cs chama UseHttpsRedirection() incondicionalmente,
// entao o middleware RODA de qualquer forma. Com um unico endpoint HTTP nao existe porta
// HTTPS de destino, e o redirect nao dispara; e o Kestrel nao precisa do certificado de
// dev para abrir um listener HTTPS. Efeito colateral conhecido: o middleware loga uma vez
// "Failed to determine the https port for redirect".
// O nome ConnectionStrings__DefaultConnection e explicito porque o padrao do Aspire seria
// ConnectionStrings__sysadivert, que o Program.cs da API nao le.
var api = builder.AddProject<Projects.sys_adivert_Api>("api", launchProfileName: "http")
    .WithEnvironment("ConnectionStrings__DefaultConnection", db)
    .WaitFor(db);

builder.Build().Run();
```

- [ ] **Step 7: Compilar o AppHost**

Run:
```powershell
dotnet build apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj
```
Expected: `Build succeeded`.

Se `AddPostgres` não aceitar os parâmetros nomeados `userName`/`password`/`port`, o objetivo é: usuário `postgres`, senha `postgres`, porta do host `5432`. Consulte a assinatura pelo IntelliSense e mantenha exatamente esses três valores — eles têm de bater com o Step 8. Uma alternativa quando só a porta divergir é encadear `.WithHostPort(5432)` no recurso `postgres`.

Se `WithEnvironment("ConnectionStrings__DefaultConnection", db)` não compilar, use a forma por callback, equivalente:
```csharp
.WithEnvironment(ctx =>
    ctx.EnvironmentVariables["ConnectionStrings__DefaultConnection"] = db.Resource.ConnectionStringExpression)
```

- [ ] **Step 8: Escrever `appsettings.Development.json`**

Conteúdo completo do arquivo (a seção `Logging` já existia e é preservada):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=sysadivert;Username=postgres;Password=postgres"
  }
}
```

Isso é a segunda camada de isolamento: mesmo um `dotnet run` avulso vai para o container local em vez do Supabase.

- [ ] **Step 9: Registrar o AppHost na solução**

Edite `back-end/sys-adivert.slnx` acrescentando a última linha de `Project` (o caminho é relativo ao arquivo `.slnx`, que fica em `back-end/`):

```xml
<Solution>
  <Project Path="sys-adivert.Api/sys-adivert.Api.csproj" />
  <Project Path="sys-adivert.Application/sys-adivert.Application.csproj" />
  <Project Path="sys-adivert.Domain/sys-adivert.Domain.csproj" />
  <Project Path="sys-adivert.Infrastructure/sys-adivert.Infrastructure.csproj" />
  <Project Path="../apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj" />
</Solution>
```

- [ ] **Step 10: Verificar que a solução inteira compila**

Run:
```powershell
dotnet build back-end/sys-adivert.slnx
```
Expected: `Build succeeded`, cinco projetos.

- [ ] **Step 11: Subir o ambiente pelo CLI**

Run:
```powershell
cd apphost/sys-adivert.AppHost
aspire run
```
Expected: o CLI imprime a URL do dashboard e sobe os recursos `postgres` e `api`. Deixe rodando para os próximos steps (use outro terminal).

Se aparecer erro sobre transporte não seguro (`unsecured transport`), pare, defina a variável e repita — a API está deliberadamente em HTTP:
```powershell
$env:ASPIRE_ALLOW_UNSECURED_TRANSPORT = "true"
aspire run
```

- [ ] **Step 12: Verificar que a API está de pé e falando com o container**

Run (em outro terminal):
```powershell
Invoke-RestMethod http://localhost:5010/health
```
Expected: `healthy`

- [ ] **Step 13: Verificar que as migrations foram aplicadas no container, e não em produção**

Run:
```powershell
docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "\dt"
```
Expected: a lista com `Adiverts`, `AdivertEvidencias`, `Colabs`, `Motivos` e `__EFMigrationsHistory`.

Run:
```powershell
docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "select count(*) from \"Colabs\";"
```
Expected: `0` — o schema existe e ainda não há seed (ele entra na Task 4).

- [ ] **Step 14: Confirmar o isolamento de produção**

Run:
```powershell
Invoke-RestMethod http://localhost:5010/api/Colabs
```
Expected: lista vazia. Se vierem colaboradores reais, a API está falando com o Supabase — pare e revise os Steps 6 e 8 antes de continuar.

Encerre o `aspire run` (`Ctrl+C`) antes do commit.

- [ ] **Step 15: Commit**

```bash
git add apphost back-end/sys-adivert.slnx back-end/sys-adivert.Api/appsettings.Development.json
git commit -m "feat: AppHost do Aspire com Postgres efemero e API isolada de producao"
```

Confira antes com `git status --short` que nenhum `bin/` ou `obj/` entrou.

---

## Task 3: Front-end orquestrado pelo AppHost

**Files:**
- Modify: `apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj` (via CLI)
- Modify: `apphost/sys-adivert.AppHost/AppHost.cs`
- Modify: `front-end/vite.config.ts`
- Create: `front-end/.env.development`

**Interfaces:**
- Consumes: da Task 2, o recurso `api` e seu endpoint `"http"`.
- Produces: recurso Aspire `front-end` servindo o Vite, com `VITE_API_URL` apontando para o endpoint HTTP da API.

- [ ] **Step 1: Adicionar a integração JavaScript**

Run (na raiz do repositório):
```powershell
aspire add javascript --apphost apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj --version 13.4.6 --non-interactive
```
Expected: `PackageReference` para `Aspire.Hosting.JavaScript` versão `13.4.6`. É esse o pacote que traz `AddViteApp` no Aspire 13 (o antigo `Aspire.Hosting.NodeJs` foi renomeado).

- [ ] **Step 2: Acrescentar o recurso do front-end no `AppHost.cs`**

Insira antes de `builder.Build().Run();`:

```csharp
// AddViteApp registra o endpoint HTTP do front, escolhe a porta e a informa na variavel
// PORT; o vite.config.ts respeita essa variavel. Nao chamar WithHttpEndpoint aqui: a
// porta e gerenciada pelo Aspire.
builder.AddViteApp("front-end", "../../front-end")
    .WithEnvironment("VITE_API_URL", api.GetEndpoint("http"))
    .WithReference(api)
    .WaitFor(api);
```

O caminho `../../front-end` é relativo ao diretório do projeto AppHost (`apphost/sys-adivert.AppHost/`).

- [ ] **Step 3: Compilar**

Run:
```powershell
dotnet build apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj
```
Expected: `Build succeeded`.

- [ ] **Step 4: Fazer o Vite respeitar a porta do Aspire**

Conteúdo completo de `front-end/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// O Aspire escolhe a porta do front-end e a informa em PORT, mas o Vite nao le PORT por
// conta propria (o default dele e 5173). Os dois campos de server saem do MESMO valor
// parseado, de proposito: se derivarem de expressoes diferentes, um PORT invalido levaria
// o Vite para 5173 com strictPort ligado, prendendo o servidor na porta errada.
const portaDoAspire = Number(process.env.PORT)
const portaValida = Number.isInteger(portaDoAspire) && portaDoAspire > 0

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // Com porta valida do Aspire, strictPort liga: e melhor falhar alto do que o Vite
    // migrar de porta e desalinhar do link anunciado no dashboard. Sem PORT (ou com PORT
    // invalido), cai em 5173 com strictPort desligado — o comportamento de hoje.
    port: portaValida ? portaDoAspire : 5173,
    strictPort: portaValida,
  },
})
```

- [ ] **Step 5: Criar `front-end/.env.development`**

Faz `npm run dev` avulso também apontar para a API local. O `front-end/.env` (produção, Render) não é tocado; em modo dev o Vite dá precedência a `.env.development`, e variáveis de processo injetadas pelo Aspire vencem os dois.

```
VITE_API_URL=http://localhost:5010
```

- [ ] **Step 6: Subir tudo e conferir os três recursos**

Run:
```powershell
cd apphost/sys-adivert.AppHost
aspire run
```
Expected: dashboard com `postgres`, `api` e `front-end`, os três saudáveis, e um link para o front-end.

- [ ] **Step 7: Verificar que o link do front-end abre de verdade**

Abra o link do recurso `front-end` no dashboard.
Expected: a aplicação carrega. A tabela aparece vazia (o seed é a Task 4), sem erro de rede no console do navegador.

- [ ] **Step 8: Verificar que o front está chamando a API local**

No dashboard, abra os logs do recurso `api`.
Expected: linhas de requisição para `/api/Adiverts` e `/api/Colabs` — prova de que o front foi para `localhost:5010` e não para o Render.

- [ ] **Step 9: Verificar que `npm run dev` avulso continua funcionando**

Pare o `aspire run`. Então:
```powershell
cd front-end
npm run dev
```
Expected: Vite sobe em `http://localhost:5173` (sem `PORT` no ambiente, cai no default). Encerre depois com `Ctrl+C`.

- [ ] **Step 10: Commit**

```bash
git add apphost front-end/vite.config.ts front-end/.env.development
git commit -m "feat: front-end Vite orquestrado pelo AppHost"
```

---

## Task 4: Seeder de dados fictícios com guarda de host local

**Files:**
- Create: `back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs`
- Modify: `back-end/sys-adivert.Api/Program.cs`

**Interfaces:**
- Consumes: da Task 2, o container Postgres em `localhost:5432` e a injeção de `ConnectionStrings__DefaultConnection`.
- Produces: `sys_adivert.Infrastructure.Seed.DevDataSeeder.SeedAsync(AppDbContext db, ILogger logger)` → `Task`. Idempotente e silencioso quando não deve rodar. A Task 5 acrescenta evidências a esse mesmo arquivo.

- [ ] **Step 1: Criar `back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using sys_adivert.adivert.Entity;
using sys_adivert.colab.Entity;
using sys_adivert.Infrastructure.AppDb;

namespace sys_adivert.Infrastructure.Seed;

/// <summary>
/// Popula o banco de desenvolvimento com dados ficticios.
/// Duas travas independentes: o Program.cs so chama em ambiente Development, e este
/// seeder se recusa a escrever se o host da connection string nao for local.
/// </summary>
public static class DevDataSeeder
{
    // Semente fixa: o conjunto gerado e sempre o mesmo, entao um caso encontrado hoje
    // continua reproduzivel amanha.
    private const int Semente = 20260812;

    private static readonly string[] NomesSeed =
    [
        "Adriana Nogueira Prado",
        "Alexandre Bittencourt Rosa",
        "Amanda Quirino Vasques",
        "Anderson Palmeira Toledo",
        "Beatriz Sampaio Andrade",
        "Bruno Vilela Meireles",
        "Camila Rezende Fontoura",
        "Carlos Eduardo Vasconcelos",
        "Cristiane Aparecida Bueno",
        "Daniel Otávio Ferraz",
        "Débora Cristina Salgado",
        "Diego Marchesi Coutinho",
        "Eduardo Tavares Pimenta",
        "Elaine Moraes Sobral",
        "Fabiana Lustosa Rangel",
        "Fábio Henrique Peçanha",
        "Felipe Andrade Zanetti",
        "Gabriela Munhoz Teixeira",
        "Gustavo Lemos Bragança",
        "Helena Vitória Caldas",
        "Igor Sarmento Vilhena",
        "Jaqueline Borges Amorim",
        "João Vitor Assunção",
        "Juliana Paes Kruger",
        "Leandro Cardim Estevão",
        "Letícia Marques Ferrão",
        "Lucas Aguiar Pontes",
        "Marcelo Trindade Bastos",
        "Mariana Duarte Nogueira",
        "Nathalia Cordeiro Simões",
        "Otávio Camargo Bicalho",
        "Patrícia Rangel Vidotti",
        "Rafael Siqueira Bandeira",
        "Renata Guimarães Portela",
        "Ricardo Veríssimo Almeida",
        "Rodrigo Frota Menezes",
        "Sabrina Correia Valadares",
        "Thiago Barcelos Pinheiro",
        "Vanessa Klein Andrade",
        "Wagner Furtado Sanches",
    ];

    private static readonly string[] ComplementosSeed =
    [
        "Terceira ocorrência no mesmo trimestre; colaborador ciente do procedimento.",
        "Orientado verbalmente em duas oportunidades anteriores, sem mudança de conduta.",
        "Ocorrência registrada pelo líder do turno, com testemunha presente.",
        "Colaborador reconheceu o ocorrido e assinou ciência no ato.",
        "Reincidência após treinamento de reciclagem concluído no mês anterior.",
        "A situação gerou parada de linha por aproximadamente 40 minutos.",
    ];

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        if (!HostEhLocal(db.Database.GetConnectionString()))
        {
            logger.LogWarning(
                "DevDataSeeder ignorado: a connection string nao aponta para host local. " +
                "Dados ficticios so sao inseridos em banco local.");
            return;
        }

        if (await db.Colabs.AnyAsync())
        {
            logger.LogInformation("DevDataSeeder ignorado: o banco ja tem colaboradores.");
            return;
        }

        // Os motivos NAO sao criados aqui. A migration 20260528195547_CriandoTabelaDeMotivos
        // ja insere os motivos reais da operacao em todo banco novo, e as advertencias ficticias
        // referenciam esses. Se o seeder inventasse os seus, os motivos reais ficariam com zero
        // advertencias — e o historico por motivo e o Excel por motivo, que sao justamente o que
        // estes dados existem para exercitar, apareceriam vazios nos motivos que o usuario usa.
        var motivos = await db.Motivos
            .Select(m => m.Descricao)
            .ToListAsync();

        if (motivos.Count == 0)
        {
            logger.LogWarning(
                "DevDataSeeder ignorado: nao ha motivos no banco. Esperava-se que a migration " +
                "CriandoTabelaDeMotivos os tivesse inserido.");
            return;
        }

        var rnd = new Random(Semente);

        var colabs = new List<Colab>();
        for (var i = 0; i < NomesSeed.Length; i++)
        {
            colabs.Add(new Colab(NomesSeed[i], (10001 + i).ToString()));
        }
        db.Colabs.AddRange(colabs);

        await db.SaveChangesAsync();

        var hoje = DateOnly.FromDateTime(DateTime.Today);
        var adverts = new List<Adivert>();

        // Distribuicao desigual de proposito: alguns reincidentes e uma maioria com uma a
        // tres advertencias. Sem isso, o historico por colaborador e o Excel por motivo
        // saem todos iguais e nao servem para testar nada.
        for (var i = 0; i < colabs.Count; i++)
        {
            var colab = colabs[i];

            int quantidade;
            if (i < 5)
            {
                quantidade = rnd.Next(8, 13);
            }
            else if (i < 15)
            {
                quantidade = rnd.Next(4, 8);
            }
            else
            {
                quantidade = rnd.Next(1, 4);
            }

            for (var j = 0; j < quantidade; j++)
            {
                var data = hoje.AddDays(-rnd.Next(0, 730));
                var tipo = rnd.Next(0, 10) < 6 ? "Escrita" : "Verbal";
                var motivo = motivos[rnd.Next(0, motivos.Count)];

                string? complemento = null;
                if (rnd.Next(0, 10) < 3)
                {
                    complemento = ComplementosSeed[rnd.Next(0, ComplementosSeed.Length)];
                }

                var adivert = new Adivert(data, colab.Matricula, motivo, colab.Nome, tipo, complemento);
                adivert.MarcarAssinatura(rnd.Next(0, 10) < 7);
                adverts.Add(adivert);
            }
        }

        db.Adiverts.AddRange(adverts);
        await db.SaveChangesAsync();

        logger.LogInformation(
            "DevDataSeeder: {Colabs} colaboradores e {Adverts} advertencias inseridos, " +
            "referenciando os {Motivos} motivos que ja existiam no banco.",
            colabs.Count, adverts.Count, motivos.Count);
    }

    // Terceira camada de isolamento: nenhuma escrita ficticia fora de um banco local.
    private static bool HostEhLocal(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return false;
        }

        string host;
        try
        {
            host = new NpgsqlConnectionStringBuilder(connectionString).Host ?? string.Empty;
        }
        catch (Exception)
        {
            return false;
        }

        return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host == "127.0.0.1"
            || host == "::1";
    }
}
```

- [ ] **Step 2: Chamar o seeder no `Program.cs`**

Acrescente o `using` junto aos outros no topo do arquivo:

```csharp
using sys_adivert.Infrastructure.Seed;
```

E substitua o bloco de escopo existente por:

```csharp
// Aplica migrations pendentes automaticamente no startup (idempotente).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Dados ficticios apenas em desenvolvimento. O seeder ainda checa, por conta propria,
    // se o host e local antes de escrever qualquer linha.
    if (app.Environment.IsDevelopment())
    {
        await DevDataSeeder.SeedAsync(db, app.Logger);
    }
}
```

- [ ] **Step 3: Compilar**

Run:
```powershell
dotnet build back-end/sys-adivert.slnx
```
Expected: `Build succeeded`.

- [ ] **Step 4: Subir e conferir os números**

Run:
```powershell
cd apphost/sys-adivert.AppHost
aspire run
```

Em outro terminal:
```powershell
docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "select (select count(*) from \"Motivos\") as motivos, (select count(*) from \"Colabs\") as colabs, (select count(*) from \"Adiverts\") as adverts;"
```
Expected: `colabs = 40`, `adverts` entre 140 e 170, e `motivos` **inalterado** em relação ao que a migration `20260528195547_CriandoTabelaDeMotivos` insere — o seeder não cria nem apaga motivo nenhum. Registre o número que aparecer; ele é o baseline dos motivos reais da operação.

Confirme também que as advertências se espalharam pelos motivos reais, que é o ponto de referenciá-los:

```powershell
docker exec -e PGPASSWORD=postgres (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "select count(distinct \"Motivo\") as motivos_usados from \"Adiverts\";"
```
Expected: um número alto (dezenas), não 10 — prova de que as advertências referenciam os motivos existentes e não um conjunto inventado.

- [ ] **Step 5: Conferir a distribuição desigual**

Run:
```powershell
docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "select \"Nome\", count(*) from \"Adiverts\" group by \"Nome\" order by 2 desc limit 8;"
```
Expected: os primeiros nomes com 8 a 12 advertências, e a cauda com poucas — exatamente o que o histórico por colaborador precisa para ser interessante.

- [ ] **Step 6: Conferir no front-end**

Abra o link do `front-end` no dashboard.
Expected: a tabela carrega povoada. A busca por nome funciona, o histórico por colaborador mostra vários registros para os reincidentes, e o histórico por motivo lista os 10 motivos.

- [ ] **Step 7: Verificar a guarda de host — o teste mais importante desta task**

O seeder não pode escrever em banco remoto. Exercitar isso exige uma combinação específica: **host não-local na connection string E banco de fato alcançável**. Se o banco não for alcançável, o `Migrate()` estoura antes de o seeder ser chamado e a guarda nunca é exercitada — o teste passaria por acidente, provando nada.

Medição feita em 2026-08-12, que descarta o caminho óbvio: o container que o Aspire sobe publica em `127.0.0.1:<porta aleatória>`, e o proxy do Aspire escuta em `localhost:5432` **apenas na interface de loopback**. O nome da máquina (`PROC1774:5432`) não alcança nenhum dos dois. Portanto não dá para reaproveitar o container do Aspire para este teste.

O caminho que funciona é um Postgres descartável publicado em todas as interfaces. **Este step não precisa do ambiente Aspire no ar** — rode-o isolado.

```powershell
docker run -d --name guarda-teste -p 5433:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sysadivert postgres:17
```

Espere uns 10 segundos e suba a API apontada para ele **pelo nome da máquina** (host não-local, banco alcançável):

```powershell
cd back-end/sys-adivert.Api
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5011"
$env:ConnectionStrings__DefaultConnection = "Host=$env:COMPUTERNAME;Port=5433;Database=sysadivert;Username=postgres;Password=postgres"
dotnet run --no-launch-profile
```

`--no-launch-profile` é necessário: com o perfil `http` ativo, o `applicationUrl` do `launchSettings.json` sobrescreveria a porta e a API tentaria a 5010.

Expected, nesta ordem: as migrations aplicam normalmente — o que **prova que o banco era alcançável**, e portanto que a guarda não passou por falta de conexão — e em seguida o log traz `DevDataSeeder ignorado: a connection string nao aponta para host local.`, sem nenhuma linha de inserção.

Confirme que nada foi escrito:

```powershell
docker exec guarda-teste psql -U postgres -d sysadivert -c "select count(*) from \"Colabs\";"
```
Expected: `0`.

Encerre a API com `Ctrl+C` e limpe tudo:

```powershell
Remove-Item Env:ConnectionStrings__DefaultConnection
Remove-Item Env:ASPNETCORE_URLS
Remove-Item Env:ASPNETCORE_ENVIRONMENT
docker rm -f guarda-teste
```

- [ ] **Step 8: Verificar a idempotência**

Com o ambiente de pé, reinicie apenas o recurso `api` pelo dashboard (ou pare e rode `aspire run` de novo sem derrubar o container, se o container ainda existir).
Expected no log da API: `DevDataSeeder ignorado: o banco ja tem colaboradores.` e nenhuma duplicação nas contagens do Step 4.

- [ ] **Step 9: Verificar que cada execução nasce igual**

Encerre o `aspire run` por completo (o container é removido), suba de novo e repita a consulta do Step 4.
Expected: as mesmas contagens de motivos e colaboradores, e a mesma contagem de advertências da execução anterior.

- [ ] **Step 10: Commit**

```bash
git add back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs back-end/sys-adivert.Api/Program.cs
git commit -m "feat: seed de dados ficticios em dev, com guarda de host local"
```

---

## Task 5: Evidências em imagem no seed

**Files:**
- Create: `back-end/sys-adivert.Infrastructure/Seed/PngSimples.cs`
- Modify: `back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs`

**Interfaces:**
- Consumes: da Task 4, `DevDataSeeder.SeedAsync` e a lista `adverts` construída lá.
- Produces: `PngSimples.CorSolida(int largura, int altura, byte r, byte g, byte b)` → `byte[]` com um PNG RGB válido.

Esta é a peça que a spec autoriza cortar se custar demais. Se `PngSimples` não produzir um PNG que o navegador abra, remova esta task inteira, avise o usuário e siga para a Task 6 — nada mais depende dela.

- [ ] **Step 1: Criar `back-end/sys-adivert.Infrastructure/Seed/PngSimples.cs`**

```csharp
using System.IO.Compression;
using System.Text;

namespace sys_adivert.Infrastructure.Seed;

/// <summary>
/// Gera um PNG de cor solida sem depender de biblioteca de imagem nem de arquivo binario
/// no repositorio. Existe apenas para o seed poder criar evidencias de teste.
/// </summary>
internal static class PngSimples
{
    public static byte[] CorSolida(int largura, int altura, byte r, byte g, byte b)
    {
        // Scanlines RGB, cada linha precedida pelo byte de filtro (0 = None).
        var raw = new byte[altura * (1 + largura * 3)];
        var pos = 0;
        for (var y = 0; y < altura; y++)
        {
            raw[pos++] = 0;
            for (var x = 0; x < largura; x++)
            {
                raw[pos++] = r;
                raw[pos++] = g;
                raw[pos++] = b;
            }
        }

        byte[] idat;
        using (var comprimido = new MemoryStream())
        {
            using (var z = new ZLibStream(comprimido, CompressionLevel.Optimal, true))
            {
                z.Write(raw, 0, raw.Length);
            }

            idat = comprimido.ToArray();
        }

        var ihdr = new byte[13];
        EscreverUInt32(ihdr, 0, (uint)largura);
        EscreverUInt32(ihdr, 4, (uint)altura);
        ihdr[8] = 8;  // bits por canal
        ihdr[9] = 2;  // truecolor RGB
        ihdr[10] = 0; // compressao deflate
        ihdr[11] = 0; // metodo de filtro padrao
        ihdr[12] = 0; // sem entrelacamento

        using var png = new MemoryStream();
        png.Write([0x89, (byte)'P', (byte)'N', (byte)'G', 0x0D, 0x0A, 0x1A, 0x0A]);
        EscreverChunk(png, "IHDR", ihdr);
        EscreverChunk(png, "IDAT", idat);
        EscreverChunk(png, "IEND", []);
        return png.ToArray();
    }

    private static void EscreverChunk(Stream destino, string tipo, byte[] dados)
    {
        var tamanho = new byte[4];
        EscreverUInt32(tamanho, 0, (uint)dados.Length);
        destino.Write(tamanho);

        var tipoBytes = Encoding.ASCII.GetBytes(tipo);
        destino.Write(tipoBytes);
        destino.Write(dados);

        var crc = new byte[4];
        EscreverUInt32(crc, 0, Crc32(tipoBytes, dados));
        destino.Write(crc);
    }

    private static void EscreverUInt32(byte[] destino, int offset, uint valor)
    {
        destino[offset] = (byte)(valor >> 24);
        destino[offset + 1] = (byte)(valor >> 16);
        destino[offset + 2] = (byte)(valor >> 8);
        destino[offset + 3] = (byte)valor;
    }

    private static readonly uint[] TabelaCrc = CriarTabelaCrc();

    private static uint[] CriarTabelaCrc()
    {
        var tabela = new uint[256];
        for (uint n = 0; n < 256; n++)
        {
            var c = n;
            for (var k = 0; k < 8; k++)
            {
                if ((c & 1) != 0)
                {
                    c = 0xEDB88320u ^ (c >> 1);
                }
                else
                {
                    c >>= 1;
                }
            }

            tabela[n] = c;
        }

        return tabela;
    }

    private static uint Crc32(byte[] primeiro, byte[] segundo)
    {
        var c = 0xFFFFFFFFu;
        foreach (var b in primeiro)
        {
            c = TabelaCrc[(c ^ b) & 0xFF] ^ (c >> 8);
        }

        foreach (var b in segundo)
        {
            c = TabelaCrc[(c ^ b) & 0xFF] ^ (c >> 8);
        }

        return c ^ 0xFFFFFFFFu;
    }
}
```

- [ ] **Step 2: Anexar evidências a três advertências no `DevDataSeeder`**

Em `DevDataSeeder.SeedAsync`, entre `db.Adiverts.AddRange(adverts);` e `await db.SaveChangesAsync();`, insira:

```csharp
        // Tres advertencias com evidencia, para conferir o PDF com imagem sem precisar
        // subir arquivo na mao. ContentType tem de ser image/png: o default da entidade e
        // image/jpeg, e pdfAdvertencia.ts monta a data URL a partir desse campo, entao um
        // PNG rotulado como JPEG nao renderiza.
        var cores = new (byte R, byte G, byte B)[] { (168, 21, 21), (32, 74, 135), (78, 154, 6) };
        var comEvidencia = adverts.Where(a => a.Complemento is not null).Take(3).ToList();
        for (var i = 0; i < comEvidencia.Count; i++)
        {
            var cor = cores[i % cores.Length];
            var quantidade = i == 0 ? 2 : 1;
            for (var ordem = 0; ordem < quantidade; ordem++)
            {
                comEvidencia[i].Evidencias.Add(new AdivertEvidencia
                {
                    Conteudo = PngSimples.CorSolida(600, 400, cor.R, cor.G, cor.B),
                    ContentType = "image/png",
                    NomeArquivo = $"evidencia-{i + 1}-{ordem + 1}.png",
                    Ordem = ordem,
                });
            }
        }
```

E acrescente ao log final, para o número aparecer no startup:

```csharp
        logger.LogInformation(
            "DevDataSeeder: {Motivos} motivos, {Colabs} colaboradores, {Adverts} advertencias e {Evidencias} evidencias inseridos.",
            motivos.Count, colabs.Count, adverts.Count, comEvidencia.Sum(a => a.Evidencias.Count));
```

- [ ] **Step 3: Compilar**

Run:
```powershell
dotnet build back-end/sys-adivert.slnx
```
Expected: `Build succeeded`.

- [ ] **Step 4: Subir e conferir as evidências no banco**

Run:
```powershell
cd apphost/sys-adivert.AppHost
aspire run
```

Em outro terminal:
```powershell
docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "select \"AdivertId\", \"ContentType\", \"NomeArquivo\", octet_length(\"Conteudo\") as bytes from \"AdivertEvidencias\" order by \"AdivertId\", \"Ordem\";"
```
Expected: 4 linhas, todas com `image/png` e `bytes` maior que zero, distribuídas em três `AdivertId` distintos.

- [ ] **Step 5: Verificar que o PNG é válido de verdade**

Pega o id direto do banco, busca o detalhe pela API, grava o PNG em disco e abre — sem substituição manual de valor:

```powershell
$id = (docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -t -A -c "select \"AdivertId\" from \"AdivertEvidencias\" order by \"AdivertId\" limit 1;").Trim()
$det = Invoke-RestMethod "http://localhost:5010/api/Adiverts/$id"
$det.evidencias.Count
[IO.File]::WriteAllBytes("$env:TEMP\evidencia.png", [Convert]::FromBase64String($det.evidencias[0].base64))
Start-Process "$env:TEMP\evidencia.png"
```
Expected: `$det.evidencias.Count` é 1 ou 2, e o visualizador do Windows abre um retângulo de cor sólida. Se der "arquivo corrompido" ou "formato não suportado", o PNG está errado — corrija `PngSimples` ou remova esta task conforme a nota do início.

- [ ] **Step 6: Verificar o PDF com evidência no front-end**

No front-end, abra uma das advertências com evidência e gere o PDF dela.
Expected: o PDF sai com a carta na primeira página e a imagem de evidência nas páginas seguintes.

- [ ] **Step 7: Commit**

```bash
git add back-end/sys-adivert.Infrastructure/Seed/
git commit -m "feat: evidencias em PNG no seed de desenvolvimento"
```

---

## Task 6: O F5 e a documentação

**Files:**
- Create: `.vscode/launch.json`
- Modify: `.vscode/tasks.json`
- Create: `.gitignore` (na raiz — hoje não existe)
- Create: `README.md`

**Interfaces:**
- Consumes: a tarefa `preflight` da Task 1 e o projeto `apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj` das Tasks 2 e 3.
- Produces: dois alvos de depuração no VS Code, sendo o primeiro o padrão do F5.

- [ ] **Step 1: Acrescentar a tarefa `build-apphost` em `.vscode/tasks.json`**

Adicione ao array `tasks`, depois da tarefa `preflight`:

```json
    {
      "label": "build-apphost",
      "detail": "preflight + dotnet build do AppHost",
      "dependsOn": ["preflight"],
      "dependsOrder": "sequence",
      "type": "process",
      "command": "dotnet",
      "args": [
        "build",
        "${workspaceFolder}/apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj"
      ],
      "problemMatcher": "$msCompile"
    }
```

- [ ] **Step 2: Criar `.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Subir tudo (Aspire)",
      "type": "aspire",
      "request": "launch",
      "program": "${workspaceFolder}/apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj",
      "preLaunchTask": "preflight"
    },
    {
      "name": "Subir tudo (reserva, sem a extensao do Aspire)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build-apphost",
      "program": "${workspaceFolder}/apphost/sys-adivert.AppHost/bin/Debug/net10.0/sys-adivert.AppHost.dll",
      "cwd": "${workspaceFolder}/apphost/sys-adivert.AppHost",
      "console": "internalConsole",
      "stopAtEntry": false,
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "DOTNET_ENVIRONMENT": "Development",
        "ASPIRE_ALLOW_UNSECURED_TRANSPORT": "true"
      }
    }
  ]
}
```

O primeiro alvo é o padrão do F5. O segundo roda o AppHost sob o depurador do .NET e funciona sem a extensão do Aspire instalada; ele existe como reserva, não para colocar breakpoints em código de aplicação.

- [ ] **Step 3: Validar o JSON**

Run:
```powershell
Get-Content .\.vscode\launch.json -Raw | ConvertFrom-Json | Out-Null; Get-Content .\.vscode\tasks.json -Raw | ConvertFrom-Json | Out-Null; Write-Host "json ok"
```
Expected: `json ok`.

- [ ] **Step 4: Criar `.gitignore` na raiz**

Descoberto durante a Task 3: `aspire add` e `aspire start` criam um `aspire.config.json` de bookkeeping **na raiz do repositório**. Apagá-lo a cada execução é brigar com a ferramenta; o certo é ignorá-lo, para ele não poluir o `git status` nem ser commitado por acidente. A raiz não tem `.gitignore` hoje.

```gitignore
# Bookkeeping da CLI do Aspire, recriado a cada `aspire add` / `aspire start`.
aspire.config.json
```

- [ ] **Step 5: O teste que define o sucesso do plano**

Feche o VS Code e o Docker Desktop. Abra a pasta `sys-adivert/` no VS Code e aperte **F5**, sem tocar em mais nada.
Expected, nesta ordem: o painel do preflight abre e inicia o Docker; o dashboard do Aspire abre; `postgres`, `api` e `front-end` ficam saudáveis; abrir o link do front mostra a aplicação com os dados fictícios.

Se o alvo `aspire` reclamar do valor de `program`, troque o `.csproj` pela pasta do AppHost (`${workspaceFolder}/apphost/sys-adivert.AppHost`) e repita.

- [ ] **Step 6: Verificar o alvo de reserva**

Na paleta de depuração do VS Code, selecione `Subir tudo (reserva, sem a extensao do Aspire)` e rode.
Expected: o AppHost sobe, a URL do dashboard aparece no console de depuração, e os três recursos ficam de pé.

- [ ] **Step 7: Criar `README.md` na raiz**

````markdown
# sys-adivert

Sistema de advertências (DANLEX): API .NET 10 + PostgreSQL e front-end React/Vite.

## Rodando o ambiente completo

Abra esta pasta no VS Code e aperte **F5**. Sobem três coisas:

| Recurso | O que é | Onde |
|---|---|---|
| `postgres` | PostgreSQL em container, **efêmero** | `localhost:5432` |
| `api` | Back-end .NET | `http://localhost:5010` |
| `front-end` | Vite em modo dev | link no dashboard do Aspire |

O dashboard do Aspire abre junto e concentra os logs dos três.

### Pré-requisitos

- .NET SDK 10
- Node.js 20 ou superior
- Docker Desktop (o banco local roda em container)
- VS Code com as extensões `microsoft-aspire.aspire-vscode` e `ms-dotnettools.csdevkit` — ao abrir a pasta, o VS Code oferece instalar as duas

O F5 roda `scripts/preflight.ps1` antes de tudo. Ele confere esses pré-requisitos, abre o Docker Desktop se estiver fechado e roda `npm ci` se `front-end/node_modules` não existir. Se faltar o .NET SDK ou o Node, ele cancela o F5 com o link de download.

Dica: ligue "Start Docker Desktop when you sign in" nas configurações do Docker Desktop para o F5 não precisar esperar o Docker subir.

### Sem VS Code

```powershell
cd apphost/sys-adivert.AppHost
aspire run
```

## O banco de desenvolvimento

Container efêmero com dados fictícios: **~150 advertências, 40 colaboradores e 10 motivos**, sempre os mesmos. Cada F5 recria o banco do zero, então **o que você cadastrar testando desaparece na próxima execução**.

Para inspecionar com DBeaver, pgAdmin ou psql:

```
Host=localhost;Port=5432;Database=sysadivert;Username=postgres;Password=postgres
```

O seed roda apenas em ambiente `Development` e apenas quando a connection string aponta para host local — ele se recusa a escrever em banco remoto.

## Produção

O deploy usa `back-end/Dockerfile` e a connection string de `back-end/sys-adivert.Api/appsettings.json`; o front-end de produção usa `front-end/.env`. **Nenhum dos dois é usado pelo F5**, e nenhum deve ser alterado para mexer no ambiente local.

## Problemas comuns

- **"unsecured transport"** ao subir o AppHost: defina `ASPIRE_ALLOW_UNSECURED_TRANSPORT=true`. A API roda em HTTP de propósito no ambiente local.
- **O AppHost não sobe e o erro fala de certificado ou de chave privada inacessível:** o dashboard do Aspire serve por HTTPS e precisa do certificado de desenvolvimento do ASP.NET, mesmo com a API em HTTP. Regenere com `dotnet dev-certs https` e, se preciso, `dotnet dev-certs https --trust`. Aconteceu de verdade nesta máquina em 2026-08-12.
- **Porta 5432 ocupada:** algum outro PostgreSQL está rodando. Pare-o, ou troque a porta em `apphost/sys-adivert.AppHost/AppHost.cs` **e** em `back-end/sys-adivert.Api/appsettings.Development.json` — os dois valores têm de bater.
- **O front abre mas toda tela dá erro de rede:** o recurso `api` não subiu. Veja o log dele no dashboard.
- **`Failed to determine the https port for redirect` no log do `api`:** esperado, não é erro. A API roda só em HTTP no ambiente local e o `Program.cs` chama `UseHttpsRedirection()` de qualquer forma; sem porta HTTPS de destino, o middleware avisa uma vez e segue. Confirmado em 2026-08-12.
- **Diagnóstico do Aspire:** `aspire doctor`.
````

- [ ] **Step 8: Conferir o README contra a realidade**

Verifique que a contagem de advertências citada no README bate com o que o Step 4 da Task 4 mostrou; ajuste o número se necessário.

- [ ] **Step 9: Commit**

```bash
git add .vscode/launch.json .vscode/tasks.json .gitignore README.md
git commit -m "feat: F5 sobe o ambiente completo, com README de pre-requisitos"
```

---

## Verificação final (após a Task 6)

Roteiro da spec, de ponta a ponta:

- [ ] F5 na pasta `sys-adivert/` com Docker fechado: preflight abre o Docker, os três recursos ficam saudáveis.
- [ ] O front carrega povoado; busca por nome, histórico por colaborador e histórico por motivo funcionam.
- [ ] Exportação Excel e PDF funcionam, incluindo o PDF de uma advertência com evidência.
- [ ] `docker exec (docker ps -q -f name=postgres) psql -U postgres -d sysadivert -c "select count(*) from \"Adiverts\";"` mostra os dados fictícios.
- [ ] Encerrar e apertar F5 de novo: banco novo com o mesmo conjunto.
- [ ] `Rename-Item .\front-end\node_modules node_modules_bkp` e F5: o preflight roda `npm ci` e o ambiente sobe.
- [ ] `cd front-end; npm run dev` avulso funciona e aponta para `localhost:5010`.
- [ ] `cd front-end; npm run build` continua gerando bundle com a URL do Render (produção intacta).
- [ ] `git diff --stat HEAD~6` não mostra `appsettings.json`, `front-end/.env`, `Dockerfile`, migrations nem nada em `front-end/src/`.

## Pendência registrada, fora deste plano

`back-end/sys-adivert.Api/appsettings.json` continua com host, usuário e senha do Supabase de produção em texto puro, e isso está no histórico do git. Tirar do arquivo exige configurar `ConnectionStrings__DefaultConnection` no Render antes do próximo deploy, e a limpeza só tem efeito real se a senha for rotacionada no Supabase. Ambas as pontas dependem de ação do usuário nos painéis. Ver a seção "Pendências fora de escopo" da spec.
