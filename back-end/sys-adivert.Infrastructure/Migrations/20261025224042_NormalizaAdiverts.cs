using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizaAdiverts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Normaliza dados existentes: trim (espaco, tab, CR, LF) + maiusculas.
            // chr(32)/chr(9)/chr(13)/chr(10) evitam depender de escapes no literal SQL.
            migrationBuilder.Sql(@"
UPDATE ""Adiverts""
SET ""Nome"" = upper(btrim(""Nome"", chr(32) || chr(9) || chr(13) || chr(10))),
    ""Matricula"" = upper(btrim(""Matricula"", chr(32) || chr(9) || chr(13) || chr(10)))
WHERE ""Nome"" IS DISTINCT FROM upper(btrim(""Nome"", chr(32) || chr(9) || chr(13) || chr(10)))
   OR ""Matricula"" IS DISTINCT FROM upper(btrim(""Matricula"", chr(32) || chr(9) || chr(13) || chr(10)));
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Irreversivel: o texto original (caixa/espacos) nao e preservado.
        }
    }
}
