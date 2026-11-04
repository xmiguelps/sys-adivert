using Microsoft.EntityFrameworkCore;
using sys_adivert.Application.Repository;
using sys_adivert.Application.Service;
using sys_adivert.Infrastructure.Adiverts.Repository;
using sys_adivert.Infrastructure.Colabs.Repository;
using sys_adivert.Infrastructure.Motivos.Repository;
using sys_adivert.Infrastructure.Suspensoes.Repository;
using sys_adivert.Infrastructure.AppDb;
using sys_adivert.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    // Permite payloads maiores: imagens de evidencia trafegam como base64 no JSON.
    options.Limits.MaxRequestBodySize = 52_428_800; // 50 MB
});

builder.Services.AddOpenApi();

builder.Services.AddAuthorization();

builder.Services.AddControllers();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        // O padrao relacional e 42 comandos por batch, o que quebraria a
        // gravacao de um lote grande em varios round trips (na mesma conexao
        // e na mesma transacao, mas ainda assim varios). Alinhar com o teto
        // de itens do lote deixa o caso comum em um round trip so.
        npgsql => npgsql.MaxBatchSize(AdivertService.LimiteLote)
    )
);

// Adivert
builder.Services.AddScoped<IAdivertRepository, AdivertRepository>();
builder.Services.AddScoped<IAdivertService, AdivertService>();

// Suspensao
builder.Services.AddScoped<ISuspensaoRepository, SuspensaoRepository>();
builder.Services.AddScoped<ISuspensaoService, SuspensaoService>();

// Colab
builder.Services.AddScoped<IColabRepository, ColabRepository>();
builder.Services.AddScoped<IColabService, ColabService>();

// Motivo
builder.Services.AddScoped<IMotivoRepository, MotivoRepository>();
builder.Services.AddScoped<IMotivoService, MotivoService>();

builder.Services.AddCors(options => {
    options.AddPolicy("PublicPolicy", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

var migracao = new EstadoMigracao();

// Aplica migrations pendentes no startup (idempotente). Se o banco estiver fora do ar (ex.:
// Supabase gratuito pausado), tenta de novo com espera crescente e, esgotadas as tentativas,
// deixa o app subir: o processo morrendo em loop esconde o problema nos logs. Enquanto a
// migration nao for aplicada, o /health responde 503.
const int tentativasMigracao = 5;
for (var tentativa = 1; tentativa <= tentativasMigracao && !migracao.Aplicada; tentativa++)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        migracao.Aplicada = true;
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Falha ao aplicar migrations (tentativa {Tentativa}/{Total}).",
            tentativa, tentativasMigracao);

        if (tentativa < tentativasMigracao)
        {
            await Task.Delay(TimeSpan.FromSeconds(2 * tentativa));
        }
    }
}

if (!migracao.Aplicada)
{
    app.Logger.LogError(
        "Migrations nao aplicadas apos {Total} tentativas. O app sobe mesmo assim; o /health " +
        "responde 503 e tenta migrar de novo a cada chamada.", tentativasMigracao);
}
else if (app.Environment.IsDevelopment())
{
    // Dados ficticios apenas em desenvolvimento, e so com o schema migrado (com a migration
    // falha o seeder derrubaria o processo). O seeder ainda checa, por conta propria, se o
    // host e local antes de escrever qualquer linha.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DevDataSeeder.SeedAsync(db, app.Logger);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// O /health fica fora do redirecionamento HTTPS: o ping externo nao pode ser desviado.
app.UseWhen(
    ctx => !ctx.Request.Path.StartsWithSegments("/health"),
    branch => branch.UseHttpsRedirection());
app.UseCors("PublicPolicy");
app.UseAuthorization();
app.MapControllers();

// Health check publico, para o ping externo que mantem o Render e o Supabase gratuitos acordados.
// 200 so se as migrations foram aplicadas E o banco responde a um SELECT 1 (timeout de 10 s).
// Nunca devolve connection string nem mensagem de excecao: o detalhe vai so para o log.
app.MapMethods("/health", ["GET", "HEAD"], async (AppDbContext db, CancellationToken requestAborted) =>
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(requestAborted);
    cts.CancelAfter(TimeSpan.FromSeconds(10));

    try
    {
        if (!migracao.Aplicada)
        {
            // O startup nao conseguiu migrar (banco fora do ar): tenta de novo aqui, uma
            // chamada por vez, para o app se recuperar quando o banco voltar.
            await migracao.Trava.WaitAsync(cts.Token);
            try
            {
                if (!migracao.Aplicada)
                {
                    await db.Database.MigrateAsync(cts.Token);
                    migracao.Aplicada = true;
                    app.Logger.LogInformation("Migrations aplicadas pelo /health apos falha no startup.");
                }
            }
            finally
            {
                migracao.Trava.Release();
            }
        }

        await db.Database.ExecuteSqlRawAsync("SELECT 1", cts.Token);
        return Results.Json(new { status = "ok" });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Health check falhou.");
        return Results.Json(new { status = "unhealthy" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.Run();

// Estado da migration compartilhado entre o startup e o /health.
internal sealed class EstadoMigracao
{
    private volatile bool _aplicada;

    public bool Aplicada
    {
        get => _aplicada;
        set => _aplicada = value;
    }

    public SemaphoreSlim Trava { get; } = new(1, 1);
}
