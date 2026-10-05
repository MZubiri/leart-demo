namespace Leart.Api.DTOs;

public record LoginRequestDto(string Username, string Password);

public record LoginResponseDto(string Token, string Username, string Email, string Role, DateTime ExpiresAt);

public record UserDto(int Id, string Username, string Email, string Role);
