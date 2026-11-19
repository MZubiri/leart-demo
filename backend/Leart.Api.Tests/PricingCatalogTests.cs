using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Leart.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Leart.Api.Tests;

public class PricingCatalogTests
{
    [Fact]
    public async Task PublicRulesExposeThePersistedSimulatedMatrix()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var rules = await client.GetFromJsonAsync<JsonElement>("/api/public/pricing");
        Assert.Equal(165000, rules.GetProperty("sets").GetProperty("Grupo 4").GetProperty("p1").GetInt32());
        Assert.True(rules.GetProperty("simulated").GetBoolean());
        Assert.Equal(2, rules.GetProperty("version").GetInt32());
        Assert.Equal(116000, rules.GetProperty("frames").GetProperty("M").GetProperty("1").GetInt32());
        Assert.Equal(146000, rules.GetProperty("frames").GetProperty("L").GetProperty("1").GetInt32());
        Assert.Equal(168000, rules.GetProperty("frames").GetProperty("L").GetProperty("2").GetInt32());
        Assert.Equal(3, rules.GetProperty("frameLimits").GetProperty("S").GetInt32());
    }

    [Fact]
    public async Task DatabaseChangesAreReadImmediatelyAndSeedingDoesNotOverwriteThem()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var configuration = await db.PricingConfigurations.SingleAsync();
        var json = JsonNode.Parse(configuration.RulesJson)!;
        json["frames"]!["M"]!["1"] = 117000;
        configuration.RulesJson = json.ToJsonString();
        await db.SaveChangesAsync();
        await DbInitializer.SeedAsync(db, NullLogger.Instance);
        var rules = await client.GetFromJsonAsync<JsonElement>("/api/public/pricing");
        Assert.Equal(117000, rules.GetProperty("frames").GetProperty("M").GetProperty("1").GetInt32());
        Assert.Single(await db.PricingConfigurations.ToListAsync());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("not json")]
    [InlineData("{}")]
    public async Task MissingOrInvalidPersistedRulesReturn503WithoutFileFallback(string? json)
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var configuration = await db.PricingConfigurations.SingleAsync();
        if (json is null) db.PricingConfigurations.Remove(configuration);
        else configuration.RulesJson = json;
        await db.SaveChangesAsync();
        var response = await client.GetAsync("/api/public/pricing");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("RulesJson", problem);
        Assert.DoesNotContain("116000", problem);
    }
}
