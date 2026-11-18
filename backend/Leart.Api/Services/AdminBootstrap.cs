using System.Net.Mail;
using Leart.Api.Data;
using Leart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Services;

public sealed class BootstrapConfigurationException(string message) : Exception(message);

public static class AdminBootstrap
{
    public static async Task InitializeAsync(AppDbContext context, IConfiguration configuration, bool resetExisting = false)
    {
        if (!resetExisting && await context.AdminUsers.AnyAsync()) return;
        var username = configuration["BootstrapAdmin:Username"]?.Trim();
        var email = configuration["BootstrapAdmin:Email"]?.Trim();
        var password = configuration["BootstrapAdmin:Password"];
        if (string.IsNullOrWhiteSpace(username) || username.Length > 50 || !MailAddress.TryCreate(email, out _)
            || email!.Length > 100 || string.IsNullOrWhiteSpace(password) || password.Length < 12
            || EncodingSize(password) > 72 || SecurityConfiguration.IsPublishedPassword(password))
            throw new BootstrapConfigurationException("Para el alta o restablecimiento configure BootstrapAdmin:Username, Email y Password (12 a 72 bytes). Retire estas variables después de usarlas.");

        var user = await context.AdminUsers.SingleOrDefaultAsync(u => u.Username == username);
        if (resetExisting && user == null)
            throw new BootstrapConfigurationException("No existe el administrador indicado para restablecer.");
        if (user == null)
        {
            user = new AdminUser { Username = username, Email = email, Role = "Admin" };
            context.AdminUsers.Add(user);
        }
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        await context.SaveChangesAsync();
    }

    private static int EncodingSize(string value) => System.Text.Encoding.UTF8.GetByteCount(value);
}
