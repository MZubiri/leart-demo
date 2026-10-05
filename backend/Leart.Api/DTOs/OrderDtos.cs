namespace Leart.Api.DTOs;

public class PersonalizationCreateDto
{
    public string OrderReference { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ProductTitle { get; set; } = string.Empty;
    public string PeopleDetails { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public string Phrase { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
}

public class OrderResponseDto
{
    public int Id { get; set; }
    public string OrderReference { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ProductTitle { get; set; } = string.Empty;
    public string PeopleDetails { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public string Phrase { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<AttachmentDto> Attachments { get; set; } = new();
}

public class AttachmentDto
{
    public int Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}

public record UpdateOrderStatusDto(string Status);
