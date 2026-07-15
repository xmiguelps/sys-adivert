using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddComplementoEEvidencias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Complemento",
                table: "Adiverts",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AdivertEvidencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AdivertId = table.Column<int>(type: "integer", nullable: false),
                    Conteudo = table.Column<byte[]>(type: "bytea", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NomeArquivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdivertEvidencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdivertEvidencias_Adiverts_AdivertId",
                        column: x => x.AdivertId,
                        principalTable: "Adiverts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdivertEvidencias_AdivertId",
                table: "AdivertEvidencias",
                column: "AdivertId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdivertEvidencias");

            migrationBuilder.DropColumn(
                name: "Complemento",
                table: "Adiverts");
        }
    }
}
