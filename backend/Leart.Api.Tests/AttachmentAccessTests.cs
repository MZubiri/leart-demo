using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class AttachmentAccessTests
{
    [Fact]
    public async Task PhotosArePrivateAndRequireAnAuthenticatedDownload()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        using var content = new MemoryStream("private-test-photo"u8.ToArray());
        var (filePath, name, size) = await storage.SaveFileAsync(new FormFile(content, 0, content.Length, "photos", "reference.png"), "orders");
        var order = new PersonalizationOrder { CustomerName = "Test", Phone = "123", Attachments = [new OrderAttachment { FilePath = filePath, StoredFileName = name, OriginalFileName = "reference.png", FileSizeBytes = size }] };
        db.PersonalizationOrders.Add(order);
        await db.SaveChangesAsync();
        var url = $"/api/admin/orders/attachments/{order.Attachments[0].Id}";
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(url)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/uploads/orders/" + name)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(filePath)).StatusCode);
        var login = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password = "Test-only-bootstrap-password-2026" });
        var token = await login.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(token);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.Token);
        var download = await client.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("private-test-photo", await download.Content.ReadAsStringAsync());
        Assert.True(download.Headers.CacheControl?.NoStore);
    }
}
