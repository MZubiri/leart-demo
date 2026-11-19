using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Models;
using Microsoft.Extensions.DependencyInjection;
namespace Leart.Api.Tests;

public class OrderPaginationTests
{
    [Fact]
    public async Task ListsAreBoundedStableSummariesAndDashboardUsesRealTotals()
    {
        using var factory = new ApiFactory(); using var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.PersonalizationOrders.AddRange(Enumerable.Range(1, 45).Select(i => new PersonalizationOrder {
                OrderReference = "TEST-" + i, CustomerName = "Test", Phone = "573001112233", CreatedAt = new DateTime(2026, 1, 1),
                Status = i <= 10 ? "Pendiente" : "Completado", Story = "PRIVATE_LONG_STORY",
                Attachments = i % 3 == 0 ? [new() { OriginalFileName = "photo.png" }] : [] }));
            await db.SaveChangesAsync();
        }
        var login = await client.PostAsJsonAsync("/api/admin/auth/login", new { username = "owner", password = "Test-only-bootstrap-password-2026" });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", (await login.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token);
        var first = await client.GetFromJsonAsync<PagedOrdersDto>("/api/admin/orders");
        var second = await client.GetFromJsonAsync<PagedOrdersDto>("/api/admin/orders?page=2");
        Assert.Equal(45, first!.Total); Assert.Equal(20, first.Items.Count); Assert.Equal(20, second!.Items.Count);
        Assert.Empty(first.Items.Select(o => o.Id).Intersect(second.Items.Select(o => o.Id)));
        Assert.True(first.Items[0].Id > second.Items[0].Id);
        Assert.Equal(1, first.Items[0].AttachmentCount);
        var json = await client.GetStringAsync("/api/admin/orders"); Assert.DoesNotContain("PRIVATE_LONG_STORY", json); Assert.DoesNotContain("attachments", json);
        var filtered = await client.GetFromJsonAsync<PagedOrdersDto>("/api/admin/orders?status=Pendiente&pageSize=5");
        Assert.Equal(10, filtered!.Total); Assert.Equal(5, filtered.Items.Count);
        foreach (var query in new[] { "page=0", "pageSize=101", "status=Unknown" })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/api/admin/orders?" + query)).StatusCode);
        var stats = await client.GetFromJsonAsync<AdminDashboardDto>("/api/admin/orders/dashboard");
        Assert.Equal(45, stats!.TotalOrders); Assert.Equal(10, stats.PendingOrders); Assert.Equal(5, stats.RecentOrders.Count);
    }
}
