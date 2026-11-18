using Leart.Api.Data;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Leart.Api.Tests;

public class AdminBootstrapTests
{
    private static AppDbContext Database() => new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static IConfiguration Configuration(string? password = null) => new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["BootstrapAdmin:Username"] = "owner", ["BootstrapAdmin:Email"] = "owner@example.test", ["BootstrapAdmin:Password"] = password
    }).Build();

    [Fact]
    public async Task EmptyDatabaseRequiresExplicitCredentials()
    {
        using var db = Database();
        await Assert.ThrowsAsync<BootstrapConfigurationException>(() => AdminBootstrap.InitializeAsync(db, Configuration()));
        Assert.Empty(db.AdminUsers);
    }

    [Fact]
    public async Task BootstrapCreatesAccountOnceAndExplicitResetIsSeparate()
    {
        using var db = Database();
        await AdminBootstrap.InitializeAsync(db, Configuration("Initial-test-password-2026"));
        var user = await db.AdminUsers.SingleAsync();
        Assert.True(BCrypt.Net.BCrypt.Verify("Initial-test-password-2026", user.PasswordHash));
        await AdminBootstrap.InitializeAsync(db, Configuration("Ignored-test-password-2026"));
        Assert.True(BCrypt.Net.BCrypt.Verify("Initial-test-password-2026", user.PasswordHash));
        await AdminBootstrap.InitializeAsync(db, Configuration("Replacement-test-password-2026"), resetExisting: true);
        Assert.True(BCrypt.Net.BCrypt.Verify("Replacement-test-password-2026", user.PasswordHash));
    }

    [Fact]
    public async Task PublishedPasswordCannotBootstrap()
    {
        using var db = Database();
        await Assert.ThrowsAsync<BootstrapConfigurationException>(() => AdminBootstrap.InitializeAsync(db, Configuration("Leart2026!")));
    }
}
