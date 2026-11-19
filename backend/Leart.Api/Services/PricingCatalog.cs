using System.Text.Json;
using Leart.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Services;

public sealed class PricingCatalog(AppDbContext context, ILogger<PricingCatalog> logger) : IPricingCatalog
{
    public async Task<JsonElement?> GetRulesAsync(CancellationToken cancellationToken)
    {
        try
        {
            var json = await context.PricingConfigurations.AsNoTracking()
                .Where(configuration => configuration.Id == 1)
                .Select(configuration => configuration.RulesJson)
                .SingleOrDefaultAsync(cancellationToken);
            if (json is null) throw new InvalidDataException("La matriz de precios no está inicializada.");
            var rules = JsonSerializer.Deserialize<JsonElement>(json);
            if (rules.ValueKind != JsonValueKind.Object || !rules.TryGetProperty("currency", out var currency)
                || currency.GetString() != "COP") throw new InvalidDataException("Moneda de tarifas inválida.");
            foreach (var section in new[] { "frames", "sets", "moments", "extraPrices", "variants", "defaultLimits", "frameLimits", "acrylic", "acrylicPetLimits" })
                if (!rules.TryGetProperty(section, out var value) || value.ValueKind != JsonValueKind.Object)
                    throw new InvalidDataException("Matriz de precios incompleta.");
            return rules;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "No se pudieron consultar las tarifas de la base de datos.");
            return null;
        }
    }
}
