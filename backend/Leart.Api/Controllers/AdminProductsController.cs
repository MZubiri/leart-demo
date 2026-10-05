using System.Text.Json;
using System.Text.RegularExpressions;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Models;
using Leart.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize]
public class AdminProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public AdminProductsController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll()
    {
        var products = await _context.Products
            .OrderBy(p => p.DisplayOrder)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(products.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Producto no encontrado." });

        return Ok(MapToDto(product));
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] ProductCreateOrUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "El nombre del producto es obligatorio." });

        var slug = string.IsNullOrWhiteSpace(dto.Id)
            ? GenerateSlug(dto.Name)
            : GenerateSlug(dto.Id);

        if (await _context.Products.AnyAsync(p => p.Id == slug))
        {
            slug = $"{slug}-{Random.Shared.Next(100, 999)}";
        }

        var product = new Product
        {
            Id = slug,
            Name = dto.Name.Trim(),
            Kicker = dto.Kicker?.Trim() ?? string.Empty,
            Category = dto.Category,
            Detail = dto.Detail?.Trim() ?? string.Empty,
            Image = dto.Image?.Trim() ?? string.Empty,
            Tag = dto.Tag?.Trim(),
            Group = dto.Group?.Trim(),
            OccasionJson = JsonSerializer.Serialize(dto.Occasion ?? new List<string>()),
            Description = dto.Description?.Trim() ?? string.Empty,
            MinFigures = Math.Max(1, dto.MinFigures),
            MaxFigures = Math.Max(dto.MinFigures, dto.MaxFigures),
            VariantsJson = JsonSerializer.Serialize(dto.Variants ?? new List<string>()),
            AllowsPets = dto.AllowsPets,
            AllowsAccessories = dto.AllowsAccessories,
            Rule = dto.Rule?.Trim() ?? string.Empty,
            IsActive = dto.IsActive,
            DisplayOrder = dto.DisplayOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapToDto(product));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> Update(string id, [FromBody] ProductCreateOrUpdateDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Producto no encontrado." });

        product.Name = dto.Name.Trim();
        product.Kicker = dto.Kicker?.Trim() ?? string.Empty;
        product.Category = dto.Category;
        product.Detail = dto.Detail?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(dto.Image))
            product.Image = dto.Image.Trim();
        product.Tag = dto.Tag?.Trim();
        product.Group = dto.Group?.Trim();
        product.OccasionJson = JsonSerializer.Serialize(dto.Occasion ?? new List<string>());
        product.Description = dto.Description?.Trim() ?? string.Empty;
        product.MinFigures = Math.Max(1, dto.MinFigures);
        product.MaxFigures = Math.Max(dto.MinFigures, dto.MaxFigures);
        product.VariantsJson = JsonSerializer.Serialize(dto.Variants ?? new List<string>());
        product.AllowsPets = dto.AllowsPets;
        product.AllowsAccessories = dto.AllowsAccessories;
        product.Rule = dto.Rule?.Trim() ?? string.Empty;
        product.IsActive = dto.IsActive;
        product.DisplayOrder = dto.DisplayOrder;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(MapToDto(product));
    }

    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult> ToggleActive(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Producto no encontrado." });

        product.IsActive = !product.IsActive;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { id = product.Id, isActive = product.IsActive });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Producto no encontrado." });

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Archivo no enviado o vacío." });

        var (relativePath, _, _) = await _fileStorage.SaveFileAsync(file, "products");
        return Ok(new { url = relativePath });
    }

    private static string GenerateSlug(string text)
    {
        var normalized = text.ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        var chars = normalized.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark).ToArray();
        var clean = new string(chars);
        clean = Regex.Replace(clean, @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(clean) ? "producto" : clean;
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
            DisplayOrder = p.DisplayOrder
        };
    }
}
