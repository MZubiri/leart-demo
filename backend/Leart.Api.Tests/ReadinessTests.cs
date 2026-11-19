using System.Net;
using Leart.Api.Data;
using Leart.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class ReadinessTests
{
    private sealed class Gate { public bool Fail { get; set; } }
    private sealed class ControlledDb(DbContextOptions<AppDbContext> options, Gate gate) : AppDbContext(options)
    {
        public override DbSet<TEntity> Set<TEntity>() => gate.Fail && typeof(TEntity) == typeof(SiteSetting)
            ? throw new IOException("Internal database unavailable") : base.Set<TEntity>();
    }

    [Fact]
    public async Task ReadinessFailsWhenDatabaseFailsButLivenessStaysHealthyAndApiNeverFallsBackToHtml()
    {
        var gate = new Gate();
        using var factory = new ApiFactory { OverrideServices = services => services.AddScoped<AppDbContext>(provider => new ControlledDb(provider.GetRequiredService<DbContextOptions<AppDbContext>>(), gate)) };
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
        gate.Fail = true;
        var failed = await client.GetAsync("/health/ready");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, failed.StatusCode);
        Assert.DoesNotContain("Internal database", await failed.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/nonexistent")).StatusCode);
    }

    [Fact]
    public async Task DatabaseInitializationFailureStopsStartup()
    {
        using var factory = new ApiFactory { MySqlConnection = "Server=127.0.0.1;Port=1;Database=missing;User=tests;Password=test-only-password;Connection Timeout=1" };
        await Assert.ThrowsAnyAsync<Exception>(() => Task.Run(() => factory.CreateClient()));
    }
}
