using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using sys_adivert.adivert.Entity;

namespace sys_adivert.Infrastructure.Adiverts.Configurations;

public class AdivertConfiguration : IEntityTypeConfiguration<Adivert>
{
    public void Configure(EntityTypeBuilder<Adivert> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedOnAdd();
        builder.Property(a => a.Data).HasColumnType("date");
        builder.Property(c => c.Matricula).HasMaxLength(50);
        builder.Property(c => c.Nome).HasMaxLength(255);
        builder.Property(c => c.Motivo).HasMaxLength(455);
        builder.Property(c => c.Tipo).HasMaxLength(100);
        builder.Property(c => c.Assinada).HasDefaultValue(false);
        builder.Property(c => c.Complemento).HasColumnType("text");

        builder.HasMany(a => a.Evidencias)
            .WithOne(e => e.Adivert!)
            .HasForeignKey(e => e.AdivertId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}