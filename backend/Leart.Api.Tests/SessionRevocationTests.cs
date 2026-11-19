using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class SessionRevocationTests
{
    [Fact]
    public async Task PasswordChangeAndAccountDeletionInvalidateIssuedTokens()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        async Task Login(string password)
        {
            var response = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password });
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", result!.Token);
        }
        await Login("Test-only-bootstrap-password-2026");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/admin/auth/me")).StatusCode);
        var changed = await client.PostAsJsonAsync("/api/admin/auth/change-password", new { currentPassword = "Test-only-bootstrap-password-2026", newPassword = "Replacement-test-password-2026" });
        changed.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/auth/me")).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        await Login("Replacement-test-password-2026");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/admin/auth/me")).StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.AdminUsers.Remove(await db.AdminUsers.SingleAsync());
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/admin/orders")).StatusCode);
    }
}
