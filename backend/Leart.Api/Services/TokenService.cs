using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Leart.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace Leart.Api.Services;

public interface ITokenService
{
    (string token, DateTime expiresAt) GenerateToken(AdminUser user);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public (string token, DateTime expiresAt) GenerateToken(AdminUser user)
    {
        var secret = _config["Jwt:Secret"] ?? "LeartSecretKeyMustBeLongEnoughForHmacSha256Security12345!";
        var issuer = _config["Jwt:Issuer"] ?? "LeartApi";
        var audience = _config["Jwt:Audience"] ?? "LeartApp";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddHours(24);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return (tokenHandler.WriteToken(token), expiresAt);
    }
}
