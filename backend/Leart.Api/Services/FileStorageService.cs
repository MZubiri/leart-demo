namespace Leart.Api.Services;

public interface IFileStorageService
{
    Task<(string relativePath, string storedFileName, long sizeBytes)> SaveFileAsync(IFormFile file, string subFolder);
    bool DeleteFile(string relativePath);
    Stream? OpenOrderFile(string relativePath);
    void MigrateLegacyOrderFiles();
}

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly string _privateRoot;
    private readonly long _maxOrderBytes;
    private static readonly SemaphoreSlim OrderWrites = new(1, 1);

    public FileStorageService(IWebHostEnvironment env, IConfiguration? configuration = null)
    {
        _env = env;
        _privateRoot = configuration?["Storage:Root"] ?? Path.Combine(env.ContentRootPath, "storage");
        _maxOrderBytes = configuration?.GetValue<long?>("Storage:MaxOrderBytes") ?? 1024L * 1024 * 1024;
        if (_maxOrderBytes < 1) throw new InvalidOperationException("Storage:MaxOrderBytes debe ser positivo.");
    }

    public async Task<(string relativePath, string storedFileName, long sizeBytes)> SaveFileAsync(IFormFile file, string subFolder)
    {
        var bytes = await ImageUpload.NormalizeAsync(file);

        // Sanitize subFolder name (only alphanumeric and hyphens)
        var sanitizedSubFolder = System.Text.RegularExpressions.Regex.Replace(subFolder ?? "general", @"[^a-zA-Z0-9_-]", "");
        if (string.IsNullOrWhiteSpace(sanitizedSubFolder))
            sanitizedSubFolder = "general";

        var uploadsRoot = sanitizedSubFolder == "orders"
            ? Path.Combine(_privateRoot, "orders")
            : Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", sanitizedSubFolder);
        if (!Directory.Exists(uploadsRoot))
        {
            Directory.CreateDirectory(uploadsRoot);
        }

        const string ext = ".png";
        var storedFileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsRoot, storedFileName);

        var isOrder = sanitizedSubFolder == "orders";
        if (isOrder) await OrderWrites.WaitAsync();
        try
        {
            if (isOrder && Directory.EnumerateFiles(uploadsRoot).Sum(path => new FileInfo(path).Length) > _maxOrderBytes - bytes.Length)
                throw new StorageQuotaExceededException();
            await using var stream = new FileStream(fullPath, FileMode.CreateNew);
            await stream.WriteAsync(bytes);
        }
        catch
        {
            if (File.Exists(fullPath)) File.Delete(fullPath);
            throw;
        }
        finally { if (isOrder) OrderWrites.Release(); }

        var relativePath = sanitizedSubFolder == "orders"
            ? $"/private/orders/{storedFileName}"
            : $"/uploads/{sanitizedSubFolder}/{storedFileName}";
        return (relativePath, storedFileName, bytes.Length);
    }

    public bool DeleteFile(string relativePath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return false;

            if (OrderFileName(relativePath) is { } orderName)
            {
                var orderPath = Path.Combine(_privateRoot, "orders", orderName);
                if (!File.Exists(orderPath)) return false;
                File.Delete(orderPath);
                return true;
            }
            if (!relativePath.StartsWith("/uploads/products/", StringComparison.Ordinal)) return false;

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsBase = Path.GetFullPath(Path.Combine(webRoot, "uploads"));

            var trimmed = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(webRoot, trimmed));

            // Prevent Path Traversal attacks (must remain inside uploadsBase)
            if (!fullPath.StartsWith(uploadsBase + Path.DirectorySeparatorChar, StringComparison.Ordinal))
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

    public Stream? OpenOrderFile(string relativePath)
    {
        var name = OrderFileName(relativePath);
        if (name == null) return null;
        var fullPath = Path.Combine(_privateRoot, "orders", name);
        return File.Exists(fullPath) ? new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read) : null;
    }

    private static string? OrderFileName(string path)
    {
        var prefix = path.StartsWith("/private/orders/", StringComparison.Ordinal) ? "/private/orders/" : "/uploads/orders/";
        if (!path.StartsWith(prefix, StringComparison.Ordinal)) return null;
        var name = path[prefix.Length..];
        return name.Length > 0 && !name.Contains('/') && !name.Contains('\\') && name is not "." and not ".." ? name : null;
    }

    public void MigrateLegacyOrderFiles()
    {
        var legacy = Path.Combine(_env.WebRootPath, "uploads", "orders");
        if (!Directory.Exists(legacy)) return;
        var target = Path.Combine(_privateRoot, "orders");
        Directory.CreateDirectory(target);
        foreach (var file in Directory.EnumerateFiles(legacy))
        {
            var destination = Path.Combine(target, Path.GetFileName(file));
            if (File.Exists(destination))
            {
                using var source = File.OpenRead(file);
                using var existing = File.OpenRead(destination);
                if (!System.Security.Cryptography.SHA256.HashData(source).SequenceEqual(System.Security.Cryptography.SHA256.HashData(existing)))
                    throw new IOException("Conflicto al migrar un adjunto privado; se requiere revisión del almacenamiento.");
                source.Dispose();
                File.Delete(file);
            }
            else File.Move(file, destination);
        }
    }
}
