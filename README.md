# Leart Store Demo

Frontend demostrativo para Leart Store, construido con Angular 21. Incluye catálogo, fichas de producto, personalizador visual, carrito persistente y generación de cotizaciones para WhatsApp.

## Desarrollo local

```bash
npm ci
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

## Build de producción

```bash
npm run build
```

Los archivos estáticos se generan en `dist/leart-demo/browser`.

## Despliegue en Coolify

El repositorio incluye un `Dockerfile` multi-stage y una configuración Nginx con fallback para las rutas de Angular.

1. Crear un nuevo recurso desde este repositorio.
2. Seleccionar **Dockerfile** como método de construcción.
3. Usar el puerto interno `80`.
4. Configurar el dominio y desplegar.

No requiere variables de entorno, base de datos ni backend. El carrito se almacena en `localStorage` del navegador.
