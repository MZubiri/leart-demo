using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Leart.Api.Tests;

public class TokenServiceTests
{
    [Fact]
    public void GenerateToken_ReturnsValidJwt_WithExpectedClaims()
    {
        // Arrange
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Secret", "TestSecretKeyForHmacSha256MustBeLongEnough12345678!" },
            { "Jwt:Issuer", "TestIssuer" },
            { "Jwt:Audience", "TestAudience" }
        };
        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var tokenService = new TokenService(config);
        var user = new AdminUser
        {
            Id = 1,
            Username = "admin",
            Email = "admin@leart.store",
            Role = "Admin"
        };

        // Act
        var (token, expiresAt) = tokenService.GenerateToken(user);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(token));
        Assert.True(expiresAt > DateTime.UtcNow);

        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(token));

        var jwtToken = handler.ReadJwtToken(token);
        Assert.Equal("TestIssuer", jwtToken.Issuer);
        Assert.Contains(jwtToken.Audiences, a => a == "TestAudience");

        var claims = jwtToken.Claims.ToList();
        Assert.Contains(claims, c => (c.Type == "unique_name" || c.Type == JwtRegisteredClaimNames.UniqueName) && c.Value == "admin");
        Assert.Contains(claims, c => (c.Type == "email" || c.Type == JwtRegisteredClaimNames.Email) && c.Value == "admin@leart.store");
        Assert.Contains(claims, c => (c.Type == "role" || c.Type == ClaimTypes.Role) && c.Value == "Admin");
    }
}
