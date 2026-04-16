using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAvoirAndTypeDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FactureOrigineId",
                table: "Factures",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypeDocument",
                table: "Factures",
                type: "varchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_FactureOrigineId",
                table: "Factures",
                column: "FactureOrigineId");

            migrationBuilder.AddForeignKey(
                name: "FK_Factures_Factures_FactureOrigineId",
                table: "Factures",
                column: "FactureOrigineId",
                principalTable: "Factures",
                principalColumn: "NumeroFacture");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Factures_Factures_FactureOrigineId",
                table: "Factures");

            migrationBuilder.DropIndex(
                name: "IX_Factures_FactureOrigineId",
                table: "Factures");

            migrationBuilder.DropColumn(
                name: "FactureOrigineId",
                table: "Factures");

            migrationBuilder.DropColumn(
                name: "TypeDocument",
                table: "Factures");
        }
    }
}
