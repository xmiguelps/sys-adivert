using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSuspensoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Suspensoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DataEmissao = table.Column<DateOnly>(type: "date", nullable: false),
                    Matricula = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nome = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Dias = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    DataRetorno = table.Column<DateOnly>(type: "date", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(455)", maxLength: 455, nullable: false),
                    Complemento = table.Column<string>(type: "text", nullable: true),
                    Assinada = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suspensoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SuspensaoEvidencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SuspensaoId = table.Column<int>(type: "integer", nullable: false),
                    Conteudo = table.Column<byte[]>(type: "bytea", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NomeArquivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuspensaoEvidencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SuspensaoEvidencias_Suspensoes_SuspensaoId",
                        column: x => x.SuspensaoId,
                        principalTable: "Suspensoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SuspensaoEvidencias_SuspensaoId",
                table: "SuspensaoEvidencias",
                column: "SuspensaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Suspensoes_Matricula",
                table: "Suspensoes",
                column: "Matricula");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SuspensaoEvidencias");

            migrationBuilder.DropTable(
                name: "Suspensoes");
        }
    }
}
