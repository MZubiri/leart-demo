using SkiaSharp;

namespace Leart.Api.Tests;

internal static class TestImages
{
    public static byte[] Png(int width = 2, int height = 2)
    {
        using var image = new SKBitmap(width, height);
        image.Erase(SKColors.Blue);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }
}
