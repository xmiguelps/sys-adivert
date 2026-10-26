using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using sys_adivert.suspensao.Entity;

namespace sys_adivert.Infrastructure.Suspensoes.Configurations;

public class SuspensaoEvidenciaConfiguration : IEntityTypeConfiguration<SuspensaoEvidencia>
{
    public void Configure(EntityTypeBuilder<SuspensaoEvidencia> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();
        builder.Property(e => e.Conteudo).HasColumnType("bytea").IsRequired();
        builder.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(e => e.NomeArquivo).HasMaxLength(255);
        builder.Property(e => e.Ordem);
    }
}
