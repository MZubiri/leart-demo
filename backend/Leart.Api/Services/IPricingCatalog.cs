using System.Text.Json;

namespace Leart.Api.Services;

public interface IPricingCatalog
{
    Task<JsonElement?> GetRulesAsync(CancellationToken cancellationToken);
}
