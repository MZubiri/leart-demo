using Leart.Api.Data;
using Leart.Api.DTOs;
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

    public AdminOrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderResponseDto>>> GetAll([FromQuery] string? status = null)
    {
        var query = _context.PersonalizationOrders
            .Include(o => o.Attachments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "Todos")
        {
            query = query.Where(o => o.Status == status);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var result = orders.Select(o => new OrderResponseDto
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
                Url = a.FilePath,
                ContentType = a.ContentType,
                FileSizeBytes = a.FileSizeBytes,
                UploadedAt = a.UploadedAt
            }).ToList()
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderResponseDto>> GetById(int id)
    {
        var o = await _context.PersonalizationOrders
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
                Url = a.FilePath,
                ContentType = a.ContentType,
                FileSizeBytes = a.FileSizeBytes,
                UploadedAt = a.UploadedAt
            }).ToList()
        });
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

        _context.PersonalizationOrders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
