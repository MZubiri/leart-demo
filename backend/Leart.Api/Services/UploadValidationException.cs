namespace Leart.Api.Services;

public sealed class UploadValidationException(string message) : ArgumentException(message);
