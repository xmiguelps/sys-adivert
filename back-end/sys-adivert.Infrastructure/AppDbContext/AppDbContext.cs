using Microsoft.EntityFrameworkCore;
using sys_adivert.adivert.Entity;
using sys_adivert.colab.Entity;
using sys_adivert.motivo.Entity;

namespace sys_adivert.Infrastructure.AppDb;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Adivert> Adiverts => Set<Adivert>();

    public DbSet<AdivertEvidencia> AdivertEvidencias => Set<AdivertEvidencia>();

    public DbSet<Colab> Colabs => Set<Colab>();

    public DbSet<Motivo> Motivos => Set<Motivo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}