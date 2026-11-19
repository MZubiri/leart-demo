using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using Leart.Api.Models;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize]
public class AdminOrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _storage;

    public AdminOrdersController(AppDbContext context, IFileStorageService storage)
    {
        _context = context;
        _storage = storage;
    }

    private static readonly Expression<Func<PersonalizationOrder, OrderSummaryDto>> Summary = o => new(
        o.Id, o.OrderReference, o.CustomerName, o.Phone, o.ProductTitle, o.Status, o.CreatedAt, o.Attachments.Count);

    [HttpGet]
    public async Task<ActionResult<PagedOrdersDto>> GetAll([FromQuery] string? status = null,
        [FromQuery, Range(1, 100000)] int page = 1, [FromQuery, Range(1, 100)] int pageSize = 20)
    {
        if (!string.IsNullOrWhiteSpace(status) && !new[] { "Todos", "Pendiente", "En producción", "Completado", "Cancelado" }.Contains(status))
            return BadRequest(new { message = "Estado de filtro desconocido." });
        var query = _context.PersonalizationOrders.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status) && status != "Todos") query = query.Where(o => o.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).Select(Summary).ToListAsync();
        return Ok(new PagedOrdersDto(items, page, pageSize, total));
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard()
    {
        var number = await _context.SiteSettings.AsNoTracking().Select(s => s.WhatsAppNumber).FirstOrDefaultAsync() ?? "";
        return Ok(new AdminDashboardDto(number, await _context.Products.CountAsync(), await _context.Products.CountAsync(p => p.IsActive),
            await _context.PersonalizationOrders.CountAsync(), await _context.PersonalizationOrders.CountAsync(o => o.Status == "Pendiente"),
            await _context.PersonalizationOrders.AsNoTracking().OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id).Take(5).Select(Summary).ToListAsync()));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderResponseDto>> GetById(int id)
    {
        var o = await _context.PersonalizationOrders.AsNoTracking()
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (o == null)
            return NotFound(new { message = "Pedido no encontrado." });

        return Ok(new OrderResponseDto
        {
            Id = o.Id,
            OrderReference = o.OrderReference,
            CustomerName = o.CustomerName,
            Phone = o.Phone,
            ProductTitle = o.ProductTitle,
            PeopleDetails = o.PeopleDetails,
            Story = o.Story,
            Phrase = o.Phrase,
            Requirements = o.Requirements,
            Status = o.Status,
            CreatedAt = o.CreatedAt,
            Attachments = o.Attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                OriginalFileName = a.OriginalFileName,
                Url = $"/api/admin/orders/attachments/{a.Id}",
                ContentType = a.ContentType,
                FileSizeBytes = a.FileSizeBytes,
                UploadedAt = a.UploadedAt
            }).ToList()
        });
    }

    [HttpGet("attachments/{attachmentId:int}")]
    public async Task<IActionResult> DownloadAttachment(int attachmentId)
    {
        var attachment = await _context.OrderAttachments.AsNoTracking().SingleOrDefaultAsync(a => a.Id == attachmentId);
        if (attachment == null) return NotFound();
        var stream = _storage.OpenOrderFile(attachment.FilePath);
        if (stream == null) return NotFound();
        Response.Headers.CacheControl = "no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, "application/octet-stream", Path.GetFileName(attachment.OriginalFileName));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var order = await _context.PersonalizationOrders.FindAsync(id);
        if (order == null)
            return NotFound(new { message = "Pedido no encontrado." });

        order.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Pendiente" : dto.Status.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { id = order.Id, status = order.Status });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var order = await _context.PersonalizationOrders
            .Include(o => o.Attachments)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound(new { message = "Pedido no encontrado." });

        foreach (var attachment in order.Attachments)
        {
            if (!_storage.DeleteFile(attachment.FilePath))
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "No se pudo completar el borrado de fotos. El pedido se conserva para reintentar." });
        }

        _context.PersonalizationOrders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
