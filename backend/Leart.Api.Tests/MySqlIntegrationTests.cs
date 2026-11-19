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
    }
}
