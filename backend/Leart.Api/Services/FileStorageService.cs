namespace Leart.Api.Services;

public interface IFileStorageService
{
    Task<(string relativePath, string storedFileName, long sizeBytes)> SaveFileAsync(IFormFile file, string subFolder);
    bool DeleteFile(string relativePath);
}

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public FileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    private const long MaxFileSizeBytes = 20 * 1024 * 1024; // 20 MB max
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"
    };

    public async Task<(string relativePath, string storedFileName, long sizeBytes)> SaveFileAsync(IFormFile file, string subFolder)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo es inválido o está vacío.", nameof(file));

        if (file.Length > MaxFileSizeBytes)
            throw new ArgumentException($"El archivo supera el tamaño máximo permitido de {MaxFileSizeBytes / (1024 * 1024)} MB.", nameof(file));

        // Sanitize subFolder name (only alphanumeric and hyphens)
        var sanitizedSubFolder = System.Text.RegularExpressions.Regex.Replace(subFolder ?? "general", @"[^a-zA-Z0-9_-]", "");
        if (string.IsNullOrWhiteSpace(sanitizedSubFolder))
            sanitizedSubFolder = "general";

        var uploadsRoot = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", sanitizedSubFolder);
        if (!Directory.Exists(uploadsRoot))
        {
            Directory.CreateDirectory(uploadsRoot);
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
        {
            throw new ArgumentException($"Tipo de archivo '{ext}' no permitido. Extensiones válidas: {string.Join(", ", AllowedExtensions)}");
        }

        var storedFileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsRoot, storedFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/{sanitizedSubFolder}/{storedFileName}";
        return (relativePath, storedFileName, file.Length);
    }

    public bool DeleteFile(string relativePath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativePath) || !relativePath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
                return false;

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsBase = Path.GetFullPath(Path.Combine(webRoot, "uploads"));

            var trimmed = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(webRoot, trimmed));

            // Prevent Path Traversal attacks (must remain inside uploadsBase)
            if (!fullPath.StartsWith(uploadsBase, StringComparison.OrdinalIgnoreCase))
                return false;

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }
        }
        catch
        {
            // Ignore error on deletion
        }
        return false;
    }
}
