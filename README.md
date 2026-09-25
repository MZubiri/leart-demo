# Leart Store Demo

Frontend para Leart Store, construido con Angular 21. Incluye las cinco líneas del negocio (cuadros, sets, cajas acrílicas, llaveros y minifiguras), fichas de producto, cotizador guiado y generación de solicitudes para WhatsApp.

El recorrido comercial es: explorar → cotizar por WhatsApp → confirmar pago → completar la información de personalización → aprobar → producir y enviar. La ruta `/personalizacion` prepara la información posterior al pago y el cliente adjunta sus fotografías en WhatsApp.

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

No requiere variables de entorno, base de datos ni backend. La selección para cotizar se almacena en `localStorage` del navegador.
