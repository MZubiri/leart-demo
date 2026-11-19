using System.Security.Claims;
using System.Text;
using Leart.Api.Data;
using Leart.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "wwwroot"
});

var jwtSecret = SecurityConfiguration.GetJwtSecret(builder.Configuration);
var connectionString = SecurityConfiguration.GetConnectionString(builder.Configuration);

var webRootPath = builder.Environment.WebRootPath ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(webRootPath))
{
    Directory.CreateDirectory(webRootPath);
}

// Controllers with JSON formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks().AddCheck<DatabaseReadinessCheck>("database", tags: ["ready"], timeout: TimeSpan.FromSeconds(3));

// OpenAPI
builder.Services.AddOpenApi();

// MySQL 8+, proveedor EF10. No se abre una conexión para autodetectar por petición.
builder.Services.AddDbContext<AppDbContext>(options => options.UseMySQL(connectionString));

builder.Services.AddSingleton<PricingCatalog>();

// Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddSingleton<OrderFileCleanup>();
builder.Services.AddHostedService(services => services.GetRequiredService<OrderFileCleanup>());

// JWT Authentication
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LeartApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LeartApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(id, out var userId)) { context.Fail("Sesión inválida."); return; }
            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var user = await db.AdminUsers.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Role != "Admin" || context.Principal?.FindFirstValue("session") != TokenService.SessionFingerprint(user, jwtSecret))
                context.Fail("La sesión expiró o fue revocada.");
        }
    };
    options.RequireHttpsMetadata = true;
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
builder.Services.AddAbuseProtection(builder.Configuration);

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

app.UseForwardedHeaders();
app.UseExceptionHandler();

// Static Files & Uploads
var uploadsPath = Path.Combine(webRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Directory.CreateDirectory(Path.Combine(uploadsPath, "products"));
    Directory.CreateDirectory(Path.Combine(uploadsPath, "orders"));
}

using (var storageScope = app.Services.CreateScope())
{
    storageScope.ServiceProvider.GetRequiredService<IFileStorageService>().MigrateLegacyOrderFiles();
}
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/uploads/orders", StringComparison.OrdinalIgnoreCase)
        || context.Request.Path.StartsWithSegments("/private", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }
    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRouting();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") });

// SPA Fallback that never crashes if index.html is temporarily missing
app.MapFallback(async context =>
{
    if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/uploads") || context.Request.Path.StartsWithSegments("/private")) { context.Response.StatusCode = 404; return; }
    var indexPath = Path.Combine(webRootPath, "index.html");
    if (File.Exists(indexPath))
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(indexPath);
    }
    else
    {
        context.Response.StatusCode = 404;
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.WriteAsync("<!DOCTYPE html><html><body><h1>Leart Store API</h1><p>El backend se encuentra activo. El frontend se est&aacute; inicializando.</p></body></html>");
    }
});

// Database Migration and Seeding on Startup with Retries
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    int retries = 3;
    while (retries > 0)
    {
        try
        {
            logger.LogInformation("Conectando a MySQL y verificando esquema de base de datos...");
            if (args.Contains("--adopt-existing-schema")) { await SchemaInitializer.AdoptExistingAsync(db); return; }
            await SchemaInitializer.InitializeAsync(db);
            await AdminBootstrap.InitializeAsync(db, builder.Configuration, args.Contains("--reset-admin-password"));
            if (args.Contains("--reset-admin-password")) return;
            await DbInitializer.SeedAsync(db, logger);
            logger.LogInformation("Base de datos inicializada y lista con datos del catalogo.");
            break;
        }
        catch (BootstrapConfigurationException) { throw; }
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
                logger.LogCritical(ex, "No se pudo inicializar MySQL. Se detiene el arranque.");
                throw;
            }
        }
    }
}

app.Run();

public partial class Program { }
