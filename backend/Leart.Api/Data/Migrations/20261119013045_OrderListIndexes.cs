using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Leart.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class OrderListIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedAt_Id",
                table: "PersonalizationOrders",
                columns: new[] { "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_CreatedAt_Id",
                table: "PersonalizationOrders",
                columns: new[] { "Status", "CreatedAt", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_CreatedAt_Id",
                table: "PersonalizationOrders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status_CreatedAt_Id",
                table: "PersonalizationOrders");
        }
    }
}
