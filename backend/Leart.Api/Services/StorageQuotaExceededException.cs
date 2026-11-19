namespace Leart.Api.Services;

public sealed class StorageQuotaExceededException() : IOException("No hay capacidad para recibir más archivos. Contacta con la tienda.");
