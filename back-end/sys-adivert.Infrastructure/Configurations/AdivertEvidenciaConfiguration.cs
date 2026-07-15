using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using sys_adivert.adivert.Entity;

namespace sys_adivert.Infrastructure.Adiverts.Configurations;

public class AdivertEvidenciaConfiguration : IEntityTypeConfiguration<AdivertEvidencia>
{
    public void Configure(EntityTypeBuilder<AdivertEvidencia> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();
        builder.Property(e => e.Conteudo).HasColumnType("bytea").IsRequired();
        builder.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(e => e.NomeArquivo).HasMaxLength(255);
        builder.Property(e => e.Ordem);
    }
}
