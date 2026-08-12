# sys-adivert

Sistema de advertências (DANLEX): API .NET 10 + PostgreSQL e front-end React/Vite.

## Rodando o ambiente completo

Abra esta pasta no VS Code e aperte **F5**. Sobem três recursos que ficam rodando:

| Recurso | O que é | Onde |
|---|---|---|
| `postgres` | PostgreSQL em container, **efêmero** | `localhost:5432` |
| `api` | Back-end .NET | `http://localhost:5010` |
| `front-end` | Vite em modo dev | link no dashboard do Aspire |

Um quarto recurso, `front-end-installer` (um Executable), também aparece no dashboard: ele instala as dependências do front-end, roda e chega a **Finished** antes de `front-end` iniciar — é esperado, não é um recurso preso ou com erro.

O dashboard do Aspire abre junto e concentra os logs de tudo isso.

### Pré-requisitos

- .NET SDK 10
- Node.js 20 ou superior
- Aspire CLI 13.x (`dotnet tool install -g Aspire.Cli`) — a extensão do VS Code depende dela e checa a presença **antes** de o preflight rodar, então sem ela o F5 para com um pedido de instalação e as mensagens do preflight nem aparecem
- Docker Desktop (o banco local roda em container)
- VS Code com as extensões `microsoft-aspire.aspire-vscode` e `ms-dotnettools.csdevkit` — ao abrir a pasta, o VS Code oferece instalar as duas
- Windows: o preflight é um script PowerShell e localiza o Docker Desktop por caminhos do Windows

O F5 roda `scripts/preflight.ps1` antes de tudo. Ele confere o .NET SDK, o Node, a Aspire CLI e o daemon do Docker (abrindo o Docker Desktop se estiver fechado), e garante `front-end/node_modules` (rodando `npm ci` se não existir) — mas não confere as extensões do VS Code. Se faltar algum desses, ele cancela o F5 com uma mensagem e, quando aplicável, o link ou comando de instalação.

Dica: ligue "Start Docker Desktop when you sign in" nas configurações do Docker Desktop para o F5 não precisar esperar o Docker subir.

### Sem VS Code

```powershell
cd apphost/sys-adivert.AppHost
aspire run
```

## O banco de desenvolvimento

Container efêmero com dados fictícios: **152 advertências e 40 colaboradores**, distribuídas pelos **50 motivos reais** que uma migration já insere (`20260528195547_CriandoTabelaDeMotivos`) — o seeder não cria motivo nenhum, só lê os que já existem e distribui as advertências entre eles (47 dos 50 recebem pelo menos uma). **4 imagens de evidência** ficam anexadas a **3** das advertências. Cada F5 recria o banco do zero, então **o que você cadastrar testando desaparece na próxima execução**.

O conjunto tem sempre a mesma forma: os mesmos colaboradores, as mesmas quantidades por pessoa, a mesma distribuição. As datas são relativas a hoje, de propósito, para os dados não envelhecerem — então duas execuções no mesmo dia são idênticas, e em dias diferentes só as datas absolutas deslizam.

Para inspecionar com DBeaver, pgAdmin ou psql:

```
Host=localhost;Port=5432;Database=sysadivert;Username=postgres;Password=postgres
```

Essa porta é servida pelo proxy de endpoints do Aspire, que escuta só em loopback e só existe enquanto o AppHost estiver rodando — o banco não é alcançável de outra máquina.

> **Atenção ao rodar a API fora do F5.** A proteção contra tocar produção depende de o ambiente ser `Development`, que é o que os perfis do `launchSettings.json` definem. Um `dotnet run` comum é seguro. Já `dotnet run --no-launch-profile`, sem definir `ASPNETCORE_ENVIRONMENT`, cai em `Production`, lê o `appsettings.json` e **conecta no Supabase de produção** — e o `Program.cs` chama `Migrate()` antes de qualquer checagem de ambiente. Se precisar desse comando, defina `$env:ASPNETCORE_ENVIRONMENT = "Development"` junto.

O seed roda apenas em ambiente `Development` e apenas quando a connection string aponta para host local — ele se recusa a escrever em banco remoto.

## Produção

O deploy usa `back-end/Dockerfile` e a connection string de `back-end/sys-adivert.Api/appsettings.json`; o front-end de produção usa `front-end/.env`. **Nenhum dos dois é usado pelo F5**, e nenhum deve ser alterado para mexer no ambiente local.

**Nunca defina `ASPNETCORE_ENVIRONMENT=Development` no Render.** O `appsettings.Development.json` é publicado dentro da imagem e aponta para `localhost:5432`; com essa variável ligada, o `Migrate()` do startup falha e o container entra em ciclo de reinício. Verificado em 2026-08-12: o serviço está em `Production` — o endpoint `/openapi/v1.json` responde 404, e ele só é registrado em Development.

## Problemas comuns

- **"unsecured transport"** ao subir o AppHost: defina `ASPIRE_ALLOW_UNSECURED_TRANSPORT=true`. A API roda em HTTP de propósito no ambiente local.
- **O AppHost não sobe e o erro fala de certificado ou de chave privada inacessível:** o dashboard do Aspire serve por HTTPS e precisa do certificado de desenvolvimento do ASP.NET, mesmo com a API em HTTP. Regenere com `dotnet dev-certs https` e, se preciso, `dotnet dev-certs https --trust`. Aconteceu de verdade nesta máquina em 2026-08-12.
- **Porta 5432 ocupada:** algum outro PostgreSQL está rodando. Pare-o, ou troque a porta em `apphost/sys-adivert.AppHost/AppHost.cs` **e** em `back-end/sys-adivert.Api/appsettings.Development.json` — os dois valores têm de bater.
- **O front abre mas toda tela dá erro de rede:** o recurso `api` não subiu. Veja o log dele no dashboard.
- **`Failed to determine the https port for redirect` no log do `api`:** esperado, não é erro. A API roda só em HTTP no ambiente local e o `Program.cs` chama `UseHttpsRedirection()` de qualquer forma; sem porta HTTPS de destino, o middleware avisa uma vez e segue. Confirmado em 2026-08-12.
- **Diagnóstico do Aspire:** `aspire doctor`.
