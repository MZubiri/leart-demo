using System.Security.Cryptography;
using Leart.Api.Services;
using Microsoft.Extensions.Configuration;

namespace Leart.Api.Tests;

public class SecurityConfigurationTests
{
    private static IConfiguration Config(params (string key, string value)[] values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values.Select(v => new KeyValuePair<string, string?>(v.key, v.value))).Build();

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("LeartSecureSuperSecretKey2026WithSufficientLengthForHmacSha256!")]
    [InlineData("LeartSecretKeyMustBeLongEnoughForHmacSha256Security12345!")]
    public void MissingShortOrPublishedKeyIsRejected(string key) =>
        Assert.Throws<InvalidOperationException>(() => SecurityConfiguration.GetJwtSecret(Config(("Jwt:Secret", key))));

    [Fact]
    public void NewKeyIsAccepted()
    {
        var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        Assert.Equal(key, SecurityConfiguration.GetJwtSecret(Config(("Jwt:Secret", key))));
    }

    [Theory]
    [InlineData("")]
    [InlineData("Server=localhost;User=root;Password=anything;")]
    [InlineData("Server=localhost;User=leart;Password=;")]
    [InlineData("Server=localhost;User=leart;Password=root;")]
    public void UnsafeDatabaseConfigurationIsRejected(string connection) =>
        Assert.Throws<InvalidOperationException>(() => SecurityConfiguration.GetConnectionString(Config(("ConnectionStrings:DefaultConnection", connection))));

    [Fact]
    public void ApplicationConnectionIsAccepted()
    {
        var connection = "Server=localhost;Database=leart_db;User=leart;Password=" + Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
        Assert.Equal(connection, SecurityConfiguration.GetConnectionString(Config(("ConnectionStrings:DefaultConnection", connection))));
    }
}
