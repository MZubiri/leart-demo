# Leart Store — Fullstack (Angular 21 + ASP.NET Core 9 + MySQL)

Tienda y cotizador web para Leart Store con backend en ASP.NET Core (.NET 9), base de datos en MySQL y Panel de Administración integrado.

Incluye:
- **Catálogo de 5 líneas**: Cuadros, Sets armables, Cajas acrílicas, Llaveros y Minifiguras.
- **Cotizador guiado en 3 pasos** con validación de capacidad de figuras y mascotas.
- **Número de WhatsApp 100% configurable en tiempo real desde el Panel Admin**.
- **Panel Administrativo (`/admin`)**:
  - Configuración del número de WhatsApp, barra de anuncios, redes y plantillas de chat.
  - CRUD de productos del catálogo con subida de imágenes y activación/pausa inmediata.
  - Bandeja de pedidos de personalización post-pago con visor y descarga de fotos de referencia adjuntas.
- **Formulario post-pago (`/personalizacion`)** con almacenamiento de imágenes adjuntas en servidor/MySQL.

---

## 🔐 Acceso al Panel de Administración

* **Ruta**: `/admin/login` (o desde el enlace discreto en el pie de página).
* **Usuario inicial**: `admin`
* **Contraseña inicial**: `Leart2026!`

---

## 🚀 Despliegue con Docker Compose (Recomendado / Coolify)

El repositorio incluye un `docker-compose.yml` que orquesta la base de datos MySQL 8.0, la API en ASP.NET Core 9 y el frontend Angular con proxy inverso en Nginx:

```bash
docker compose up -d --build
```

* **Frontend y Tienda**: `http://localhost` (puerto 80).
* **Backend API**: `http://localhost:5000/api`
* **Base de datos MySQL**: `localhost:3306` (`user: root`, `password: root`, `database: leart_db`).

---

## 💻 Desarrollo Local

### 1. Iniciar Base de Datos MySQL
Puedes usar una instancia local de MySQL o levantar solo el contenedor de MySQL:

```bash
docker compose up -d mysql
```

### 2. Iniciar Backend (ASP.NET Core 9)

```bash
cd backend/Leart.Api
dotnet run
```
La API arrancará en `http://localhost:5000` y creará automáticamente las tablas y datos iniciales en MySQL al primer inicio.

### 3. Iniciar Frontend (Angular 21)

```bash
npm install
npm start
```
La aplicación quedará disponible en `http://localhost:4200` y se conectará automáticamente al backend en `http://localhost:5000/api`.

---

## 📱 Configuración del Número de WhatsApp

1. Inicia sesión en `/admin/login`.
2. Ve a la sección **"WhatsApp y Ajustes"** (`/admin/configuracion`).
3. En el campo **"Número Oficial de WhatsApp"**, ingresa el número con código de país (ejemplo: `573001234567`).
4. Haz clic en **"Guardar Configuración"**.
5. ¡Listo! Todos los botones de "Cotizar", "Enviar por WhatsApp" y enlaces de la tienda se actualizarán de inmediato sin necesidad de recompilar.
