#!/bin/bash
set -e

echo "=========================================================="
echo "    Iniciando Leart Store (ASP.NET Core 9 + MariaDB)      "
echo "=========================================================="

DB_CONN="${ConnectionStrings__DefaultConnection:-}"
: "${Jwt__Secret:?Configure Jwt__Secret}"
: "${ConnectionStrings__DefaultConnection:?Configure ConnectionStrings__DefaultConnection}"

if [ -z "$DB_CONN" ] || [[ "$DB_CONN" == *"localhost"* ]] || [[ "$DB_CONN" == *"127.0.0.1"* ]]; then
    echo "==> Configurando servidor MariaDB/MySQL interno..."
    mkdir -p /var/lib/mysql /var/run/mysqld /app/wwwroot/uploads/products /app/wwwroot/uploads/orders
    chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

    # Inicializar datos si no existen
    if [ ! -d "/var/lib/mysql/mysql" ]; then
        echo "==> Inicializando base de datos del sistema MySQL/MariaDB..."
        mysql_install_db --user=mysql --datadir=/var/lib/mysql || true
    fi

    # Arrancar MariaDB con el servicio del sistema Debian
    echo "==> Levantando MariaDB..."
    /etc/init.d/mariadb start || mysqld_safe --user=mysql --datadir=/var/lib/mysql &

    # Esperar hasta que responda
    echo "==> Esperando respuesta del servidor MariaDB..."
    for i in {1..30}; do
        if mariadb-admin ping --silent 2>/dev/null; then
            echo "==> MariaDB listo y respondiendo en el intento $i."
            break
        fi
        sleep 1
    done

    # Cuenta exclusiva de esta base; las credenciales internas deben ser aleatorias.
    if [[ ! "${MYSQL_PASSWORD:-}" =~ ^[a-zA-Z0-9_-]{24,}$ ]]; then
        echo "Configure MYSQL_PASSWORD con al menos 24 caracteres aleatorios (openssl rand -hex 32)." >&2
        exit 1
    fi
    mariadb --protocol=socket <<SQL
CREATE DATABASE IF NOT EXISTS leart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'leart'@'127.0.0.1' IDENTIFIED BY '$MYSQL_PASSWORD';
ALTER USER 'leart'@'127.0.0.1' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON leart_db.* TO 'leart'@'127.0.0.1';
CREATE USER IF NOT EXISTS 'leart'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';
ALTER USER 'leart'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON leart_db.* TO 'leart'@'localhost';
SQL

fi

echo "==> Iniciando aplicación Leart (ASP.NET Core 9 Web API + Angular)..."
cd /app
exec dotnet Leart.Api.dll
