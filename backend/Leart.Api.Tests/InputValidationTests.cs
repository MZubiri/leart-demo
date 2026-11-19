using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Leart.Api.DTOs;

namespace Leart.Api.Tests;

public class InputValidationTests
{
    private static async Task Authenticate(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password = "Test-only-bootstrap-password-2026" });
        response.EnsureSuccessStatusCode();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", (await response.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token);
    }

    [Theory]
    [InlineData("minFigures", -5)]
    [InlineData("maxFigures", 0)]
    [InlineData("maxFigures", 99)]
    [InlineData("basePrice", -1)]
    [InlineData("displayOrder", -1)]
    public async Task InvalidProductNumbersReturnBadRequest(string field, int value)
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient(); await Authenticate(client);
        var body = new JsonObject { ["name"] = "Test", ["category"] = "Sets armables", ["minFigures"] = 1, ["maxFigures"] = 4,
            ["variants"] = new JsonArray("Grupo 1") };
        body[field] = value;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/admin/products", body)).StatusCode);
    }

    [Fact]
    public async Task ProductCategoryAndReversedRangeAreRejected()
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient(); await Authenticate(client);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/admin/products", new { name = "Test", category = "Unknown", variants = new[] { "Standard" } })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/admin/products", new { name = "Test", category = "Cuadros", minFigures = 4, maxFigures = 2, variants = new[] { "Talla S" } })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PatchAsJsonAsync("/api/admin/orders/999/status", new { status = "Unknown" })).StatusCode);
    }

    [Fact]
    public async Task OptionalFormFieldsMayBeEmptyButLongNamesAndInvalidPhonesAreRejected()
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient();
        MultipartFormDataContent Form(string name, string phone) => new()
        {
            { new StringContent("TEST-REFERENCE"), "orderReference" }, { new StringContent(name), "customerName" },
            { new StringContent(phone), "phone" }, { new StringContent("Cuadros"), "productTitle" },
            { new StringContent(""), "story" }, { new StringContent(""), "peopleDetails" },
            { new StringContent(""), "phrase" }, { new StringContent(""), "requirements" }
        };
        using var valid = Form("Cliente", "573001112233");
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/public/personalization", valid)).StatusCode);
        using var longName = Form(new string('A', 101), "573001112233");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/public/personalization", longName)).StatusCode);
        using var phone = Form("Cliente", "abc123");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/public/personalization", phone)).StatusCode);
    }
}
