using Microsoft.EntityFrameworkCore;
using Leart.Api.Models;

namespace Leart.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<PersonalizationOrder> PersonalizationOrders => Set<PersonalizationOrder>();
    public DbSet<OrderAttachment> OrderAttachments => Set<OrderAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SiteSetting>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.WhatsAppNumber).HasMaxLength(30).IsRequired();
            entity.Property(s => s.StoreName).HasMaxLength(100);
            entity.Property(s => s.AnnouncementText).HasMaxLength(250);
            entity.Property(s => s.InstagramUrl).HasMaxLength(250);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasMaxLength(100);
            entity.Property(p => p.Name).HasMaxLength(150).IsRequired();
            entity.Property(p => p.Category).HasMaxLength(60).IsRequired();
            entity.Property(p => p.Image).HasMaxLength(500);
            entity.Property(p => p.Tag).HasMaxLength(60);
            entity.Property(p => p.Group).HasMaxLength(60);
            entity.HasIndex(p => p.Category);
            entity.HasIndex(p => p.IsActive);
        });

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).HasMaxLength(50).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(100).IsRequired();
            entity.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<PersonalizationOrder>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.OrderReference).HasMaxLength(50);
            entity.Property(o => o.CustomerName).HasMaxLength(100).IsRequired();
            entity.Property(o => o.Phone).HasMaxLength(30).IsRequired();
            entity.Property(o => o.ProductTitle).HasMaxLength(150);
            entity.Property(o => o.Status).HasMaxLength(40).HasDefaultValue("Pendiente");
            entity.HasMany(o => o.Attachments)
                  .WithOne(a => a.Order)
                  .HasForeignKey(a => a.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderAttachment>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.OriginalFileName).HasMaxLength(250);
            entity.Property(a => a.StoredFileName).HasMaxLength(250);
            entity.Property(a => a.FilePath).HasMaxLength(500);
            entity.Property(a => a.ContentType).HasMaxLength(100);
        });
    }
}
