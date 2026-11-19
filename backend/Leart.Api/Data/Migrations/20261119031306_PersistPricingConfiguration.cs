using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Leart.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class PersistPricingConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PricingConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    RulesJson = table.Column<string>(type: "json", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingConfigurations", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PricingConfigurations");
        }
    }
}
