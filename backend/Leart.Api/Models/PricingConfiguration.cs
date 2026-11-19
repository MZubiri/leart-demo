namespace Leart.Api.Models;

public sealed class PricingConfiguration
{
    public int Id { get; set; }
    public string RulesJson { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
