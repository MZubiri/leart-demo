using Leart.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Xunit;
using Microsoft.Extensions.Configuration;

namespace Leart.Api.Tests;

public class TestWebHostEnvironment : IWebHostEnvironment
{
    public string WebRootPath { get; set; } = string.Empty;
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string EnvironmentName { get; set; } = "Testing";
    public string ApplicationName { get; set; } = "Leart.Api.Tests";
    public string ContentRootPath { get; set; } = string.Empty;
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
}

public class FileStorageServiceTests : IDisposable
{
    private readonly string _tempDir;
    private readonly FileStorageService _storageService;

    public FileStorageServiceTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"leart_test_{Guid.NewGuid():N}");
        var webRoot = Path.Combine(_tempDir, "wwwroot");
        var uploads = Path.Combine(webRoot, "uploads", "test");
        Directory.CreateDirectory(uploads);

        var env = new TestWebHostEnvironment
        {
            WebRootPath = webRoot,
            ContentRootPath = _tempDir
        };

        _storageService = new FileStorageService(env);
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, true);
            }
        }
        catch { }
    }

    [Fact]
    public void DeleteFile_BlocksPathTraversalAttempts()
    {
        // Act: Try to traverse outside uploads
        var result1 = _storageService.DeleteFile("/uploads/../../appsettings.json");
        var result2 = _storageService.DeleteFile("/etc/passwd");
        var result3 = _storageService.DeleteFile("C:\\Windows\\system32\\calc.exe");

        // Assert
        Assert.False(result1);
        Assert.False(result2);
        Assert.False(result3);
    }

    [Fact]
    public async Task SaveFileAsync_RejectsDisallowedExtensions()
    {
        // Arrange
        var content = "echo malicious"u8.ToArray();
        var stream = new MemoryStream(content);
        var formFile = new FormFile(stream, 0, content.Length, "file", "script.sh");

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _storageService.SaveFileAsync(formFile, "orders"));
    }

    [Fact]
    public async Task SaveFileAsync_AcceptsValidImage()
    {
        // Arrange
        var content = new byte[] { 0x89, 0x50, 0x4E, 0x47 }; // PNG magic
        var stream = new MemoryStream(content);
        var formFile = new FormFile(stream, 0, content.Length, "file", "photo.png");

        // Act
        var (relativePath, storedName, sizeBytes) = await _storageService.SaveFileAsync(formFile, "orders");

        // Assert
        Assert.StartsWith("/private/orders/", relativePath);
        Assert.False(File.Exists(Path.Combine(_tempDir, "wwwroot", relativePath.TrimStart('/'))));
        using (var stored = _storageService.OpenOrderFile(relativePath)) Assert.NotNull(stored);
        Assert.EndsWith(".png", storedName);
        Assert.Equal(content.Length, sizeBytes);

        // Delete test
        var deleted = _storageService.DeleteFile(relativePath);
        Assert.True(deleted);
    }
    [Fact]
    public void LegacyOrdersAreMovedOutOfThePublicRoot()
    {
        var folder = Path.Combine(_tempDir, "wwwroot", "uploads", "orders");
        Directory.CreateDirectory(folder);
        File.WriteAllText(Path.Combine(folder, "legacy.png"), "legacy-data");
        _storageService.MigrateLegacyOrderFiles();
        Assert.False(File.Exists(Path.Combine(folder, "legacy.png")));
        using var stored = _storageService.OpenOrderFile("/uploads/orders/legacy.png");
        Assert.NotNull(stored);
        Assert.Null(_storageService.OpenOrderFile("/private/orders/../secret"));
    }
    [Fact]
    public async Task QuotaRejectsWriteBeforeCreatingAFile()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Storage:MaxOrderBytes"] = "3" }).Build();
        var service = new FileStorageService(new TestWebHostEnvironment { ContentRootPath = _tempDir, WebRootPath = Path.Combine(_tempDir, "wwwroot") }, configuration);
        using var content = new MemoryStream(new byte[4]);
        await Assert.ThrowsAsync<StorageQuotaExceededException>(() => service.SaveFileAsync(new FormFile(content, 0, 4, "photos", "photo.png"), "orders"));
        Assert.Empty(Directory.GetFiles(Path.Combine(_tempDir, "storage", "orders")));
    }
}
