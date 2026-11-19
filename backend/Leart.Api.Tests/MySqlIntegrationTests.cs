using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Leart.Api.DTOs;
using Leart.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public sealed class MySqlFactAttribute : FactAttribute
{
    public MySqlFactAttribute() { if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("LEART_TEST_MYSQL"))) Skip = "Use node scripts/test-mysql.cjs for an isolated MySQL instance."; }
}

public class MySqlIntegrationTests
{
    [MySqlFact]
    public async Task BootstrapCatalogAndProductChangesSurviveRestartWithRealProvider()
    {
        var connection = Environment.GetEnvironmentVariable("LEART_TEST_MYSQL")!;
        using (var factory = new ApiFactory { MySqlConnection = connection })
        {
            using var client = factory.CreateClient();
            var products = await client.GetFromJsonAsync<List<ProductDto>>("/api/public/products");
            Assert.NotEmpty(products!);
            var rules = await client.GetFromJsonAsync<JsonElement>("/api/public/pricing");
            Assert.Equal(116000, rules.GetProperty("frames").GetProperty("M").GetProperty("1").GetInt32());
            var login = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password = "Test-only-bootstrap-password-2026" });
            login.EnsureSuccessStatusCode();
            var token = (await login.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            Assert.NotNull(await client.GetFromJsonAsync<PagedOrdersDto>("/api/admin/orders?pageSize=5"));
            Assert.NotNull(await client.GetFromJsonAsync<AdminDashboardDto>("/api/admin/orders/dashboard"));
            using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var product = await db.Products.FirstAsync(); product.Name = "Retained after restart"; await db.SaveChangesAsync();
            await db.Database.ExecuteSqlRawAsync("UPDATE PricingConfigurations SET RulesJson=JSON_SET(RulesJson, '$.frames.M.\"1\"', 117000), UpdatedAt=UTC_TIMESTAMP(6) WHERE Id=1");
            var changed = await client.GetFromJsonAsync<JsonElement>("/api/public/pricing");
            Assert.Equal(117000, changed.GetProperty("frames").GetProperty("M").GetProperty("1").GetInt32());
        }
        using (var factory = new ApiFactory { MySqlConnection = connection })
        {
            using var client = factory.CreateClient();
            var products = await client.GetFromJsonAsync<List<ProductDto>>("/api/public/products");
            Assert.Contains(products!, product => product.Name == "Retained after restart");
            var rules = await client.GetFromJsonAsync<JsonElement>("/api/public/pricing");
            Assert.Equal(117000, rules.GetProperty("frames").GetProperty("M").GetProperty("1").GetInt32());
            Assert.True(rules.GetProperty("simulated").GetBoolean());
        }
        using (var benchmark = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseMySQL(connection).Options))
            await VerifyOrderQueryPlans(benchmark);
        // Importar el SQL real del esquema anterior (Pomelo/EF9), sin historial.
        var options = new DbContextOptionsBuilder<AppDbContext>().UseMySQL(connection).Options;
        using var legacy = new AppDbContext(options);
        await legacy.Database.ExecuteSqlRawAsync("DROP TABLE OrderAttachments, PersonalizationOrders, Products, SiteSettings, AdminUsers, PricingConfigurations, __EFMigrationsHistory");
        await legacy.Database.ExecuteSqlRawAsync(await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Fixtures/LegacySchema.sql")));
        legacy.Products.Add(new Leart.Api.Models.Product { Id = "legacy", Name = "Retained legacy product", Category = "Cuadros" });
        legacy.SiteSettings.Add(new Leart.Api.Models.SiteSetting { StoreName = "Retained legacy store" });
        legacy.PersonalizationOrders.Add(new Leart.Api.Models.PersonalizationOrder { OrderReference = "LEGACY-ORDER", CustomerName = "Test", Phone = "573001112233",
            Attachments = [new() { FilePath = "/private/orders/legacy.png", OriginalFileName = "legacy.png" }] });
        await legacy.SaveChangesAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() => SchemaInitializer.InitializeAsync(legacy));
        await legacy.Database.ExecuteSqlRawAsync("ALTER TABLE Products ADD Unexpected int NULL");
        await Assert.ThrowsAsync<InvalidOperationException>(() => SchemaInitializer.AdoptExistingAsync(legacy));
        Assert.Empty(await legacy.Database.GetAppliedMigrationsAsync());
        await legacy.Database.ExecuteSqlRawAsync("ALTER TABLE Products DROP COLUMN Unexpected");
        await SchemaInitializer.AdoptExistingAsync(legacy);
        await SchemaInitializer.InitializeAsync(legacy);
        legacy.ChangeTracker.Clear();
        Assert.Equal("Retained legacy product", (await legacy.Products.SingleAsync()).Name);
        Assert.Equal("Retained legacy store", (await legacy.SiteSettings.SingleAsync()).StoreName);
        Assert.Equal("LEGACY-ORDER", (await legacy.PersonalizationOrders.SingleAsync()).OrderReference);
        Assert.Equal("/private/orders/legacy.png", (await legacy.OrderAttachments.SingleAsync()).FilePath);
    }

    private static async Task VerifyOrderQueryPlans(AppDbContext db)
    {
        db.PersonalizationOrders.AddRange(Enumerable.Range(1, 10000).Select(i => new Leart.Api.Models.PersonalizationOrder {
            CustomerName = "Test", Phone = "573001112233", Status = i % 3 == 0 ? "Pendiente" : "Completado",
            CreatedAt = new DateTime(2026, 1, 1).AddSeconds(i) }));
        await db.SaveChangesAsync();
        await db.Database.OpenConnectionAsync();
        try
        {
            foreach (var name in new[] { "IX_Orders_CreatedAt_Id", "IX_Orders_Status_CreatedAt_Id" })
            {
                await using var check = db.Database.GetDbConnection().CreateCommand();
                check.CommandText = "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='PersonalizationOrders' AND INDEX_NAME='" + name + "'";
                if (Convert.ToInt32(await check.ExecuteScalarAsync()) > 0)
                {
                    // Nombre procedente exclusivamente de la lista constante de índices de esta prueba.
                    check.CommandText = "DROP INDEX " + name + " ON PersonalizationOrders"; await check.ExecuteNonQueryAsync();
                }
            }
            async Task<string> Plan(string filter)
            {
                await using var command = db.Database.GetDbConnection().CreateCommand();
                command.CommandText = "EXPLAIN SELECT Id,OrderReference,CustomerName,Phone,ProductTitle,Status,CreatedAt FROM PersonalizationOrders " + filter + " ORDER BY CreatedAt DESC,Id DESC LIMIT 20";
                await using var reader = await command.ExecuteReaderAsync(); var details = "";
                while (await reader.ReadAsync()) details += Convert.ToString(reader["Extra"]);
                return details;
            }
            await db.Database.ExecuteSqlRawAsync("ANALYZE TABLE PersonalizationOrders");
            var before = await Plan(""); var filteredBefore = await Plan("WHERE Status='Pendiente'");
            await db.Database.ExecuteSqlRawAsync("CREATE INDEX IX_Orders_CreatedAt_Id ON PersonalizationOrders(CreatedAt,Id)");
            await db.Database.ExecuteSqlRawAsync("CREATE INDEX IX_Orders_Status_CreatedAt_Id ON PersonalizationOrders(Status,CreatedAt,Id)");
            await db.Database.ExecuteSqlRawAsync("ANALYZE TABLE PersonalizationOrders");
            var after = await Plan(""); var filteredAfter = await Plan("WHERE Status='Pendiente'");
            Console.WriteLine("EXPLAIN 10000 orders: unfiltered before=" + before + "; after=" + after + "; filtered before=" + filteredBefore + "; after=" + filteredAfter);
            Assert.Contains("filesort", before); Assert.Contains("filesort", filteredBefore);
            Assert.DoesNotContain("filesort", after); Assert.DoesNotContain("filesort", filteredAfter);
        }
        finally { await db.Database.CloseConnectionAsync(); }
    }
}
