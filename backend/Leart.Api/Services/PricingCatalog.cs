using System.Text.Json;

namespace Leart.Api.Services;

public sealed class PricingCatalog
{
    public JsonElement Rules { get; }
    public PricingCatalog(IWebHostEnvironment environment)
    {
        Rules = JsonSerializer.Deserialize<JsonElement>(File.ReadAllText(Path.Combine(environment.ContentRootPath, "Data", "pricing-rules.json")));
    }
}
