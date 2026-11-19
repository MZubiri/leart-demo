using System.ComponentModel.DataAnnotations;

namespace Leart.Api.DTOs;

public class ProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Kicker { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string? Tag { get; set; }
    public string? Group { get; set; }
    public List<string> Occasion { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public int MinFigures { get; set; }
    public int MaxFigures { get; set; }
    public List<string> Variants { get; set; } = new();
    public bool AllowsPets { get; set; }
    public bool AllowsAccessories { get; set; }
    public string Rule { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public int? BasePrice { get; set; }
    public string? Code { get; set; }
}

public class ProductCreateOrUpdateDto : IValidatableObject
{
    [StringLength(100)]
    public string? Id { get; set; }
    [Required, StringLength(150)]
    public string Name { get; set; } = string.Empty;
    [StringLength(200)]
    public string Kicker { get; set; } = string.Empty;
    [Required, AllowedValues("Cuadros", "Sets armables", "Cajas acrílicas", "Mini momentos", "Mini Box", "Llaveros", "Minifiguras")]
    public string Category { get; set; } = "Sets armables";
    [StringLength(500)]
    public string Detail { get; set; } = string.Empty;
    [StringLength(500)]
    public string Image { get; set; } = string.Empty;
    [StringLength(60)]
    public string? Tag { get; set; }
    [StringLength(60)]
    public string? Group { get; set; }
    [MaxLength(20)]
    public List<string> Occasion { get; set; } = new();
    [StringLength(6000)]
    public string Description { get; set; } = string.Empty;
    [Range(1, 100)]
    public int MinFigures { get; set; } = 1;
    [Range(1, 100)]
    public int MaxFigures { get; set; } = 8;
    [Required, MinLength(1), MaxLength(20)]
    public List<string> Variants { get; set; } = new();
    public bool AllowsPets { get; set; }
    public bool AllowsAccessories { get; set; } = true;
    [StringLength(1000)]
    public string Rule { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    [Range(0, 100000)]
    public int DisplayOrder { get; set; } = 0;
    [Range(0, 100000000)]
    public int? BasePrice { get; set; }
    [StringLength(100)]
    public string? Code { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinFigures > MaxFigures)
            yield return new ValidationResult("El mínimo no puede superar el máximo de figuras.", [nameof(MaxFigures)]);
        foreach (var (name, values) in new[] { (nameof(Variants), Variants), (nameof(Occasion), Occasion) })
            if (values != null && (values.Any(value => string.IsNullOrWhiteSpace(value) || value.Length > 100) || values.Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Count))
                yield return new ValidationResult("Las listas requieren valores únicos de 1 a 100 caracteres.", [name]);
        if (!string.IsNullOrEmpty(Image) && !(Image.StartsWith("/images/", StringComparison.Ordinal) || Image.StartsWith("/catalog-assets/", StringComparison.Ordinal)
            || Image.StartsWith("/uploads/products/", StringComparison.Ordinal) || Uri.TryCreate(Image, UriKind.Absolute, out var url) && url.Scheme == "https"))
            yield return new ValidationResult("La imagen requiere una ruta pública de catálogo o una URL HTTPS.", [nameof(Image)]);
    }
}
