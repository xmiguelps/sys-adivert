using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using sys_adivert.motivo.Entity;

namespace sys_adivert.Infrastructure.Motivos.Configurations;

public class MotivoConfiguration : IEntityTypeConfiguration<Motivo>
{
    public void Configure(EntityTypeBuilder<Motivo> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedOnAdd();
        builder.Property(m => m.Descricao).HasMaxLength(500);
        builder.HasIndex(m => m.Descricao).IsUnique();
    }
}
