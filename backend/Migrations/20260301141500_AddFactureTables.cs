using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFactureTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Factures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Numero = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateEmission = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TotalHT = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TotalTVA = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TotalTTC = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Statut = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    SocieteId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Factures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Factures_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Factures_Societes_SocieteId",
                        column: x => x.SocieteId,
                        principalTable: "Societes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "LigneFactures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Quantite = table.Column<int>(type: "int", nullable: false),
                    PrixUnitaire = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MontantHT = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MontantTVA = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MontantTTC = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    FactureId = table.Column<int>(type: "int", nullable: false),
                    ProduitId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LigneFactures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LigneFactures_Factures_FactureId",
                        column: x => x.FactureId,
                        principalTable: "Factures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LigneFactures_Produits_ProduitId",
                        column: x => x.ProduitId,
                        principalTable: "Produits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_ClientId",
                table: "Factures",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_SocieteId",
                table: "Factures",
                column: "SocieteId");

            migrationBuilder.CreateIndex(
                name: "IX_LigneFactures_FactureId",
                table: "LigneFactures",
                column: "FactureId");

            migrationBuilder.CreateIndex(
                name: "IX_LigneFactures_ProduitId",
                table: "LigneFactures",
                column: "ProduitId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LigneFactures");

            migrationBuilder.DropTable(
                name: "Factures");
        }
    }
}
