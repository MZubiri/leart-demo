namespace Leart.Api.Models;

public class PersonalizationOrder
{
    public int Id { get; set; }
    public string OrderReference { get; set; } = string.Empty; // e.g. "PED-2026-001" or customer payment ref
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ProductTitle { get; set; } = string.Empty;
    public string PeopleDetails { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public string Phrase { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Status { get; set; } = "Pendiente"; // "Pendiente", "En producción", "Completado", "Cancelado"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderAttachment> Attachments { get; set; } = new();
}

public class OrderAttachment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public PersonalizationOrder? Order { get; set; }
}
