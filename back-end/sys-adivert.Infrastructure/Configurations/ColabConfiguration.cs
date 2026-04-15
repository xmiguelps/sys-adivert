using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using sys_adivert.colab.Entity;

namespace sys_adivert.Infrastructure.Colabs.Configurations;

public class ColabConfiguration : IEntityTypeConfiguration<Colab>
{
    public void Configure(EntityTypeBuilder<Colab> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedOnAdd();
        builder.Property(c => c.Nome).HasMaxLength(255);
        builder.Property(c => c.Matricula).HasMaxLength(50);
    }
}