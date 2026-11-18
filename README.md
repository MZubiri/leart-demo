# Leart Store — Fullstack (Angular 21 + ASP.NET Core 9 + MySQL)

Tienda y cotizador web para Leart Store con backend en ASP.NET Core (.NET 9), base de datos en MySQL y Panel de Administración integrado.

Incluye:
- **Catálogo de 5 líneas**: Cuadros, Sets armables, Cajas acrílicas, Llaveros y Minifiguras.
- **Cotizador guiado en 3 pasos** con validación en tiempo real de capacidad de figuras y mascotas.
- **Número de WhatsApp 100% configurable en tiempo real desde el Panel Admin**.
- **Panel Administrativo (`/admin`)**:
  - Configuración del número de WhatsApp, barra de anuncios, redes y plantillas de chat.
  - Cambio seguro de contraseña de administrador (`/admin/configuracion`).
  - CRUD de productos del catálogo con subida de imágenes y activación/pausa inmediata.
  - Bandeja de pedidos de personalización post-pago con visor y descarga de fotos de referencia adjuntas.
- **Formulario post-pago (`/personalizacion`)** con almacenamiento seguro de imágenes en servidor/MySQL.
- **Optimización de Rendimiento**: Carga perezosa (Lazy Loading) en todas las rutas con Angular 21 y compresión WebP para activos gráficos de alta resolución.
- **SEO & Redes Sociales**: Metadatos Open Graph, Twitter Cards y Schema.org JSON-LD para previsualización enriquecida en WhatsApp e Instagram.

---

## 🔐 Acceso al Panel de Administración

* **Ruta**: `/admin/login` (o desde el enlace discreto en el pie de página).
No hay credenciales predeterminadas. El primer inicio requiere las variables
`BootstrapAdmin__Username`, `BootstrapAdmin__Email` y `BootstrapAdmin__Password`
(contraseña nueva de al menos 12 caracteres, hasta 72 bytes). Retíralas después del alta.
El arranque normal conserva la cuenta existente.

Configura `Jwt__Secret` con una clave aleatoria nueva de al menos 32 bytes y
`ConnectionStrings__DefaultConnection` con un usuario limitado a la base de la aplicación.
Se rechazan las claves JWT publicadas anteriormente y las conexiones como root.
Genera valores independientes con `openssl rand -hex 32`; no los subas a Git.

Para una instalación existente, rota la clave JWT, cambia la cuenta de base de datos y
restablece la contraseña inicial publicada antes de habilitar el acceso. Con las variables
BootstrapAdmin configuradas para un administrador existente, ejecuta una sola vez:

```bash
dotnet run --project backend/Leart.Api -- --reset-admin-password
```

Este comando actualiza la contraseña y termina sin iniciar el servidor. La contraseña
inicial publicada ya no permite iniciar sesión. Retira después las variables de bootstrap.
* **Cambio posterior de clave**: `/admin/configuracion` > *Seguridad de la Cuenta*.

---

## 💻 Desarrollo Local

### 1. Iniciar Base de Datos MySQL
Puedes usar una instancia local de MySQL (puerto 3306) o levantar el contenedor de MySQL:

```bash
cp .env.example .env
# Completa .env con secretos nuevos y la cuenta inicial antes de continuar.
docker compose up -d mysql
```

El contenedor MySQL solo se expone en la red interna de Compose. Para desarrollo local, usa una instancia propia con el usuario limitado `leart`, o ejecuta también la API mediante Compose. Configura secretos mediante variables de entorno o `dotnet user-secrets`; los archivos de configuración versionados no contienen contraseñas.

### 2. Iniciar Backend (ASP.NET Core 9)

```bash
cd backend/Leart.Api
dotnet run
```
La API arrancará en `http://localhost:5000` y creará/sincronizará automáticamente las tablas y catálogo inicial en MySQL al primer inicio.

### 3. Iniciar Frontend (Angular 21)

```bash
npm install
npm start
```
La aplicación quedará disponible en `http://localhost:4200`. Utiliza `proxy.conf.json` para reenviar automáticamente las peticiones de `/api` y `/uploads` al backend en el puerto 5000 sin problemas de CORS ni rutas relativas rotas.

### 4. Ejecutar Pruebas Automatizadas

```bash
dotnet test backend/Leart.Api.Tests
```

---

## 🚀 Despliegue con Docker

### Opción 1: Docker Compose Multicontenedor (Recomendado)
Orquesta MySQL 8.0, API .NET 9 y Frontend Nginx con proxy inverso integrado:

```bash
docker compose up -d --build
```

* **Frontend y Tienda**: `http://localhost` (puerto 80).
* **Backend API**: `/api`, mediante el proxy del frontend.
* **MySQL**: red interna, base `leart_db`, usuario `leart` y contraseña propia de `.env`.

### Opción 2: Contenedor Autónomo Todo-en-Uno (Coolify / Single VPS)
Si prefieres el contenedor con MariaDB, configura un archivo local `.env.runtime` con `Jwt__Secret`, `ConnectionStrings__DefaultConnection` (usuario `leart` en `127.0.0.1`), `MYSQL_PASSWORD` y las variables `BootstrapAdmin__*`. Para este modo, la contraseña de MySQL debe ser aleatoria y alfanumérica de al menos 24 caracteres.

```bash
docker build -t leart-store -f Dockerfile .
docker run -d -p 80:80 --env-file .env.runtime --name leart-store leart-store
```

---

## 📱 Configuración del Número de WhatsApp

1. Inicia sesión en `/admin/login`.
2. Ve a la sección **"WhatsApp y Ajustes"** (`/admin/configuracion`).
3. En el campo **"Número Oficial de WhatsApp"**, ingresa el número con código de país (ejemplo: `573001234567`).
4. Haz clic en **"Guardar Configuración"**.
5. ¡Listo! Todos los botones de "Cotizar", "Enviar por WhatsApp" y enlaces de la tienda se actualizarán de inmediato sin necesidad de recompilar.

## Almacenamiento de fotografías

Las imágenes del catálogo son públicas. Las fotos de pedidos se guardan en `storage/orders` (configurable con `Storage__Root`) y solo se descargan mediante la API administrativa autenticada. Compose monta `private_data` en `/app/storage`. Incluye este volumen y `uploads_data` junto a MySQL en las copias de seguridad. En el primer arranque se trasladan los archivos antiguos de `wwwroot/uploads/orders` a almacenamiento privado; si hay una colisión con contenido distinto, el inicio se detiene para revisión. Las URLs públicas antiguas devuelven 404.
