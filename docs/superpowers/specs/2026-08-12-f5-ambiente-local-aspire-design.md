# Design — Ambiente local completo com um F5 (Aspire + Postgres em container + dados fictícios)

**Data:** 2026-08-12
**Projeto:** sys-adivert (Sistema de Advertências — DANLEX)
**Escopo:** infraestrutura de desenvolvimento. Abrir a pasta `sys-adivert/` no VS Code e apertar F5
deve subir banco, back-end e front-end, com o banco populado de dados fictícios. Nenhuma alteração
de comportamento da aplicação, de regra de negócio ou de UI.

## Contexto

O repositório tem hoje três peças que precisam ser iniciadas na mão, em ordem, cada uma no seu
terminal:

- **back-end** — .NET 10, solução `back-end/sys-adivert.slnx` com quatro projetos (Api, Application,
  Domain, Infrastructure). Banco PostgreSQL via `Npgsql.EntityFrameworkCore.PostgreSQL`. O
  `Program.cs` já chama `db.Database.Migrate()` no startup, então o schema se resolve sozinho contra
  qualquer banco vazio.
- **front-end** — React 19 + Vite 8, consome a API por `import.meta.env.VITE_API_URL` em ~30 pontos
  (`App.tsx` e componentes). Não há proxy: as chamadas vão direto para a URL absoluta.
- **banco** — hoje só existe o Supabase de produção.

Não há `.vscode/`, não há `docker-compose`, não há dados de desenvolvimento e não há projeto de
orquestração. O `back-end/Dockerfile` existe, mas serve ao deploy (Render), não ao dia a dia.

### O problema da connection string

`back-end/sys-adivert.Api/appsettings.Development.json` não define connection string. Como o .NET
resolve configuração em camadas (`appsettings.json` → `appsettings.{Environment}.json` → variável de
ambiente, a última vencendo), **hoje qualquer execução local cai no Supabase de produção**, cuja
connection string está em `appsettings.json` com host, usuário e senha em texto puro, commitada no
git.

Isso torna o isolamento de produção um requisito de primeira classe deste trabalho, e não um detalhe
de configuração. O usuário foi explícito: *"não quero que quando eu rode apertando F5 ele use banco
real"*.

### Ferramentas já presentes na máquina do usuário

Verificado em 2026-08-12: .NET SDK 10.0.103, `dotnet-ef` 10.0.5, Node 24.17.0 / npm 11.13.0,
**Aspire CLI 13.4.6**, extensões **`microsoft-aspire.aspire-vscode`**, `ms-dotnettools.csdevkit`,
`ms-dotnettools.csharp` e `ms-azuretools.vscode-docker`, Docker 29.2.1 instalado **com o daemon
parado**. Porta 5432 livre e nenhum serviço PostgreSQL instalado.

Ou seja: a abordagem escolhida não exige instalar nada nesta máquina.

## Decisões confirmadas com o usuário

1. **Abordagem: Aspire AppHost** (opção A), sobre `launch.json` + `docker compose` (B) e sobre tudo
   em containers (C). Motivo decisivo: o toolchain já está instalado, e o AppHost é o único arranjo
   em que a connection string e a URL da API são *injetadas* em vez de duplicadas em arquivos de
   configuração.
2. **Sem debugger anexado.** O F5 sobe os três serviços; a investigação é por log no dashboard do
   Aspire. Não há alvo de debug do navegador nem breakpoints no C# como requisito.
3. **Banco começa sempre igual.** Container efêmero, sem volume de dados: cada F5 nasce limpo e
   recebe o mesmo conjunto fictício — mesma quantidade, mesmos nomes, mesmos deslocamentos de data
   (as datas são relativas a hoje; ver "Dados fictícios"). O que for cadastrado testando desaparece
   no próximo F5.
4. **Volume de dados: realista.** ~40 colaboradores, ~10 motivos, ~250 advertências, com evidências
   em algumas.
5. **Preflight resolve o que dá.** Inicia o Docker Desktop se estiver parado, roda `npm ci` se
   `node_modules` faltar, e aborta o F5 com mensagem em português quando falta algo que só o usuário
   pode instalar.
6. **Limpeza da senha de produção fica fora deste ciclo** (ver "Pendências fora de escopo").

## Arquitetura

Um projeto novo, o AppHost, passa a ser o único lugar que descreve o ambiente de desenvolvimento:

