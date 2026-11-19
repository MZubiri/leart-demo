using System.Net;
using System.Net.Http.Json;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class CatalogAvailabilityTests
{
    private sealed class FailureSwitch { public bool Fail { get; set; } }
    private sealed class ControlledReads(DbContextOptions<AppDbContext> options, FailureSwitch gate) : AppDbContext(options)
    {
        public override DbSet<TEntity> Set<TEntity>() => gate.Fail && (typeof(TEntity) == typeof(Product) || typeof(TEntity) == typeof(SiteSetting))
            ? throw new IOException("Test database unavailable") : base.Set<TEntity>();
    }

    [Fact]
    public async Task DatabaseFailureReturnsUnavailableInsteadOfSeedProductsOrDefaultSettings()
    {
        var gate = new FailureSwitch();
        using var factory = new ApiFactory { OverrideServices = services => services.AddScoped<AppDbContext>(provider => new ControlledReads(provider.GetRequiredService<DbContextOptions<AppDbContext>>(), gate)) };
        using var client = factory.CreateClient(); gate.Fail = true;
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/api/public/products")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/api/public/settings")).StatusCode);
    }

    [Fact]
    public async Task EmptyCatalogStaysEmptyAndPlaceholderContactIsNotPublic()
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Products.RemoveRange(db.Products); await db.SaveChangesAsync();
        Assert.Empty((await client.GetFromJsonAsync<List<ProductDto>>("/api/public/products"))!);
        var settings = await client.GetFromJsonAsync<PublicSettingsDto>("/api/public/settings");
        Assert.Equal(string.Empty, settings!.WhatsAppNumber);
    }
}
