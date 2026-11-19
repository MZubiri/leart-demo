using System.Security.Cryptography;
using System.Text;
using MySql.Data.MySqlClient;

namespace Leart.Api.Services;

public static class SecurityConfiguration
{
    public static string GetJwtSecret(IConfiguration configuration)
    {
        var secret = configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || Encoding.UTF8.GetByteCount(secret) < 32 || IsPublishedSecret(secret))
            throw new InvalidOperationException("Configure Jwt:Secret con una clave aleatoria nueva de al menos 32 bytes.");
        return secret;
    }

    public static string GetConnectionString(IConfiguration configuration)
    {
        var connection = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connection))
            throw new InvalidOperationException("Configure ConnectionStrings:DefaultConnection con un usuario exclusivo de la aplicación.");
        var options = new MySqlConnectionStringBuilder(connection);
        if (string.IsNullOrWhiteSpace(options.UserID) || options.UserID.Equals("root", StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(options.Password) || options.Password is "root" or "mysql")
            throw new InvalidOperationException("La conexión requiere un usuario limitado y una contraseña propia; no se permite root.");
        return connection;
    }

    public static bool IsPublishedPassword(string password) => Hash(password) == "687BAC8F78604FF27EA7A7717258E2C9C15678043B894C0C9D012B86A866EDE2";

    private static bool IsPublishedSecret(string secret) => Hash(secret) is "9065C634E32C4F7AC439968511C469BE10D10E626998A63C0C556E0ACD668417" or "9F984B7111526BEEC2C9A08BD1F7D81B6232FBC2CD1FA092B00B1A57EE401043";
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
