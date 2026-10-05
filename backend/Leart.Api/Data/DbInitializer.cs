using System.Text.Json;
using Leart.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Leart.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        try
        {
            // Seed Settings if missing
            if (!await context.SiteSettings.AnyAsync())
            {
                logger.LogInformation("Seeding default SiteSettings...");
                context.SiteSettings.Add(new SiteSetting
                {
                    Id = 1,
                    StoreName = "Leart Store",
                    WhatsAppNumber = "573000000000", // Default placeholder editable via Admin Panel
                    AnnouncementText = "Hecho en Medellín · Envíos a toda Colombia",
                    InstagramUrl = "https://www.instagram.com/leart.store/",
                    WhatsAppQuoteTemplate = "Hola Leart 👋 Quiero cotizar esta selección:\n\n{lines}\n\nMi nombre es:\nCiudad de envío:\nFecha en que lo necesito:",
                    WhatsAppPersonalizationTemplate = "Hola Leart 👋 Ya realicé mi pedido y quiero completar la información de personalización."
                });
                await context.SaveChangesAsync();
            }

            // Seed Admin User if missing
            if (!await context.AdminUsers.AnyAsync())
            {
                logger.LogInformation("Seeding default AdminUser (admin / Leart2026!)...");
                context.AdminUsers.Add(new AdminUser
                {
                    Username = "admin",
                    Email = "admin@leart.store",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Leart2026!"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }

            // Seed Products if missing
            if (!await context.Products.AnyAsync())
            {
                logger.LogInformation("Seeding initial products from Leart catalog...");
                var products = GetInitialProducts();
                context.Products.AddRange(products);
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded {Count} products.", products.Count);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during DbInitializer.SeedAsync");
            throw;
        }
    }

    public static List<Product> GetInitialProducts()
    {
        const string sets = "/catalog-assets/sets/";
        const string figs = "/catalog-assets/minifiguras/";
        const string box = "/catalog-assets/minibox/";
        const string images = "/images/";

        Product Set(string id, string name, string kicker, string detail, string image, string group = "Grupo 1", string[]? occasions = null) => new()
        {
            Id = id,
            Name = name,
            Kicker = kicker,
            Category = "Sets armables",
            Detail = detail,
            Image = sets + image,
            Tag = group,
            Group = group,
            OccasionJson = JsonSerializer.Serialize(occasions ?? new[] { "Pareja", "Cumpleaños" }),
            Description = $"{name} es un set armable decorativo que puede combinarse con minifiguras para representar a una persona o momento especial. Leart confirma el grupo, las piezas y los accesorios disponibles antes del pago.",
            MinFigures = 1,
            MaxFigures = 8,
            VariantsJson = JsonSerializer.Serialize(new[] { group }),
            AllowsPets = true,
            AllowsAccessories = true,
            Rule = "El valor depende del grupo del set, la cantidad de minifiguras y los extras.",
            IsActive = true
        };

        Product Figure(string id, string name, string image, string[]? occasions = null) => new()
        {
            Id = id,
            Name = name,
            Kicker = "Personajes disponibles",
            Category = "Minifiguras",
            Detail = "Consulta inventario",
            Image = figs + image,
            Tag = "Colección",
            OccasionJson = JsonSerializer.Serialize(occasions ?? new[] { "Coleccionistas", "Cumpleaños" }),
            Description = "Colección de minifiguras disponibles para combinar cabello, rostro, outfit y accesorios según inventario. Leart comparte las opciones disponibles después de confirmar el pedido.",
            MinFigures = 1,
            MaxFigures = 8,
            VariantsJson = JsonSerializer.Serialize(new[] { "Figura individual", "Imán" }),
            AllowsAccessories = true,
            Rule = "Cabello, rostro, outfit y accesorios están sujetos al inventario disponible.",
            IsActive = true
        };

        Product AcrylicBox(string id, string name, string kicker, string detail, string image, string[] occasions) => new()
        {
            Id = id,
            Name = name,
            Kicker = kicker,
            Category = "Cajas acrílicas",
            Detail = detail,
            Image = box + image,
            Tag = "Máx. 4 figuras",
            Group = "Caja acrílica",
            OccasionJson = JsonSerializer.Serialize(occasions),
            Description = "Presentación en caja para crear una escena personalizada con fondo, minifiguras y pequeños detalles. Puede incluir hasta cuatro minifiguras.",
            MinFigures = 1,
            MaxFigures = 4,
            VariantsJson = JsonSerializer.Serialize(new[] { "Caja con fondo", "Caja con mini set" }),
            AllowsPets = true,
            AllowsAccessories = true,
            Rule = "Máximo cuatro minifiguras. El valor cambia según figuras, mascotas y accesorios.",
            IsActive = true
        };

        return new List<Product>
        {
            new Product
            {
                Id = "cuadro-personalizado",
                Name = "Cuadro personalizado",
                Kicker = "Tu historia enmarcada",
                Category = "Cuadros",
                Detail = "Tamaños S, M y L",
                Image = images + "cuadro-personalizado.png",
                Tag = "1 a 8 figuras",
                OccasionJson = JsonSerializer.Serialize(new[] { "Pareja", "Familia", "Cumpleaños", "Aniversario", "Graduación" }),
                Description = "Un cuadro diseñado alrededor de tu historia. El tamaño se elige según la cantidad de minifiguras, la composición y el espacio que quieras darle a la escena.",
                MinFigures = 1,
                MaxFigures = 8,
                VariantsJson = JsonSerializer.Serialize(new[] { "Tamaño S · máx. 4", "Tamaño M · máx. 6", "Tamaño L · máx. 8" }),
                AllowsPets = true,
                AllowsAccessories = true,
                Rule = "Capacidad total entre minifiguras y mascotas: S máximo 4, M máximo 6 y L máximo 8.",
                IsActive = true
            },
            Set("set-cafe", "Cita en el café", "Un plan inolvidable", "140 piezas", "243775c4-7b83-46fe-9189-bcb9c7126e19.png", "Grupo 3", new[] { "Pareja", "Aniversario" }),
            AcrylicBox("caja-taller", "Caja acrílica Taller", "Incluye mini set armable", "65 piezas", "df814d06-067e-4b15-b7b5-9731d683f9ff.png", new[] { "Profesiones", "Cumpleaños" }),
            new Product
            {
                Id = "llavero-personalizado",
                Name = "Llavero personalizado",
                Kicker = "Un personaje para llevar",
                Category = "Llaveros",
                Detail = "Una minifigura",
                Image = figs + "06bec1bd-01d5-4a30-8593-f3908d2b64bd.jpg",
                Tag = "Cotizar",
                OccasionJson = JsonSerializer.Serialize(new[] { "Pareja", "Amigos", "Cumpleaños" }),
                Description = "Llavero con una minifigura elegida según el inventario disponible. Leart confirma el personaje, outfit y accesorios antes del pago.",
                MinFigures = 1,
                MaxFigures = 1,
                VariantsJson = JsonSerializer.Serialize(new[] { "Llavero individual" }),
                AllowsAccessories = true,
                Rule = "Una minifigura por llavero. Diseños y piezas sujetos a inventario.",
                IsActive = true
            },
            Figure("fig-profesiones", "Profesiones", "9cc3d850-256f-4a59-b551-85b0a7fe033c.jpg", new[] { "Profesiones", "Graduación" }),
            Set("set-otono", "Cita en otoño", "Escena para personalizar", "99 piezas", "0012f611-7622-45c5-bc55-fef41e6442dc.png", "Grupo 3", new[] { "Pareja", "Aniversario" }),
            Set("set-foto", "Set fotografía", "Para quienes capturan momentos", "167 piezas", "003c24d6-8918-4aec-8583-c4f59a045131.png", "Grupo 3", new[] { "Profesiones", "Graduación" }),
            Set("set-parque", "Mini parque", "Un rincón para dos", "60 piezas", "0ea7c0ee-26b7-4829-a278-1f271e68a988.png", "Grupo 1", new[] { "Pareja", "Aniversario" }),
            Set("set-mercado", "Puesto de mercado", "Escena urbana", "Set personalizable", "18f2f123-6c81-4c34-9c59-fb4d7074492d.png", "Grupo 2", new[] { "Profesiones", "Cumpleaños" }),
            Set("set-futbol", "Cancha de fútbol", "Para hinchas de verdad", "20 piezas", "1a75b290-9657-4c33-915c-76bd83113eb9.png", "Grupo 1", new[] { "Deportes", "Cumpleaños" }),
            Set("set-consultorio", "Set consultorio", "Celebra su profesión", "158 piezas", "21c21329-083f-488c-8674-b193e95c1f2a.png", "Grupo 3", new[] { "Profesiones", "Graduación" }),
            Set("set-lab", "Set laboratorio", "Para mentes curiosas", "166 piezas", "28c7a5b5-6118-4db4-a29c-1fd288c86351.png", "Grupo 3", new[] { "Profesiones", "Graduación" }),
            Set("set-bbq", "Barbacoa", "El parche perfecto", "54 piezas", "28fb4712-de07-4428-b711-ac1fdc81068a.png", "Grupo 1", new[] { "Amigos", "Cumpleaños" }),
            Set("set-rayo-rojo", "Rayo rojo", "Modo velocidad", "69 piezas", "39883bba-ec0b-4a97-b51d-a867041ed255.png", "Grupo 1", new[] { "Vehículos", "Cumpleaños" }),
            Set("set-hotdog", "Hot dog", "Un clásico callejero", "100 piezas", "4158bd8a-a71e-4033-baaa-15fc1bccc947.png", "Grupo 2", new[] { "Profesiones", "Cumpleaños" }),
            Set("set-rayo-blanco", "Rayo blanco", "Modo velocidad", "71 piezas", "46ad66c4-1926-4dbf-b79c-6577283e2596.png", "Grupo 1", new[] { "Vehículos", "Cumpleaños" }),
            Set("set-jardin", "Jardín secreto", "Naturaleza en miniatura", "117 piezas", "48499fd1-79fc-4291-ad14-776a32ed285b.png", "Grupo 2", new[] { "Pareja", "Aniversario" }),
            Set("set-hockey", "Mini hockey", "Para jugar y exhibir", "Set interactivo", "50dad80b-49a5-400e-aced-d22c7b4530c7.png", "Grupo 1", new[] { "Deportes", "Cumpleaños" }),
            Set("set-bateria", "Batería", "Para quien vive la música", "35 piezas", "55596977-1ab7-4b2b-9d96-282363e33081.png", "Grupo 1", new[] { "Música", "Cumpleaños" }),
            Set("set-astronauta", "Set astronauta", "Una aventura espacial", "152 piezas", "6fdb0ac4-426f-4e27-bac0-6ddaf70a4bd2.png", "Grupo 3", new[] { "Profesiones", "Graduación" }),
            Set("set-billar", "Mini billar", "Para el salón de juegos", "72 piezas", "7bbb7996-777e-4368-8997-b600e6455116.png", "Grupo 1", new[] { "Amigos", "Cumpleaños" }),
            Set("set-piscina", "Pisci Encanto", "Vacaciones en miniatura", "125 piezas", "7ee002c8-dcd0-452b-afb3-c023d94cc4e6.png", "Grupo 3", new[] { "Pareja", "Vacaciones" }),
            AcrylicBox("caja-fitness", "Caja acrílica Fitness", "Escena de entrenamiento", "21 piezas", "462fcdf5-8fe1-48a2-8887-faa841811c09.png", new[] { "Deportes", "Cumpleaños" }),
            AcrylicBox("caja-buena-vibra", "Caja acrílica Buena Vibra", "Una noche para recordar", "20 piezas", "f639f9d0-9aa9-4b9a-a278-594ce0a45ed2.png", new[] { "Amigos", "Cumpleaños" }),
            Figure("fig-galaxia", "Colección Galaxia", "150e20c4-8ea9-4212-94c6-b7e094347ea1.jpg"),
            Figure("fig-magia", "Mundo mágico", "35bd0e27-9e52-444d-a3bb-f6914b3ac144.jpg"),
            Figure("fig-heroes", "Héroes y villanos", "3b1a6036-5b2b-4a71-be55-7494a0c827cc.jpg"),
            Figure("fig-aventura", "Personajes de aventura", "326ff765-15db-4c90-b6e0-8e35b665f560.jpg"),
            Figure("fig-animados", "Favoritos animados", "ab2e970f-ffb1-43fe-b54a-9b5a77b572aa.jpg"),
            Figure("fig-futbol", "Futbolistas", "eb1d49cf-4e35-42d4-b02e-51b80ca3f7ed.jpg", new[] { "Deportes", "Cumpleaños" }),
            Figure("fig-clasicos", "Dúos clásicos", "263b7290-6417-4de0-ade4-cec663d73a55.jpg")
        };
    }
}
