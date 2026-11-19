using Microsoft.AspNetCore.RateLimiting;
using System.Text.Json;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<PublicController> _logger;

    public PublicController(AppDbContext context, IFileStorageService fileStorage, ILogger<PublicController> logger)
    {
        _context = context;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<PublicSettingsDto>> GetSettings()
    {
        SiteSetting settings;
        try
        {
            settings = await _context.SiteSettings.FirstOrDefaultAsync() ?? new SiteSetting();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch settings from MySQL, using defaults.");
            settings = new SiteSetting();
        }

        return Ok(new PublicSettingsDto(
            settings.StoreName,
            settings.WhatsAppNumber,
            settings.AnnouncementText,
            settings.InstagramUrl,
            settings.WhatsAppQuoteTemplate,
            settings.WhatsAppPersonalizationTemplate
        ));
    }

    [HttpGet("products")]
    public async Task<ActionResult<List<ProductDto>>> GetProducts([FromQuery] string? category = null, [FromQuery] string? occasion = null)
    {
        List<Product> products;
        try
        {
            var query = _context.Products.Where(p => p.IsActive);
            if (!string.IsNullOrWhiteSpace(category) && category != "Todos")
            {
                query = query.Where(p => p.Category == category);
            }
            products = await query.OrderBy(p => p.DisplayOrder).ThenBy(p => p.Name).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not fetch products from MySQL, using initial seed fallback.");
            var fallback = DbInitializer.GetInitialProducts();
            if (!string.IsNullOrWhiteSpace(category) && category != "Todos")
            {
                fallback = fallback.Where(p => p.Category == category).ToList();
            }
            products = fallback;
        }

        var result = products.Select(MapToDto).ToList();

        if (!string.IsNullOrWhiteSpace(occasion) && occasion != "Todas")
        {
            result = result.Where(p => p.Occasion.Contains(occasion, StringComparer.OrdinalIgnoreCase)).ToList();
        }

        return Ok(result);
    }

    [HttpGet("products/{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(string id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
        if (product == null)
            return NotFound(new { message = $"Producto con id '{id}' no encontrado." });

        return Ok(MapToDto(product));
    }

    [HttpPost("personalization")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 25 * 1024 * 1024)]
    [EnableRateLimiting("personalization")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<OrderResponseDto>> SubmitPersonalization(
        [FromForm] PersonalizationCreateDto dto,
        [FromForm] List<IFormFile>? photos)
    {
        if (string.IsNullOrWhiteSpace(dto.CustomerName) || string.IsNullOrWhiteSpace(dto.Phone))
        {
            return BadRequest(new { message = "El nombre y el teléfono son obligatorios." });
        }

        var reference = string.IsNullOrWhiteSpace(dto.OrderReference)
            ? $"PED-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : dto.OrderReference.Trim();

        var order = new PersonalizationOrder
        {
            OrderReference = reference,
            CustomerName = dto.CustomerName.Trim(),
            Phone = dto.Phone.Trim(),
            ProductTitle = dto.ProductTitle?.Trim() ?? string.Empty,
            PeopleDetails = dto.PeopleDetails?.Trim() ?? string.Empty,
            Story = dto.Story?.Trim() ?? string.Empty,
            Phrase = dto.Phrase?.Trim() ?? string.Empty,
            Requirements = dto.Requirements?.Trim() ?? string.Empty,
            Status = "Pendiente",
            CreatedAt = DateTime.UtcNow
        };

        photos ??= [];
        if (photos.Count > 6 || photos.Sum(p => p.Length) > 20 * 1024 * 1024)
            return BadRequest(new { message = "Se admiten hasta 6 fotos y 20 MB por envío." });
        if (photos.Any(p => p.Length is <= 0 or > ImageUpload.MaxFileBytes || p.FileName.Length > 250))
            return BadRequest(new { message = "Cada foto debe pesar entre 1 byte y 5 MB y su nombre no superar 250 caracteres." });

        var savedPaths = new List<string>();
        void Compensate()
        {
            foreach (var path in savedPaths)
                if (!_fileStorage.DeleteFile(path)) _logger.LogError("No se pudo limpiar un adjunto de una recepción fallida.");
        }
        try
        {
            foreach (var file in photos)
            {
                var (relativePath, storedName, sizeBytes) = await _fileStorage.SaveFileAsync(file, "orders");
                savedPaths.Add(relativePath);
                order.Attachments.Add(new OrderAttachment
                {
                    OriginalFileName = Path.GetFileName(file.FileName),
                    StoredFileName = storedName,
                    FilePath = relativePath,
                    ContentType = "image/png",
                    FileSizeBytes = sizeBytes,
                    UploadedAt = DateTime.UtcNow
                });
            }
            _context.PersonalizationOrders.Add(order);
            await _context.SaveChangesAsync();
        }
        catch (UploadValidationException ex)
        {
            Compensate();
            return BadRequest(new { message = ex.Message });
        }
        catch (StorageQuotaExceededException ex)
        {
            Compensate();
            return StatusCode(StatusCodes.Status507InsufficientStorage, new { message = ex.Message });
        }
        catch
        {
            Compensate();
            throw;
        }

        return Ok(new OrderResponseDto
        {
            Id = order.Id,
            OrderReference = order.OrderReference,
            CustomerName = order.CustomerName,
            Phone = order.Phone,
            ProductTitle = order.ProductTitle,
            PeopleDetails = order.PeopleDetails,
            Story = order.Story,
            Phrase = order.Phrase,
            Requirements = order.Requirements,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            Attachments = order.Attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                OriginalFileName = a.OriginalFileName,
                Url = string.Empty,
                ContentType = a.ContentType,
                FileSizeBytes = a.FileSizeBytes,
                UploadedAt = a.UploadedAt
            }).ToList()
        });
    }

    private static ProductDto MapToDto(Product p)
    {
        List<string> occasions;
        try { occasions = JsonSerializer.Deserialize<List<string>>(p.OccasionJson) ?? new(); }
        catch { occasions = new(); }

        List<string> variants;
        try { variants = JsonSerializer.Deserialize<List<string>>(p.VariantsJson) ?? new(); }
        catch { variants = new(); }

        return new ProductDto
        {
            Id = p.Id,
            Name = p.Name,
            Kicker = p.Kicker,
            Category = p.Category,
            Detail = p.Detail,
            Image = p.Image,
            Tag = p.Tag,
            Group = p.Group,
            Occasion = occasions,
            Description = p.Description,
            MinFigures = p.MinFigures,
            MaxFigures = p.MaxFigures,
            Variants = variants,
            AllowsPets = p.AllowsPets,
            AllowsAccessories = p.AllowsAccessories,
            Rule = p.Rule,
            IsActive = p.IsActive,
            DisplayOrder = p.DisplayOrder,
            BasePrice = p.BasePrice,
            Code = p.Code
        };
    }
}
