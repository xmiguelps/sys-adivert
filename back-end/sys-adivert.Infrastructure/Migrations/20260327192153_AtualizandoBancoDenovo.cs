using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AtualizandoBancoDenovo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Adiverts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Data = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Matricula = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(455)", maxLength: 455, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Adiverts", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Adiverts");
        }
    }
}
