#!/bin/bash
set -e

echo "=========================================================="
echo "    Iniciando Leart Store (ASP.NET Core 9 + MySQL)        "
echo "=========================================================="

# Si no se pasó una cadena de conexión a otro servidor remoto, usar el MySQL/MariaDB interno
DB_CONN="${ConnectionStrings__DefaultConnection}"

if [ -z "$DB_CONN" ] || [[ "$DB_CONN" == *"localhost"* ]] || [[ "$DB_CONN" == *"127.0.0.1"* ]]; then
    echo "==> Preparando servidor MySQL/MariaDB interno..."
    mkdir -p /var/lib/mysql /var/run/mysqld /app/wwwroot/uploads/products /app/wwwroot/uploads/orders
    chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

    if [ ! -d "/var/lib/mysql/mysql" ]; then
        echo "==> Inicializando directorio de datos de MySQL..."
        mariadb-install-db --user=mysql --datadir=/var/lib/mysql > /dev/null 2>&1 || true
    fi

    echo "==> Arrancando MySQL en segundo plano..."
    mysqld_safe --datadir=/var/lib/mysql --nowatch > /dev/null 2>&1 &

    echo "==> Esperando a que MySQL responda..."
    for i in {1..30}; do
        if mariadb-admin ping --silent 2>/dev/null; then
            echo "==> MySQL listo en el intento $i."
            break
        fi
        sleep 1
    done

    echo "==> Verificando base de datos leart_db y permisos de usuario..."
    mariadb -u root -e "CREATE DATABASE IF NOT EXISTS leart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    mariadb -u root -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'root';" 2>/dev/null || true
    mariadb -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;" 2>/dev/null || true
    mariadb -u root -e "CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';" 2>/dev/null || true
    mariadb -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;" 2>/dev/null || true
    mariadb -u root -e "FLUSH PRIVILEGES;" 2>/dev/null || true
    echo "==> MySQL configurado exitosamente con base de datos 'leart_db'."
fi

echo "==> Iniciando backend ASP.NET Core 9 y frontend Angular..."
exec dotnet Leart.Api.dll
