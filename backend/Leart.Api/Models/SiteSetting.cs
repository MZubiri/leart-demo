namespace Leart.Api.Models;

public class SiteSetting
{
    public int Id { get; set; } = 1;
    public string StoreName { get; set; } = "Leart Store";
    public string WhatsAppNumber { get; set; } = "573000000000";
    public string AnnouncementText { get; set; } = "Hecho en Medellín · Envíos a toda Colombia";
    public string InstagramUrl { get; set; } = "https://www.instagram.com/leart.store/";
    public string WhatsAppQuoteTemplate { get; set; } = "Hola Leart 👋 Quiero cotizar esta selección:";
    public string WhatsAppPersonalizationTemplate { get; set; } = "Hola Leart 👋 Ya realicé mi pedido y quiero completar la información de personalización.";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
