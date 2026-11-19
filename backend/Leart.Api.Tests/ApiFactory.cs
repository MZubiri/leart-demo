using Leart.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Leart.Api.Tests;

public class ApiFactory : WebApplicationFactory<Program>
{
    public Action<IServiceCollection>? OverrideServices { get; set; }
    public string StorageRoot { get; } = Path.Combine(Path.GetTempPath(), "leart-api-" + Guid.NewGuid().ToString("N"));
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:Secret", "Test-only-signing-key-with-at-least-32-bytes-2026");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Server=localhost;Database=tests;User=tests;Password=test-only-password;");
        builder.UseSetting("BootstrapAdmin:Username", "owner");
        builder.UseSetting("BootstrapAdmin:Email", "owner@example.test");
        builder.UseSetting("BootstrapAdmin:Password", "Test-only-bootstrap-password-2026");
        builder.UseSetting("Storage:Root", StorageRoot);
        var databaseName = Guid.NewGuid().ToString();
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(databaseName));
            OverrideServices?.Invoke(services);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (Directory.Exists(StorageRoot)) Directory.Delete(StorageRoot, true);
    }
}
