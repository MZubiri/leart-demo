using System.Security.Claims;
using Leart.Api.Data;
using Leart.Api.DTOs;
using Leart.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AdminAuthController(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Usuario y contraseña requeridos." });
        }

        var user = await _context.AdminUsers.FirstOrDefaultAsync(u => u.Username == dto.Username.Trim());
        if (user == null)
        {
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        var valid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!valid)
        {
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);
        return Ok(new LoginResponseDto(token, user.Username, user.Email, user.Role, expiresAt));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var user = await _context.AdminUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null)
            return NotFound();

        return Ok(new UserDto(user.Id, user.Username, user.Email, user.Role));
    }
}
