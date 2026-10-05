#!/bin/bash
set -e

echo "=========================================================="
echo "    Iniciando Leart Store (ASP.NET Core 9 + MariaDB)      "
echo "=========================================================="

DB_CONN="${ConnectionStrings__DefaultConnection}"

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

    # Configurar base de datos y permisos de usuario
    echo "==> Configurando base de datos 'leart_db' y credenciales..."
    mariadb -e "CREATE DATABASE IF NOT EXISTS leart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || true
    mariadb -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;" || true
    mariadb -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY 'root' WITH GRANT OPTION;" || true
    mariadb -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY 'root' WITH GRANT OPTION;" || true
    mariadb -e "FLUSH PRIVILEGES;" || true
    echo "==> MariaDB configurado exitosamente."
fi

echo "==> Iniciando aplicación Leart (ASP.NET Core 9 Web API + Angular)..."
cd /app
exec dotnet Leart.Api.dll
