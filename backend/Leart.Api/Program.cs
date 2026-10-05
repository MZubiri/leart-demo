using System.Text;
using Leart.Api.Data;
using Leart.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Controllers with JSON formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// OpenAPI
builder.Services.AddOpenApi();

// Database Context (MySQL with Pomelo)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=127.0.0.1;Port=3306;Database=leart_db;User=root;Password=root;AllowUserVariables=True;CharSet=utf8mb4;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Use MySQL 8.0 by default
    var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));
    options.UseMySql(connectionString, serverVersion, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 10,
            maxRetryDelay: TimeSpan.FromSeconds(3),
            errorNumbersToAdd: null);
    });
});

// Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "LeartSecureSuperSecretKey2026WithSufficientLengthForHmacSha256!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LeartApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LeartApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "http://localhost:80",
            "http://localhost",
            "https://localhost:4200"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Static Files & Uploads
var uploadsPath = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Directory.CreateDirectory(Path.Combine(uploadsPath, "products"));
    Directory.CreateDirectory(Path.Combine(uploadsPath, "orders"));
}
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

// Database Migration and Seeding on Startup with Retries
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    int retries = 8;
    while (retries > 0)
    {
        try
        {
            logger.LogInformation("Conectando a MySQL y verificando esquema de base de datos...");
            await db.Database.EnsureCreatedAsync();
            await DbInitializer.SeedAsync(db, logger);
            logger.LogInformation("Base de datos MySQL inicializada y lista con datos del catalogo.");
            break;
        }
        catch (Exception ex)
        {
            retries--;
            logger.LogWarning("Intento de conexion a MySQL fallido ({Retries} intentos restantes): {Message}", retries, ex.Message);
            if (retries > 0)
            {
                await Task.Delay(2000);
            }
            else
            {
                logger.LogError(ex, "No se pudo conectar a MySQL tras varios intentos. Se continuara en modo seguro.");
            }
        }
    }
}

app.Run();
