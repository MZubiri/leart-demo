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

public class ProductCreateOrUpdateDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Kicker { get; set; } = string.Empty;
    public string Category { get; set; } = "Sets armables";
    public string Detail { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string? Tag { get; set; }
    public string? Group { get; set; }
    public List<string> Occasion { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public int MinFigures { get; set; } = 1;
    public int MaxFigures { get; set; } = 8;
    public List<string> Variants { get; set; } = new();
    public bool AllowsPets { get; set; }
    public bool AllowsAccessories { get; set; } = true;
    public string Rule { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    public int? BasePrice { get; set; }
    public string? Code { get; set; }
}
