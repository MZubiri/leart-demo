using Leart.Api.Data;
using Leart.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Leart.Api.Tests;

public class CatalogInitializationTests
{
    [Fact]
    public async Task RestartPreservesEditsDeletionsAndAnIntentionallyEmptyCatalog()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        await DbInitializer.SeedAsync(db, NullLogger.Instance);
        Assert.Equal(75, await db.Products.CountAsync());
        var product = await db.Products.FirstAsync();
        product.Name = "Nombre administrado"; product.BasePrice = 999999; product.IsActive = false;
        var removed = await db.Products.FirstAsync(p => p.Id != product.Id);
        db.Products.Remove(removed); await db.SaveChangesAsync();
        await DbInitializer.SeedAsync(db, NullLogger.Instance);
        Assert.Equal("Nombre administrado", (await db.Products.FindAsync(product.Id))!.Name);
        Assert.Equal(999999, (await db.Products.FindAsync(product.Id))!.BasePrice);
        Assert.False((await db.Products.FindAsync(product.Id))!.IsActive);
        Assert.Null(await db.Products.FindAsync(removed.Id));
        db.Products.RemoveRange(db.Products); await db.SaveChangesAsync();
        await DbInitializer.SeedAsync(db, NullLogger.Instance);
        Assert.Empty(db.Products);
    }

    [Fact]
    public async Task ExistingProductsWithoutSettingsArePreserved()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        db.Products.Add(new Product { Id = "custom", Name = "Producto propio" }); await db.SaveChangesAsync();
        await DbInitializer.SeedAsync(db, NullLogger.Instance);
        Assert.Single(db.Products);
        Assert.Single(db.SiteSettings);
    }
}