```
sys-adivert/
├─ .vscode/
│  ├─ launch.json          ← alvos de F5
│  ├─ tasks.json           ← preflight + build
│  └─ extensions.json      ← recomenda Aspire + C# Dev Kit
├─ apphost/
│  └─ sys-adivert.AppHost/ ← NOVO: descreve banco + API + front-end
├─ scripts/preflight.ps1   ← verificação antes do F5
├─ global.json             ← fixa o SDK 10
├─ back-end/               ← config + seed
└─ front-end/              ← 2 linhas no vite.config.ts
```

### O AppHost

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Credenciais e porta fixas: assim a connection string escrita em
// appsettings.Development.json bate com o container, e dá para abrir o banco
// num cliente (DBeaver/pgAdmin) com credenciais conhecidas.
var pgUser = builder.AddParameter("pg-user", "postgres");
var pgPassword = builder.AddParameter("pg-password", "postgres");

// Sem WithDataVolume(): container efêmero, banco novo a cada execução.
var postgres = builder.AddPostgres("postgres", userName: pgUser, password: pgPassword, port: 5432);
var db = postgres.AddDatabase("sysadivert");

var api = builder.AddProject<Projects.sys_adivert_Api>("api", launchProfileName: "http")
                 .WithEnvironment("ConnectionStrings__DefaultConnection", db)
                 .WaitFor(db);

builder.AddViteApp("front-end", "../../front-end")
       .WithEnvironment("VITE_API_URL", api.GetEndpoint("http"))
       .WithReference(api)
       .WaitFor(api);

builder.Build().Run();
```

Quatro decisões embutidas nessas linhas:

- **Perfil `http` explícito.** O `launchSettings.json` tem os perfis `http` e `https`. Fixar `http`
  evita a causa clássica de "o front não consegue falar com a API".

  Precisão corrigida durante a implementação (2026-08-12): fixar `http` **não** neutraliza o
  `app.UseHttpsRedirection()` — `Program.cs` o chama incondicionalmente e o middleware roda em toda
  requisição. O que o perfil evita é o *redirect disparar*, porque não há porta HTTPS de destino, e o
  Kestrel precisar do certificado de dev para abrir um listener HTTPS. Efeito colateral aceito: o
  middleware loga uma vez `Failed to determine the https port for redirect`.

  Correção feita durante a implementação (2026-08-12): isso **não** dispensa o certificado de
  desenvolvimento do ambiente como um todo. O próprio dashboard do Aspire serve por HTTPS, então um
  certificado de dev ausente ou com chave privada inacessível impede o AppHost de subir, mesmo com a
  API em HTTP. Na máquina do usuário o certificado existente tinha chave privada inacessível e teve
  de ser regenerado com `dotnet dev-certs https` antes de o AppHost rodar. Está documentado na seção
  de problemas comuns do README.
- **Porta 5010 preservada.** É a porta que o perfil `http` já usa, então F5 e `dotnet run` avulso se
  comportam igual e o `.env.development` do front pode apontar para um endereço estável.
- **`ConnectionStrings__DefaultConnection` nomeada à mão.** O padrão do Aspire seria
  `ConnectionStrings__sysadivert`, que o `Program.cs` não lê. Nomear explicitamente evita alterar o
  `Program.cs` por causa disso.
- **Porta 5432 fixa no host.** Sem isso o Aspire sorteia a porta a cada execução e nenhuma
  connection string escrita em arquivo conseguiria acompanhar.

  Como isso funciona de fato, medido em 2026-08-12 (o mecanismo não é o que o desenho supunha):
  o `port: 5432` **não** vira a porta publicada do container. O container publica em
  `127.0.0.1:<aleatória>` e o **proxy de endpoint do Aspire** escuta em `localhost:5432`,
  encaminhando para ele. O efeito prático é o desejado — `Host=localhost;Port=5432` acha o banco,
  e clientes como DBeaver/pgAdmin conectam — com duas consequências que importam:

  1. O proxy escuta **só em loopback**. O nome da máquina não alcança o banco, nem de outra
     máquina da rede. Isso é bom para segurança e foi o que invalidou o teste de guarda original.
  2. O proxy só existe enquanto o AppHost roda. Um `dotnet run` avulso com o AppHost desligado
     não conecta em nada — falha segura, nunca produção.

Sequência do F5: preflight → AppHost inicia → container Postgres sobe e fica saudável → API sobe,
aplica migrations e popula os dados fictícios → `npm run dev` sobe → dashboard do Aspire abre com os
três recursos, o log de cada um e o link do front-end.

### Ajuste obrigatório no Vite

`AddViteApp` registra o endpoint HTTP do front-end, escolhe a porta e a comunica pela variável
`PORT` — mas o Vite não lê `PORT` por conta própria (o padrão dele é 5173). Sem o ajuste, o dashboard
mostraria um link para uma porta onde o Vite não está ouvindo.

```ts
server: {
  port: Number(process.env.PORT) || 5173,
  strictPort: Boolean(process.env.PORT),
}
```

`strictPort` condicional: sob o Aspire, falhar alto é melhor que o Vite migrar silenciosamente para
outra porta e desalinhar do endpoint anunciado. Fora do Aspire (`npm run dev` puro), o comportamento
atual é preservado — 5173 com fallback automático.

## Isolamento de produção

Três camadas independentes, cada uma cobrindo uma falha diferente:

**Camada 1 — injeção pelo Aspire.** `WithEnvironment("ConnectionStrings__DefaultConnection", db)`
produz uma variável de ambiente, que vence qualquer `appsettings*.json`. No F5, a API fala com o
container. Nenhum arquivo editado para isso.

**Camada 2 — `appsettings.Development.json`.** Passa a conter:

```
Host=localhost;Port=5432;Database=sysadivert;Username=postgres;Password=postgres
```

Efeito: um `dotnet run` avulso na máquina do desenvolvedor vai para o container local em vez de
produção. Senha fraca é aceitável porque o banco é efêmero, contém apenas dados falsos e não expõe
porta para fora da máquina.

**Camada 3 — guarda no seeder.** Cobre o cenário mais perigoso: rodar com
`ASPNETCORE_ENVIRONMENT=Development` apontando para o Supabase, e o seeder despejar 250 advertências
fictícias em produção. O seeder só executa se o host da connection string for `localhost`,
`127.0.0.1` ou `::1`; caso contrário retorna sem escrever nada e loga o motivo em nível `Warning`.

**Front-end.** Novo arquivo `front-end/.env.development` com
`VITE_API_URL=http://localhost:5010`. O Vite carrega `.env.development` apenas em modo dev, e
variáveis de processo (as injetadas pelo Aspire) vencem os arquivos `.env`. O `front-end/.env`
atual — que aponta para `https://sys-adivert.onrender.com` — **não é tocado**, então o build de
produção continua idêntico ao de hoje.

