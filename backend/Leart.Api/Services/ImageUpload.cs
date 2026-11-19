using SkiaSharp;

namespace Leart.Api.Services;

public static class ImageUpload
{
    public const long MaxFileBytes = 5 * 1024 * 1024;
    private static readonly SemaphoreSlim Decoders = new(2, 2);

    public static async Task<byte[]> NormalizeAsync(IFormFile file)
    {
        if (file.Length is <= 0 or > MaxFileBytes)
            throw new UploadValidationException("Cada foto debe contener datos y pesar como máximo 5 MB.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".png" or ".jpg" or ".jpeg" or ".webp"))
            throw new UploadValidationException("Solo se admiten fotografías JPEG, PNG y WebP.");
        await Decoders.WaitAsync();
        try
        {
            using var input = file.OpenReadStream();
            using var codec = SKCodec.Create(input);
            if (codec == null || codec.FrameCount > 1 || codec.EncodedFormat is not (SKEncodedImageFormat.Png or SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Webp))
                throw new UploadValidationException("La foto no es una imagen válida o contiene animación.");
            var info = codec.Info;
            if (info.Width > 4096 || info.Height > 4096 || (long)info.Width * info.Height > 12_000_000)
                throw new UploadValidationException("La foto excede 4096 píxeles por lado o 12 megapíxeles.");
            using var bitmap = new SKBitmap(new SKImageInfo(info.Width, info.Height, SKColorType.Rgba8888, SKAlphaType.Premul));
            if (codec.GetPixels(bitmap.Info, bitmap.GetPixels()) != SKCodecResult.Success)
                throw new UploadValidationException("La foto está incompleta o dañada.");
            using var encoded = bitmap.Encode(SKEncodedImageFormat.Png, 100);
            if (encoded == null || encoded.Size > MaxFileBytes)
                throw new UploadValidationException("La foto normalizada excede 5 MB. Reduce su tamaño.");
            return encoded.ToArray();
        }
        finally { Decoders.Release(); }
    }
}
