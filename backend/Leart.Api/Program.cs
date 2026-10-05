using System.Text;
using Leart.Api.Data;
using Leart.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Explicitly configure WebRoot to ensure static files and index.html are served reliably
var contentRoot = builder.Environment.ContentRootPath;
var webRootPath = Path.Combine(contentRoot, "wwwroot");
if (!Directory.Exists(webRootPath))
{
    Directory.CreateDirectory(webRootPath);
}
builder.WebHost.UseWebRoot(webRootPath);

// Controllers with JSON formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// OpenAPI
builder.Services.AddOpenApi();

// Database Context (MariaDB / MySQL with Pomelo)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=127.0.0.1;Port=3306;Database=leart_db;User=root;Password=root;AllowUserVariables=True;CharSet=utf8mb4;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Use MariaDB 10.11 compatibility (standard for Debian/Docker runtimes, also compatible with MySQL)
    var serverVersion = new MariaDbServerVersion(new Version(10, 11, 0));
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

// Top-level diagnostic error middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Unhandled exception on request {Path}: {Message}", context.Request.Path, ex.Message);

        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync($@"
<!DOCTYPE html>
<html>
<head><title>500 Internal Error - Leart Store</title></head>
<body style='font-family: system-ui, sans-serif; padding: 2rem; background: #fff5f5; color: #742a2a; max-width: 900px; margin: 0 auto;'>
  <h2>500 - Error Interno del Servidor</h2>
  <p><strong>Ruta:</strong> {System.Net.WebUtility.HtmlEncode(context.Request.Path.Value)}</p>
  <p><strong>Detalle:</strong> {System.Net.WebUtility.HtmlEncode(ex.Message)}</p>
  <pre style='background: #fff; padding: 1rem; border: 1px solid #feb2b2; border-radius: 6px; overflow: auto; font-size: 13px;'>{System.Net.WebUtility.HtmlEncode(ex.ToString())}</pre>
</body>
</html>");
        }
    }
});

// Static Files & Uploads
var uploadsPath = Path.Combine(webRootPath, "uploads");
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

// SPA Fallback that never crashes if index.html is temporarily missing
app.MapFallback(async context =>
{
    var indexPath = Path.Combine(webRootPath, "index.html");
    if (File.Exists(indexPath))
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(indexPath);
    }
    else
    {
        context.Response.StatusCode = 200;
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.WriteAsync("<!DOCTYPE html><html><body><h1>Leart Store API</h1><p>El backend se encuentra activo. El frontend se est&aacute; inicializando.</p></body></html>");
    }
});

// Database Migration and Seeding on Startup with Retries
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    int retries = 10;
    while (retries > 0)
    {
        try
        {
            logger.LogInformation("Conectando a MariaDB/MySQL y verificando esquema de base de datos...");
            await db.Database.EnsureCreatedAsync();
            await DbInitializer.SeedAsync(db, logger);
            logger.LogInformation("Base de datos inicializada y lista con datos del catalogo.");
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
