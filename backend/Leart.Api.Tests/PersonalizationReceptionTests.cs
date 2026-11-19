using System.Net;
using Leart.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Leart.Api.Tests;

public class PersonalizationReceptionTests
{
    private sealed class FailureSwitch { public bool Fail { get; set; } }
    private sealed class ControlledDatabase(DbContextOptions<AppDbContext> options, FailureSwitch gate) : AppDbContext(options)
    {
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            gate.Fail ? Task.FromException<int>(new IOException("Test persistence failure")) : base.SaveChangesAsync(cancellationToken);
    }

    private static MultipartFormDataContent Form(params byte[][] photos)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Cliente de prueba"), "customerName" },
            { new StringContent("573001112233"), "phone" },
            { new StringContent("TEST-REFERENCE"), "orderReference" },
            { new StringContent("Cuadros"), "productTitle" }
        };
        for (var i = 0; i < photos.Length; i++) form.Add(new ByteArrayContent(photos[i]), "photos", $"reference-{i}.png");
        return form;
    }

    private static async Task AssertNoOrderOrFiles(ApiFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<AppDbContext>().PersonalizationOrders.ToListAsync());
        if (Directory.Exists(factory.StorageRoot)) Assert.Empty(Directory.EnumerateFiles(factory.StorageRoot, "*", SearchOption.AllDirectories));
    }

    [Fact]
    public async Task InvalidPhotoRejectsTheBatchAndRemovesEarlierFiles()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var form = Form(TestImages.Png(), "not-a-photo"u8.ToArray());
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/public/personalization", form)).StatusCode);
        await AssertNoOrderOrFiles(factory);
    }

    [Fact]
    public async Task DatabaseFailureRemovesReceivedFiles()
    {
        var gate = new FailureSwitch();
        using var factory = new ApiFactory
        {
            OverrideServices = services => services.AddScoped<AppDbContext>(provider => new ControlledDatabase(provider.GetRequiredService<DbContextOptions<AppDbContext>>(), gate))
        };
        using var client = factory.CreateClient();
        gate.Fail = true;
        using var form = Form(TestImages.Png());
        Assert.Equal(HttpStatusCode.InternalServerError, (await client.PostAsync("/api/public/personalization", form)).StatusCode);
        await AssertNoOrderOrFiles(factory);
    }

    [Fact]
    public async Task MoreThanSixPhotosIsRejectedInsteadOfSilentlyTruncated()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        using var form = Form(Enumerable.Range(0, 7).Select(_ => TestImages.Png()).ToArray());
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/public/personalization", form)).StatusCode);
        await AssertNoOrderOrFiles(factory);
    }
}
