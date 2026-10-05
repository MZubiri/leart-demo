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

    public async Task<(string relativePath, string storedFileName, long sizeBytes)> SaveFileAsync(IFormFile file, string subFolder)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo es inválido o está vacío.", nameof(file));

        var uploadsRoot = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", subFolder);
        if (!Directory.Exists(uploadsRoot))
        {
            Directory.CreateDirectory(uploadsRoot);
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf" };
        if (!allowedExtensions.Contains(ext))
        {
            ext = ".png";
        }

        var storedFileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsRoot, storedFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/{subFolder}/{storedFileName}";
        return (relativePath, storedFileName, file.Length);
    }

    public bool DeleteFile(string relativePath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativePath) || !relativePath.StartsWith("/uploads/"))
                return false;

            var trimmed = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), trimmed);

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
