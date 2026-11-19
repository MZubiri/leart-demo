using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Leart.Api.DTOs;

public record PublicSettingsDto(
    string StoreName,
    string WhatsAppNumber,
    string AnnouncementText,
    string InstagramUrl,
    string WhatsAppQuoteTemplate,
    string WhatsAppPersonalizationTemplate
);

public record UpdateSettingsDto(
    [Required, StringLength(100)] string StoreName,
    [Required, RegularExpression(@"^[0-9]{8,15}$")] string WhatsAppNumber,
    [StringLength(250)] string AnnouncementText,
    [StringLength(250)] string InstagramUrl,
    [StringLength(4000)] string? WhatsAppQuoteTemplate,
    [StringLength(4000)] string? WhatsAppPersonalizationTemplate
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        foreach (var (template, field, allowed) in new[] {
            (WhatsAppQuoteTemplate, nameof(WhatsAppQuoteTemplate), new[] { "lines" }),
            (WhatsAppPersonalizationTemplate, nameof(WhatsAppPersonalizationTemplate), new[] { "reference", "name", "phone", "product", "people", "story", "phrase", "requirements" }) })
        {
            if (template != null && Regex.Matches(template, @"\{([^{}]+)\}").Any(m => !allowed.Contains(m.Groups[1].Value)))
                yield return new ValidationResult("La plantilla contiene variables no admitidas.", [field]);
        }
        if (!string.IsNullOrEmpty(InstagramUrl) && (!Uri.TryCreate(InstagramUrl, UriKind.Absolute, out var url) || url.Scheme != "https" || url.UserInfo.Length > 0))
            yield return new ValidationResult("La red social requiere una URL HTTPS válida.", [nameof(InstagramUrl)]);
    }
}
