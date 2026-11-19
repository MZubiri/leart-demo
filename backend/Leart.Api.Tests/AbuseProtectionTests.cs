using System.Net;
using System.Net.Http.Json;

namespace Leart.Api.Tests;

public class AbuseProtectionTests
{
    [Fact]
    public async Task LoginRejectsRepeatedAttemptsAndReturnsRetryAfter()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "missing", password = "invalid-test-password" })).StatusCode);
        var limited = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "missing", password = "invalid-test-password" });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.NotNull(limited.Headers.RetryAfter);
    }

    [Fact]
    public async Task PersonalizationHasItsOwnSubmissionLimit()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        for (var i = 0; i < 10; i++)
        {
            using var form = new MultipartFormDataContent { { new StringContent(""), "customerName" } };
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/public/personalization", form)).StatusCode);
        }
        using var last = new MultipartFormDataContent { { new StringContent(""), "customerName" } };
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsync("/api/public/personalization", last)).StatusCode);
    }
}
