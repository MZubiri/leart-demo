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
    ?? "Server=localhost;Port=3306;Database=leart_db;User=root;Password=root;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Use MySQL 8.0 by default
    var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));
    options.UseMySql(connectionString, serverVersion, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(5),
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
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Database Migration and Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        logger.LogInformation("Checking database connection and ensuring database schema...");
        await db.Database.EnsureCreatedAsync();
        await DbInitializer.SeedAsync(db, logger);
        logger.LogInformation("Database ready.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not initialize database on startup. Ensure MySQL is running.");
    }
}

app.Run();
