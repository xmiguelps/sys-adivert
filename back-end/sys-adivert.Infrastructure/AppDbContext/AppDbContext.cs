using Microsoft.EntityFrameworkCore;
using sys_adivert.adivert.Entity;

namespace sys_adivert.Infrastructure.AppDb;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Adivert> Adiverts => Set<Adivert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}