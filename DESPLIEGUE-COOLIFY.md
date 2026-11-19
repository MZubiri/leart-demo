# Operación y despliegue de Leart

## Instalación publicada

- Sitio: <https://leart.molinazdev.lat>.
- Panel: <https://leart.molinazdev.lat/admin/login>.
- Coolify: proyecto **Leart**, entorno **production**.
- Aplicación: `fss36gdokz4tsu48mr01nojp`, repositorio `MZubiri/leart-demo`, rama `main`.
- Commit publicado: [78aa5c55eb3deae351c08b638dde339724ac0edc](https://github.com/MZubiri/leart-demo/commit/78aa5c55eb3deae351c08b638dde339724ac0edc).
- Despliegue: `wihxvmhsr5zih0oeza0giiw7`.
- [CI del candidato](https://github.com/MZubiri/leart-demo/actions/runs/44453268067): frontend y backend/infraestructura completados con éxito.

Se usa el [Dockerfile fullstack](Dockerfile), construido para ARM64. La aplicación escucha
en el puerto interno **8080** y se ejecuta como usuario `app`. Coolify termina HTTPS y
dirige el tráfico a ese puerto. Las etiquetas del proxy también deben indicar 8080;
cambiar solo el campo de puertos no actualizaba las etiquetas guardadas de esta instalación.

## Persistencia y configuración

| Recurso | Ubicación |
| --- | --- |
| MySQL 8.4, privado | Recurso `leart-mysql`, UUID `osz5cug30h5gupv07f6c8aqf`; BD `leart_db`, usuario limitado `leart` |
| Fotos públicas de productos | Volumen `fss36gdokz4tsu48mr01nojp-uploads` → `/app/wwwroot/uploads` |
| Fotos privadas de pedidos | Volumen `fss36gdokz4tsu48mr01nojp-private` → `/app/storage` |
| Tarifas | Tabla `PricingConfigurations`, fila 1, columna JSON `RulesJson` |

MySQL no publica un puerto hacia Internet. La aplicación no contiene un servidor de BD.
Los dos directorios de archivos pertenecen al UID 1654. Recrear la aplicación debe
mantener estos volúmenes y la conexión al recurso MySQL existente.

Las variables de ejecución están en Coolify, sin habilitarlas durante la compilación:

- `ConnectionStrings__DefaultConnection`: conexión al MySQL privado como `leart`.
- `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`.
- `ASPNETCORE_ENVIRONMENT=Production`, `ASPNETCORE_URLS=http://+:8080`.
- `ReverseProxy__KnownProxies__0`: IP interna del proxy confiable. Revisarla si se recrea
  la red o el proxy; no aceptar indiscriminadamente cabeceras enviadas por clientes.

No se guardaron variables `BootstrapAdmin__*` permanentes en Coolify. La clave inicial
publicada fue reemplazada mediante el comando explícito de restablecimiento. El acceso
nuevo se entregó en un archivo local protegido, fuera del repositorio; no copiarlo aquí.

## Actualizaciones posteriores

1. Revisar [AUDITORIA-Y-ROADMAP.md](AUDITORIA-Y-ROADMAP.md) y registrar el avance.
2. Ejecutar las pruebas y comprobar CI para el commit que se va a publicar.
3. Guardar una copia coherente de BD, uploads y archivos privados, además de la
   configuración de Coolify y el identificador de la imagen actual.
4. Comprobar las migraciones en una copia. Una BD antigua sin historial requiere la
   adopción explícita documentada en [README.md](README.md); no sellar un esquema incompatible.
5. Desplegar desde la aplicación existente, conservando MySQL, volúmenes y variables.
   Si hay preparación de datos, pausar antes el despliegue automático y restaurarlo al terminar.
6. Esperar `/health/ready` con HTTP 200 y cuerpo `Healthy`. Coolify tiene una ventana
   inicial de 90 segundos y cinco reintentos. `/health/live` solo comprueba el proceso.
7. Verificar catálogo, tarifas, login, panel, acceso privado y ausencia de errores JS.
   Registrar commit, despliegue, resultado y cualquier pendiente en la bitácora.

Las migraciones de esquema se aplican al arrancar. La carga inicial de catálogo y
tarifas conserva los datos ya administrados; editar los recursos iniciales del código
no actualiza automáticamente una BD existente. Las nuevas tarifas se gestionan en la BD
según [README.md](README.md#tarifas-y-capacidades).

## Copias y recuperación de esta actualización

Se guardaron copias protegidas locales y en la VPS:

- VPS: `/data/coolify/backups/leart/20261119T032713Z/`.
- Copia local: directorio `respaldos/leart/20261119T032713Z/` dentro de la carpeta de
  accesos de la VPS proporcionada por el usuario.

La copia anterior incluye SQL de MariaDB, uploads, configuración original, comprobación
de filas e inventario. `database-cutover.sql` se tomó con el backend antiguo detenido;
se verificó que los datos originales no cambiaron durante la preparación. Se conservó
la imagen de emergencia `leart-rollback:20261119`.

La copia posterior incluye `database-after.sql`, `uploads-after.tar.gz`,
`private-after.tar.gz` y `SHA256SUMS-after`, comprobados con SHA-256. Contiene el esquema
MySQL ya migrado, las tarifas simuladas y el acceso actualizado. Los archivos privados
del respaldo incluyen información sensible y no deben publicarse ni entrar en Git.

Para recuperar, restaurar primero en una **BD y volúmenes nuevos**, comprobar sumas y
datos, y validar allí la imagen correspondiente antes de apuntar el dominio. No ejecutar
el SQL sobre una instalación con datos posteriores sin conservarlos primero. Volver a
la imagen antigua exige también su MariaDB y configuración compatibles; no dirigirla
sin más al MySQL migrado ni eliminar migraciones para simular un rollback.

Los [scripts de copia](scripts/backup.sh) y [restauración](scripts/restore.sh) del repositorio
usan el Compose local. Para esta instalación de Coolify se deben seleccionar sus recursos
y volúmenes concretos. La periodicidad, retención y copia fuera de la VPS deben definirse
en la operación continua; esta entrega deja los puntos de recuperación de la actualización.

## Alcance comercial vigente

Los precios son simulados y están identificados como tales; permanecen en MySQL.
Hay 75 productos conservados, de los que 74 estaban activos al desplegar. No se reactivó
el producto que había sido deshabilitado en administración.

El WhatsApp guardado era un número de ejemplo. Hasta configurar el número real, la UI
impide enviar la cotización a ese destino. El número puede guardarse desde el panel de
configuración; los precios comerciales definitivos también siguen pendientes de validación.
