using System.ComponentModel.DataAnnotations;

namespace Leart.Api.DTOs;

public record LoginRequestDto([Required, StringLength(50)] string Username, [Required, StringLength(72)] string Password);

public record LoginResponseDto(string Token, string Username, string Email, string Role, DateTime ExpiresAt);

public record UserDto(int Id, string Username, string Email, string Role);

public record ChangePasswordRequestDto([Required, StringLength(72)] string CurrentPassword, [Required, StringLength(72, MinimumLength = 12)] string NewPassword);
