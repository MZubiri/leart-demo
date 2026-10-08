namespace Leart.Api.Models;

public class Product
{
    public string Id { get; set; } = string.Empty; // Unique slug (e.g. "cuadro-personalizado")
    public string Name { get; set; } = string.Empty;
    public string Kicker { get; set; } = string.Empty;
    public string Category { get; set; } = "Sets armables"; // 'Cuadros', 'Sets armables', 'Cajas acrílicas', 'Mini momentos', 'Mini Box', 'Llaveros', 'Minifiguras'
    public string Detail { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string? Tag { get; set; }
    public string? Group { get; set; }
    public string OccasionJson { get; set; } = "[]"; // Serialized JSON array of strings
    public string Description { get; set; } = string.Empty;
    public int MinFigures { get; set; } = 1;
    public int MaxFigures { get; set; } = 8;
    public string VariantsJson { get; set; } = "[]"; // Serialized JSON array of variant names
    public bool AllowsPets { get; set; } = false;
    public bool AllowsAccessories { get; set; } = true;
    public string Rule { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    public int? BasePrice { get; set; }
    public string? Code { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
