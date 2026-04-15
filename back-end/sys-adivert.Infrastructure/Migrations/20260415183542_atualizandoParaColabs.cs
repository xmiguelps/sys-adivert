using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class atualizandoParaColabs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Colab",
                table: "Colab");

            migrationBuilder.RenameTable(
                name: "Colab",
                newName: "Colabs");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Colabs",
                table: "Colabs",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Colabs",
                table: "Colabs");

            migrationBuilder.RenameTable(
                name: "Colabs",
                newName: "Colab");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Colab",
                table: "Colab",
                column: "Id");
        }
    }
}
