using System.ComponentModel.DataAnnotations;

namespace Leart.Api.DTOs;

public class PersonalizationCreateDto
{
    [Required, StringLength(50)] public string OrderReference { get; set; } = string.Empty;
    [Required, StringLength(100)] public string CustomerName { get; set; } = string.Empty;
    [Required, RegularExpression(@"^\+?[0-9]{8,15}$")] public string Phone { get; set; } = string.Empty;
    [Required, StringLength(150)] public string ProductTitle { get; set; } = string.Empty;
    [StringLength(4000)] public string? PeopleDetails { get; set; }
    [StringLength(4000)] public string? Story { get; set; }
    [StringLength(1000)] public string? Phrase { get; set; }
    [StringLength(4000)] public string? Requirements { get; set; }
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

public record UpdateOrderStatusDto([Required, AllowedValues("Pendiente", "En producción", "Completado", "Cancelado")] string Status);

public record OrderSummaryDto(int Id, string OrderReference, string CustomerName, string Phone, string ProductTitle, string Status, DateTime CreatedAt, int AttachmentCount);
public record PagedOrdersDto(List<OrderSummaryDto> Items, int Page, int PageSize, int Total);
public record AdminDashboardDto(string WhatsAppNumber, int TotalProducts, int ActiveProducts, int TotalOrders, int PendingOrders, List<OrderSummaryDto> RecentOrders);
