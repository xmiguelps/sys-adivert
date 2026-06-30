using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssinadaToAdivert : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Assinada",
                table: "Adiverts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Assinada",
                table: "Adiverts");
        }
    }
}
