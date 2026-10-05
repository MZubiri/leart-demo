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
    string StoreName,
    string WhatsAppNumber,
    string AnnouncementText,
    string InstagramUrl,
    string? WhatsAppQuoteTemplate,
    string? WhatsAppPersonalizationTemplate
);
