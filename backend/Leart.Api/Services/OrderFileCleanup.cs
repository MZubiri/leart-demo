using Leart.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Services;

public sealed class OrderFileCleanup(IServiceScopeFactory scopes, ILogger<OrderFileCleanup> logger) : BackgroundService
{
    public async Task CleanupAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var references = (await db.OrderAttachments.AsNoTracking().Select(a => a.FilePath).ToListAsync(cancellationToken))
            .Select(Path.GetFileName).ToHashSet(StringComparer.Ordinal);
        foreach (var path in storage.OrderFilesOlderThan(DateTime.UtcNow.AddDays(-1)))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!references.Contains(Path.GetFileName(path)) && !storage.DeleteFile(path))
                logger.LogWarning("No se pudo eliminar un archivo huérfano; se reintentará en la siguiente revisión.");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(12));
        do
        {
            try { await CleanupAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "La limpieza de adjuntos se pospone; no se borraron archivos sin comprobar referencias."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
