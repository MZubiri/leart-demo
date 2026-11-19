using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class ErrorResponseTests
{
    private sealed class FailingTokens : ITokenService
    {
        public (string token, DateTime expiresAt) GenerateToken(AdminUser user) => throw new InvalidOperationException("INTERNAL_TEST_SECRET_DETAIL");
    }

    [Fact]
    public async Task UnexpectedErrorsReturnCorrelationWithoutInternalDetails()
    {
        using var factory = new ApiFactory { OverrideServices = services => services.AddScoped<ITokenService, FailingTokens>() };
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password = "Test-only-bootstrap-password-2026" });
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("INTERNAL_TEST_SECRET_DETAIL", body);
        Assert.DoesNotContain("InvalidOperationException", body);
        using var json = JsonDocument.Parse(body);
        Assert.False(string.IsNullOrEmpty(json.RootElement.GetProperty("traceId").GetString()));
    }
}
