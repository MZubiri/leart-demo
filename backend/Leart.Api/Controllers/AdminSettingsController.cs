using System.Text.RegularExpressions;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Controllers;

[ApiController]
[Route("api/admin/settings")]
[Authorize]
public class AdminSettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminSettingsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<SiteSetting>> GetSettings()
    {
        var settings = await _context.SiteSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new SiteSetting();
            _context.SiteSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(settings);
    }

    [HttpPut]
    public async Task<ActionResult<SiteSetting>> UpdateSettings([FromBody] UpdateSettingsDto dto)
    {
        var settings = await _context.SiteSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new SiteSetting();
            _context.SiteSettings.Add(settings);
        }

        // Clean WhatsApp number: keep only digits
        var cleanWhatsApp = Regex.Replace(dto.WhatsAppNumber ?? string.Empty, @"[^\d]", "");
        if (string.IsNullOrWhiteSpace(cleanWhatsApp))
        {
            return BadRequest(new { message = "El número de WhatsApp es obligatorio y debe contener solo dígitos con indicativo (ej: 573001234567)." });
        }

        settings.StoreName = string.IsNullOrWhiteSpace(dto.StoreName) ? "Leart Store" : dto.StoreName.Trim();
        settings.WhatsAppNumber = cleanWhatsApp;
        settings.AnnouncementText = dto.AnnouncementText?.Trim() ?? string.Empty;
        settings.InstagramUrl = dto.InstagramUrl?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(dto.WhatsAppQuoteTemplate))
            settings.WhatsAppQuoteTemplate = dto.WhatsAppQuoteTemplate;
        if (!string.IsNullOrWhiteSpace(dto.WhatsAppPersonalizationTemplate))
            settings.WhatsAppPersonalizationTemplate = dto.WhatsAppPersonalizationTemplate;

        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(settings);
    }
}
