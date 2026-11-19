using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Leart.Api.Data;

public static class SchemaInitializer
{
    public static async Task InitializeAsync(AppDbContext db)
    {
        if (!db.Database.IsRelational()) { await db.Database.EnsureCreatedAsync(); return; }
        await db.Database.OpenConnectionAsync();
        try
        {
            var tables = await ReadAsync(db, "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");
            var applied = (await db.Database.GetAppliedMigrationsAsync()).ToArray();
            if (tables.Any(row => row[0] != "__EFMigrationsHistory") && applied.Length == 0)
                throw new InvalidOperationException("La BD existente requiere copia de seguridad y adopción explícita con --adopt-existing-schema.");
            await db.Database.MigrateAsync();
        }
        finally { await db.Database.CloseConnectionAsync(); }
    }

    // Ejecutar con la API antigua detenida y una copia verificada. Nunca altera datos comerciales.
    public static async Task AdoptExistingAsync(AppDbContext db)
    {
        if (!db.Database.IsRelational()) throw new InvalidOperationException("La adopción requiere MySQL.");
        await db.Database.OpenConnectionAsync();
        try
        {
            if ((await db.Database.GetAppliedMigrationsAsync()).Any())
                throw new InvalidOperationException("La BD ya tiene migraciones registradas; no se adopta nuevamente.");
            await VerifyLegacySchemaAsync(db);
            var initial = db.Database.GetMigrations().First();
            var history = db.GetService<IHistoryRepository>();
            await db.Database.ExecuteSqlRawAsync(history.GetCreateIfNotExistsScript());
            await db.Database.ExecuteSqlRawAsync(history.GetInsertScript(new HistoryRow(initial, ProductInfo.GetVersion())));
        }
        finally { await db.Database.CloseConnectionAsync(); }
    }

    private static async Task VerifyLegacySchemaAsync(AppDbContext db)
    {
        var assembly = db.GetService<IMigrationsAssembly>();
        var first = assembly.Migrations.OrderBy(pair => pair.Key).First();
        var baseline = assembly.CreateMigration(first.Value, db.Database.ProviderName!).TargetModel;
        var model = db.GetService<IModelRuntimeInitializer>().Initialize(baseline, designTime: true).GetRelationalModel();
        var expectedColumns = model.Tables.SelectMany(table => table.Columns.Select(column => new {
            Key = table.Name + "." + column.Name, column.StoreType, column.IsNullable,
            Identity = column.PropertyMappings.Any(mapping => mapping.Property.ClrType == typeof(int) && mapping.Property.ValueGenerated == ValueGenerated.OnAdd),
            Default = column.PropertyMappings.Select(mapping => mapping.Property.FindAnnotation(RelationalAnnotationNames.DefaultValue)?.Value?.ToString()).FirstOrDefault(value => value != null)
        })).ToDictionary(column => column.Key);
        var tables = await ReadAsync(db, "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' AND TABLE_NAME<>'__EFMigrationsHistory'");
        if (!tables.Select(row => row[0]).ToHashSet().SetEquals(model.Tables.Select(table => table.Name)))
            throw new InvalidOperationException("Las tablas no corresponden al esquema inicial esperado.");
        var columns = await ReadAsync(db, "SELECT CONCAT(TABLE_NAME,'.',COLUMN_NAME),LOWER(COLUMN_TYPE),IS_NULLABLE,EXTRA,COALESCE(COLUMN_DEFAULT,'<null>'),COALESCE(CHARACTER_SET_NAME,'') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME<>'__EFMigrationsHistory'");
        if (columns.Count != expectedColumns.Count) throw new InvalidOperationException("El número de columnas difiere del esquema inicial.");
        foreach (var row in columns)
        {
            if (!expectedColumns.TryGetValue(row[0], out var column) || row[1] != column.StoreType.ToLowerInvariant()
                || (row[2] == "YES") != column.IsNullable || row[3].Contains("auto_increment") != column.Identity
                || row[4] != (column.Default ?? "<null>") || (row[5] != "" && row[5] != "utf8mb4"))
                throw new InvalidOperationException("Columna incompatible con el esquema inicial: " + row[0]);
        }
        var expectedIndexes = model.Tables.SelectMany(table => table.Indexes.Select(index =>
            table.Name + "|" + index.Name + "|" + (index.IsUnique ? "0" : "1") + "|" + string.Join(",", index.Columns.Select(column => column.Name)))
            .Append(table.Name + "|PRIMARY|0|" + string.Join(",", table.PrimaryKey!.Columns.Select(column => column.Name)))).ToHashSet();
        var indexes = await ReadAsync(db, "SELECT TABLE_NAME,INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME<>'__EFMigrationsHistory' GROUP BY TABLE_NAME,INDEX_NAME,NON_UNIQUE");
        if (!expectedIndexes.SetEquals(indexes.Select(row => string.Join("|", row))))
            throw new InvalidOperationException("Los índices o claves primarias difieren del esquema inicial.");
        var expectedForeignKeys = model.Tables.SelectMany(table => table.ForeignKeyConstraints.Select(fk =>
            table.Name + "|" + string.Join(",", fk.Columns.Select(column => column.Name)) + "|" + fk.PrincipalTable.Name + "|" + string.Join(",", fk.PrincipalColumns.Select(column => column.Name)) + "|" + fk.OnDeleteAction.ToString().ToUpperInvariant())).ToHashSet();
        var foreignKeys = await ReadAsync(db, "SELECT k.TABLE_NAME,k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL");
        if (!expectedForeignKeys.SetEquals(foreignKeys.Select(row => string.Join("|", row))))
            throw new InvalidOperationException("Las relaciones o reglas de borrado difieren del esquema inicial.");
    }

    private static async Task<List<string[]>> ReadAsync(AppDbContext db, string sql)
    {
        await using DbCommand command = db.Database.GetDbConnection().CreateCommand(); command.CommandText = sql;
        await using var reader = await command.ExecuteReaderAsync(); var rows = new List<string[]>();
        while (await reader.ReadAsync()) rows.Add(Enumerable.Range(0, reader.FieldCount).Select(i => Convert.ToString(reader.GetValue(i), System.Globalization.CultureInfo.InvariantCulture) ?? "").ToArray());
        return rows;
    }
}
