using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using sys_adivert.suspensao.Entity;

namespace sys_adivert.Infrastructure.Suspensoes.Configurations;

public class SuspensaoConfiguration : IEntityTypeConfiguration<Suspensao>
{
    public void Configure(EntityTypeBuilder<Suspensao> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedOnAdd();
        builder.Property(s => s.DataEmissao).HasColumnType("date");
        builder.Property(s => s.Matricula).HasMaxLength(50);
        builder.Property(s => s.Nome).HasMaxLength(255);
        builder.Property(s => s.Dias);
        builder.Property(s => s.DataInicio).HasColumnType("date");
        builder.Property(s => s.DataRetorno).HasColumnType("date");
        builder.Property(s => s.Motivo).HasMaxLength(455);
        builder.Property(s => s.Complemento).HasColumnType("text");
        builder.Property(s => s.Assinada).HasDefaultValue(false);

        // Contagem de advertencias e filtros por colaborador usam Matricula.
        builder.HasIndex(s => s.Matricula);

        builder.HasMany(s => s.Evidencias)
            .WithOne(e => e.Suspensao!)
            .HasForeignKey(e => e.SuspensaoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