## Dados fictícios

Arquivo novo: `back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs`, namespace
`sys_adivert.Infrastructure.Seed`. Chamado do `Program.cs` dentro do bloco de escopo que já existe,
imediatamente após `db.Database.Migrate()`:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (app.Environment.IsDevelopment())
    {
        await DevDataSeeder.SeedAsync(db, app.Logger);
    }
}
```

O seeder mora em Infrastructure (onde o `AppDbContext` e o Npgsql já vivem) e recebe apenas
`AppDbContext` e `ILogger`. A checagem de ambiente fica no `Program.cs`; a checagem de host fica
dentro do seeder, lida de `db.Database.GetConnectionString()` via `NpgsqlConnectionStringBuilder`.
Nenhuma dependência nova em nenhum projeto.

**Três condições para escrever qualquer linha:** ambiente `Development`, host local, e
`!await db.Colabs.AnyAsync()`. Idempotente por construção.

**Determinismo.** Listas fixas no código mais `new Random(20260812)` para distribuir tipos,
assinaturas e deslocamentos de data. As datas são relativas a `DateTime.Today` (0 a 730 dias atrás),
não a uma data fixa — assim o conjunto tem sempre a mesma *forma* e os mesmos deslocamentos
relativos, mas não envelhece até virar "nenhuma advertência nos últimos seis meses". Nenhuma
biblioteca de dados falsos (nada de Bogus).

**Conteúdo:**

- **Nenhum motivo é criado.** Descoberto durante a implementação (2026-08-12): a migration
  `20260528195547_CriandoTabelaDeMotivos` já insere os **motivos reais da operação** em todo banco
  novo. O desenho original inventava 10 motivos próprios, o que produzia um defeito concreto: as
  ~155 advertências fictícias referenciavam só os 10 inventados, deixando os motivos reais com zero
  advertências — de modo que o histórico por motivo e o Excel por motivo, que são justamente o que
  estes dados existem para exercitar, apareceriam **vazios exatamente nos motivos que o usuário
  usa**. Decisão do usuário: o seeder lê os motivos existentes e sorteia entre eles, sem criar
  nenhum. A lista de motivos na tela fica idêntica à de produção.
- **40 colaboradores** com nomes claramente fictícios e matrículas sequenciais a partir de `10001`.
  A escolha dos nomes evita de propósito qualquer semelhança com funcionário real.
- **~155 advertências** distribuídas nos últimos 24 meses. Mistura de `Escrita` e `Verbal` (os dois
  únicos valores que o `TipoSelect.tsx` oferece), cerca de dois terços com `Assinada = true`, cerca
  de um terço com `Complemento` preenchido. Distribuição **deliberadamente desigual**: 5
  colaboradores com 8–12 advertências, 10 com 4–7 e os 25 restantes com 1–3, senão o histórico por
  colaborador e o Excel por motivo não mostram nada interessante.

  O número saiu de ~250 para ~155 durante o planejamento, por incoerência aritmética: 250
  advertências em 40 colaboradores exigem média de 6,25 por pessoa, o que é incompatível com "a
  maioria tem de 1 a 3" a menos que os reincidentes tivessem ~30 cada — irreal para RH. Optou-se por
  preservar a distribuição realista e reduzir o total; ~155 já é volume mais que suficiente para
  exercitar rolagem da lista, histórico e exportações.
- **3 advertências com 1–2 evidências** cada. As imagens são PNGs gerados em código (retângulo de cor
  sólida, ~600×400), com um helper de CRC32 de ~15 linhas e `ZLibStream` do BCL — sem pacote novo e
  sem blob base64 no fonte. Serve para conferir o PDF com evidência sem subir arquivo na mão.
  **O seeder precisa gravar `ContentType = "image/png"` explicitamente:** o default da entidade
  `AdivertEvidencia` é `"image/jpeg"`, e `pdfAdvertencia.ts` monta a *data URL* a partir desse campo
  (`toDataUrl`), então um PNG rotulado como JPEG produziria `data:image/jpeg;base64,<PNG>` e o
  pdfmake não renderizaria a imagem.

Esta última é a peça de menor valor do conjunto: se a geração de PNG custar desproporcionalmente na
implementação, ela é cortada e o usuário é avisado, sem bloquear o resto.

## Preflight e robustez em máquina nova

Nenhum arranjo faz o F5 funcionar numa máquina sem os pré-requisitos. O objetivo do preflight é
trocar falhas enigmáticas por instruções, e resolver o que é resolvível.

`scripts/preflight.ps1`, executado como `preLaunchTask`, nesta ordem:

1. **.NET SDK 10** — via `dotnet --list-sdks`. Ausente ou anterior: aborta com link de download.
2. **Node ≥ 20** — via `node -v`. Ausente: aborta com link.
3. **Daemon do Docker** — via `docker info`. Se falhar, procura o Docker Desktop instalado; se
   encontrar, inicia e faz *polling* até ~120 s pelo daemon; se não encontrar, aborta com link.
4. **`front-end/node_modules`** — ausente: roda `npm ci` (o `package-lock.json` existe).

Saída 0 libera o F5; qualquer aborto retorna código diferente de 0, o que faz o VS Code cancelar o
lançamento e mostrar a mensagem. O script é escrito para rodar no **Windows PowerShell 5.1** que já
vem no Windows (sem `??`, sem operador ternário, sem `&&`), invocado com
`-NoProfile -ExecutionPolicy Bypass`.

Complementos:

- **`.vscode/extensions.json`** recomendando `microsoft-aspire.aspire-vscode` e
  `ms-dotnettools.csdevkit`: ao abrir a pasta, o VS Code oferece instalar.
- **`global.json`** fixando o SDK major 10 com `rollForward: latestFeature`: numa máquina com SDK 8,
  o erro passa a dizer exatamente isso.
- **Segundo alvo de F5** (`coreclr`, executando a DLL do AppHost com `preLaunchTask` de build):
  funciona sem a extensão do Aspire instalada, com a URL do dashboard impressa no console. O alvo
  padrão continua sendo o do Aspire. Este alvo roda o **AppHost** sob o depurador do .NET, o que é
  incidental do tipo de configuração e não contraria a decisão 2: não há debugger anexado à API nem
  ao front-end, e nenhum breakpoint em código de aplicação é esperado.
- **`README.md` na raiz** (hoje não existe): pré-requisitos, como rodar, o que sobe e em quais
  portas, credenciais do banco local, o fato de o banco ser efêmero, e como rodar sem VS Code
  (`aspire run`).

## Arquivos

**Novos:**

| Arquivo | Papel |
|---|---|
| `apphost/sys-adivert.AppHost/sys-adivert.AppHost.csproj` | Projeto AppHost |
| `apphost/sys-adivert.AppHost/AppHost.cs` | Descrição do ambiente |
| `apphost/.gitignore` | `bin/`, `obj/` |
| `.vscode/launch.json` | Alvos de F5 |
| `.vscode/tasks.json` | `preflight` e build |
| `.vscode/extensions.json` | Extensões recomendadas |
| `scripts/preflight.ps1` | Verificação pré-F5 |
| `global.json` | Fixa SDK 10 |
| `back-end/sys-adivert.Infrastructure/Seed/DevDataSeeder.cs` | Dados fictícios |
| `front-end/.env.development` | `VITE_API_URL` local |
| `README.md` | Pré-requisitos e como rodar |

**Modificados:**

| Arquivo | Alteração |
|---|---|
| `back-end/sys-adivert.Api/Program.cs` | Uma chamada ao seeder no escopo existente |
| `back-end/sys-adivert.Api/appsettings.Development.json` | Connection string local |
| `back-end/sys-adivert.slnx` | Registrar o AppHost |
| `front-end/vite.config.ts` | Respeitar `process.env.PORT` |

**Explicitamente não tocados:** `back-end/sys-adivert.Api/appsettings.json` (produção),
`front-end/.env` (produção), `back-end/Dockerfile`, migrations existentes, e nenhum componente do
front-end.

## Verificação

1. F5 na pasta `sys-adivert/`: dashboard abre com `postgres`, `api` e `front-end` saudáveis.
2. Abrir o front pelo link do dashboard: a lista traz as ~155 advertências.
3. Exercitar as features que dependem de volume: busca por nome, histórico por colaborador,
   histórico por motivo, exportação Excel e PDF, e o PDF de uma das advertências com evidência.
4. Confirmar o isolamento: conectar em `localhost:5432` e ver os dados fictícios; confirmar que o
   Supabase não recebeu escrita alguma.
5. Parar e apertar F5 de novo: banco novo, mesmo conjunto de dados.
6. Fechar o Docker Desktop e apertar F5: o preflight inicia o Docker e o ambiente sobe.
7. Renomear `front-end/node_modules` e apertar F5: o preflight roda `npm ci` e o ambiente sobe.
8. `npm run dev` avulso continua funcionando e aponta para `localhost:5010`.
9. `npm run build` continua gerando bundle apontando para o Render (produção intacta).

## Riscos e pontos a confirmar na implementação

- ~~**Identificador do pacote de hospedagem JavaScript do Aspire 13.**~~ **Resolvido** em
  2026-08-12 via `aspire integration list`: a integração se chama `javascript` e corresponde ao
  pacote `Aspire.Hosting.JavaScript` 13.4.6 (o antigo `Aspire.Hosting.NodeJs` foi renomeado). O
  Postgres é a integração `postgresql` → `Aspire.Hosting.PostgreSQL` 13.4.6.
- **Sobrecarga `WithEnvironment(string, IResourceBuilder<IResourceWithConnectionString>)`.** Se não
  existir em 13.4, o equivalente é o callback:
  `.WithEnvironment(ctx => ctx.EnvironmentVariables["ConnectionStrings__DefaultConnection"] = db.Resource.ConnectionStringExpression)`.
- **Campo `program` do alvo `aspire` no `launch.json`.** A documentação mostra a pasta do workspace;
  como o AppHost não está na raiz, será apontado para o `.csproj` e validado na prática.
- **Primeira execução é lenta:** *pull* da imagem do Postgres, `dotnet restore` e possivelmente
  `npm ci`. As seguintes são rápidas.
- **`AddViteApp` e instalação de pacotes.** Se a integração já instalar dependências sozinha, o passo
  de `npm ci` sai do preflight para não duplicar trabalho.

## Pendências fora de escopo

**Credenciais de produção no repositório.** `back-end/sys-adivert.Api/appsettings.json` contém host,
usuário e senha do Supabase de produção em texto puro, e isso está no histórico do git. Este ciclo
não mexe nisso, por duas razões concretas: tirar o valor do arquivo exige configurar
`ConnectionStrings__DefaultConnection` no Render **antes** do próximo deploy, senão produção sobe sem
banco; e a limpeza só tem efeito real se a senha for **rotacionada no Supabase**, já que a atual está
no histórico. Ambas as pontas dependem de ação do usuário nos painéis do Render e do Supabase.

Recomendação registrada: rotacionar a senha no Supabase e mover a connection string para variável de
ambiente no Render, em um ciclo próprio.

**Início automático do Docker Desktop com o Windows.** O preflight cobre o caso do Docker fechado,
mas ligar "Start Docker Desktop when you sign in" nas configurações do Docker Desktop elimina a
espera. É um ajuste manual de um clique, mencionado no README.
