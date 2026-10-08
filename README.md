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
* **Usuario inicial**: `admin`
* **Contraseña inicial**: `Leart2026!`
* **Cambio de clave**: Disponible en `/admin/configuracion` > *Seguridad de la Cuenta*.

---

## 💻 Desarrollo Local

### 1. Iniciar Base de Datos MySQL
Puedes usar una instancia local de MySQL (puerto 3306) o levantar el contenedor de MySQL:

```bash
docker compose up -d mysql
```

*Configuración local*: El backend lee [appsettings.Development.json](backend/Leart.Api/appsettings.Development.json). Si tu MySQL local usa una contraseña diferente, ajústala allí.

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
* **Backend API**: `http://localhost:5000/api`
* **Base de datos MySQL**: `localhost:3306` (`user: root`, `password: root`, `database: leart_db`).

### Opción 2: Contenedor Autónomo Todo-en-Uno (Coolify / Single VPS)
Si prefieres un solo contenedor que incluya MariaDB + .NET 9 + Angular en el mismo proceso:

```bash
docker build -t leart-store -f Dockerfile .
docker run -d -p 80:80 --name leart-store leart-store
```

---

## 📱 Configuración del Número de WhatsApp

1. Inicia sesión en `/admin/login`.
2. Ve a la sección **"WhatsApp y Ajustes"** (`/admin/configuracion`).
3. En el campo **"Número Oficial de WhatsApp"**, ingresa el número con código de país (ejemplo: `573001234567`).
4. Haz clic en **"Guardar Configuración"**.
5. ¡Listo! Todos los botones de "Cotizar", "Enviar por WhatsApp" y enlaces de la tienda se actualizarán de inmediato sin necesidad de recompilar.
