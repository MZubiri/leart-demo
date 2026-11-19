using System.Net.Http.Headers;
using System.Net.Http.Json;
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
            var login = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password = "Test-only-bootstrap-password-2026" });
            login.EnsureSuccessStatusCode();
            var token = (await login.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var product = await db.Products.FirstAsync(); product.Name = "Retained after restart"; await db.SaveChangesAsync();
        }
        using (var factory = new ApiFactory { MySqlConnection = connection })
        {
            using var client = factory.CreateClient();
            var products = await client.GetFromJsonAsync<List<ProductDto>>("/api/public/products");
            Assert.Contains(products!, product => product.Name == "Retained after restart");
        }
        // Importar el SQL real del esquema anterior (Pomelo/EF9), sin historial.
        var options = new DbContextOptionsBuilder<AppDbContext>().UseMySQL(connection).Options;
        using var legacy = new AppDbContext(options);
        await legacy.Database.ExecuteSqlRawAsync("DROP TABLE OrderAttachments, PersonalizationOrders, Products, SiteSettings, AdminUsers, __EFMigrationsHistory");
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
}
