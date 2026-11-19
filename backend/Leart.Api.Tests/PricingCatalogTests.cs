using System.Net.Http.Json;
using System.Text.Json;

namespace Leart.Api.Tests;

public class PricingCatalogTests
{
    [Fact]
    public async Task PublicRulesExposeTheVersionedCommercialMatrix()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var rules = await client.GetFromJsonAsync<JsonElement>("/api/public/pricing");
        Assert.Equal(165000, rules.GetProperty("sets").GetProperty("Grupo 4").GetProperty("p1").GetInt32());
        Assert.Equal(JsonValueKind.Null, rules.GetProperty("frames").GetProperty("M").GetProperty("1").ValueKind);
        Assert.Equal(3, rules.GetProperty("frameLimits").GetProperty("S").GetInt32());
    }
}
