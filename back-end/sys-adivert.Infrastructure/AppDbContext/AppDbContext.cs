using Microsoft.EntityFrameworkCore;
using sys_adivert.adivert.Entity;
using sys_adivert.colab.Entity;

namespace sys_adivert.Infrastructure.AppDb;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Adivert> Adiverts => Set<Adivert>();

    public DbSet<Colab> Colabs => Set<Colab>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}