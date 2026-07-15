using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace sys_adivert.Infrastructure.AppDb;

// Usado apenas pelas ferramentas do EF Core em tempo de design (dotnet ef migrations/update).
// A presenca desta factory faz o EF NAO executar o Program.cs da API durante os comandos,
// evitando que o auto-migrate do startup rode (e exija banco) ao gerar migrations.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        // Mesma chave que o runtime usa (ConnectionStrings:DefaultConnection ->
        // env var ConnectionStrings__DefaultConnection), com fallbacks.
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=sysadivert;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }
}
