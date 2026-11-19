using Leart.Api.Controllers;
using Leart.Api.Data;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class OrderDeletionTests
{
    private sealed class DenyDeletion(IFileStorageService inner) : IFileStorageService
    {
        public bool DeleteFile(string path) => false;
        public Stream? OpenOrderFile(string path) => inner.OpenOrderFile(path);
        public void MigrateLegacyOrderFiles() => inner.MigrateLegacyOrderFiles();
        public IEnumerable<string> OrderFilesOlderThan(DateTime cutoff) => inner.OrderFilesOlderThan(cutoff);
        public Task<(string relativePath, string storedFileName, long sizeBytes)> SaveFileAsync(IFormFile file, string folder) => inner.SaveFileAsync(file, folder);
    }

    [Fact]
    public async Task DeletionRemovesFilesAndMetadataAndIsRetryableOnDiskFailure()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        using var input = new MemoryStream(TestImages.Png());
        var (path, name, _) = await storage.SaveFileAsync(new FormFile(input, 0, input.Length, "photos", "photo.png"), "orders");
        var order = new PersonalizationOrder { CustomerName = "Test", Phone = "123", Attachments = [new OrderAttachment { FilePath = path, StoredFileName = name }] };
        db.PersonalizationOrders.Add(order); await db.SaveChangesAsync();
        var failed = await new AdminOrdersController(db, new DenyDeletion(storage)).Delete(order.Id);
        Assert.Equal(503, Assert.IsType<ObjectResult>(failed).StatusCode);
        Assert.True(await db.PersonalizationOrders.AnyAsync(o => o.Id == order.Id));
        using (var photo = storage.OpenOrderFile(path)) Assert.NotNull(photo);
        Assert.IsType<NoContentResult>(await new AdminOrdersController(db, storage).Delete(order.Id));
        Assert.Null(storage.OpenOrderFile(path));
        Assert.Empty(await db.OrderAttachments.ToListAsync());
        Assert.True(storage.DeleteFile(path));
    }

    [Fact]
    public async Task CleanupOnlyRemovesOldUnreferencedFiles()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var files = new List<string>();
        for (var i = 0; i < 3; i++)
        {
            using var input = new MemoryStream(TestImages.Png());
            var (path, name, _) = await storage.SaveFileAsync(new FormFile(input, 0, input.Length, "photos", "photo.png"), "orders");
            files.Add(path);
            if (i < 2) File.SetLastWriteTimeUtc(Path.Combine(factory.StorageRoot, "orders", name), DateTime.UtcNow.AddDays(-2));
        }
        db.PersonalizationOrders.Add(new PersonalizationOrder { CustomerName = "Test", Phone = "123", Attachments = [new OrderAttachment { FilePath = files[0] }] });
        await db.SaveChangesAsync();
        await factory.Services.GetRequiredService<OrderFileCleanup>().CleanupAsync(CancellationToken.None);
        using var referenced = storage.OpenOrderFile(files[0]);
        using var recent = storage.OpenOrderFile(files[2]);
        Assert.NotNull(referenced); Assert.NotNull(recent);
        Assert.Null(storage.OpenOrderFile(files[1]));
    }
}
