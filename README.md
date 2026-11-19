# Leart Store — Fullstack (Angular 21 + ASP.NET Core 10 + MySQL)

Tienda y cotizador web para Leart Store con backend en ASP.NET Core (.NET 10), base de datos en MySQL y Panel de Administración integrado.

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

### 2. Iniciar Backend (ASP.NET Core 10)

```bash
cd backend/Leart.Api
dotnet run
```
La API arrancará en `http://localhost:5000` y inicializará el catálogo solo en una base nueva. Los reinicios conservan ediciones, pausas y eliminaciones, incluso si se vacía todo el catálogo. Las futuras actualizaciones de datos deben ser explícitas y versionadas; no se sincroniza el catálogo administrado con el código al arrancar.

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
Orquesta MySQL 8.4, API .NET 10 y Frontend Nginx con proxy inverso integrado:

```bash
docker compose up -d --build
```

* **Frontend y Tienda**: `http://localhost` (puerto 80).
* **Backend API**: `/api`, mediante el proxy del frontend.
* **MySQL**: red interna, base `leart_db`, usuario `leart` y contraseña propia de `.env`.

### Opción 2: runtime web con MySQL externo

La imagen raíz sirve Angular y API, usa el usuario sin privilegios `app` (UID 1654)
y requiere un MySQL externo. No contiene un servidor de BD. Configura un archivo local
`.env.runtime` con conexión limitada, JWT y bootstrap. Los dos montajes son obligatorios:

```bash
docker build -t leart-store -f Dockerfile .
docker run -d -p 80:8080 --env-file .env.runtime --mount source=leart_uploads,target=/app/wwwroot/uploads --mount source=leart_private,target=/app/storage --name leart-store leart-store
```

Para instalaciones de la imagen antigua con MariaDB embebido, **antes de reemplazarla**
exporta su BD con mysqldump y copia uploads y almacenamiento privado a un destino seguro.
No elimines el contenedor antiguo hasta comprobar la restauración en un MySQL externo.
Los volúmenes creados anteriormente por root requieren una migración de propietario
al UID/GID 1654 sobre esos volúmenes concretos, con el backend detenido y copia previa.

### Copias y restauración verificables

Compose mantiene los volúmenes de MySQL, uploads públicos y fotos privadas. Recrear
contenedores conserva sus datos; `docker compose down -v` sí los elimina.
No borres volúmenes al actualizar. Para otros puertos usa `HTTP_BIND` y `HTTP_PORT`.

```bash
# En el proyecto que se quiere respaldar; requiere servicios construidos y MySQL activo.
bash scripts/backup.sh /ruta/segura/copia-nueva
# En una instalación nueva, con su propio .env y nombre de proyecto explícito:
COMPOSE_PROJECT_NAME=leart_restore bash scripts/restore.sh /ruta/segura/copia-nueva
docker compose -p leart_restore up -d
```

La copia detiene temporalmente la API para alinear registros y archivos, la reactiva si
estaba corriendo, usa permisos privados y crea sumas SHA-256. Debe protegerse/cifrarse
fuera del servidor y verificarse periódicamente. La restauración valida las sumas y se
niega a escribir en proyectos que ya tengan volúmenes. Conserva la copia hasta revisar
pedidos, fotos y catálogo. Si falla, examina el proyecto nuevo; no sobrescribas uno vivo.
Las credenciales de bootstrap y JWT se suministran aparte y no se incluyen en la copia.

---

## 📱 Configuración del Número de WhatsApp

1. Inicia sesión en `/admin/login`.
2. Ve a la sección **"WhatsApp y Ajustes"** (`/admin/configuracion`).
3. En el campo **"Número Oficial de WhatsApp"**, ingresa el número con código de país (ejemplo: `573001234567`).
4. Haz clic en **"Guardar Configuración"**.
5. ¡Listo! Todos los botones de "Cotizar", "Enviar por WhatsApp" y enlaces de la tienda se actualizarán de inmediato sin necesidad de recompilar.

## Almacenamiento de fotografías

Las imágenes del catálogo son públicas. Las fotos de pedidos se guardan en `storage/orders` (configurable con `Storage__Root`) y solo se descargan mediante la API administrativa autenticada. Compose monta `private_data` en `/app/storage`. Incluye este volumen y `uploads_data` junto a MySQL en las copias de seguridad. En el primer arranque se trasladan los archivos antiguos de `wwwroot/uploads/orders` a almacenamiento privado; si hay una colisión con contenido distinto, el inicio se detiene para revisión. Las URLs públicas antiguas devuelven 404.

## Límites de recepción

El login admite 5 intentos por IP y minuto; el formulario público admite 10 envíos por IP y hora. La API limita a 16 peticiones concurrentes y devuelve 429 con Retry-After al excederlos. Las fotos privadas tienen una cuota total inicial de 1 GiB, configurable con `Storage__MaxOrderBytes`. El almacenamiento local está previsto para una única instancia de API; varias instancias requieren límites y cuota compartidos. Si hay un proxy, configura únicamente sus IP confiables mediante `ReverseProxy__KnownProxies__0`, etc.; no se aceptan cabeceras de IP de clientes arbitrarios. Sin esa configuración, los clientes detrás del mismo proxy comparten el límite. El formulario es público y la referencia no verifica un pago: la confirmación comercial sigue en manos de la tienda.

Las nuevas fotos se validan mediante decodificación real con SkiaSharp (MIT), se normalizan a PNG y se eliminan sus metadatos originales. Se admiten JPEG, PNG y WebP estáticos de hasta 5 MiB, 4096 píxeles por lado y 12 megapíxeles; el resultado normalizado también debe caber en 5 MiB. La API limita a dos decodificaciones simultáneas. PDF, SVG, GIF, archivos dañados y animaciones se rechazan. Los adjuntos históricos conservan su contenido y acceso privado.

Al eliminar un pedido se borran sus fotos; si el almacenamiento falla, se conserva su metadata y se devuelve 503 para reintentar. El borrado de un archivo ya ausente es idempotente. Un proceso revisa cada 12 horas los archivos privados sin referencia en BD y elimina solo los de más de 24 horas. No elimina archivos vinculados a pedidos y no ejecuta limpieza si falla la consulta a BD. Las copias de seguridad tienen su propia política de retención, a cargo del operador.

## Tarifas y capacidades

La matriz vigente está persistida en MySQL: tabla `PricingConfigurations`, fila `Id = 1`, columna JSON `RulesJson`. La migración crea la tabla y el arranque carga una sola vez los valores iniciales de [pricing-rules.json](backend/Leart.Api/Data/pricing-rules.json), incorporado en el ensamblado como recurso de inicialización. No sobrescribe una matriz existente. Cada petición a `/api/public/pricing` consulta esa fila, sin caché ni fallback al archivo. El frontend usa la respuesta HTTP; si faltan las reglas o falla la BD, la API devuelve 503 y no se permite confirmar una configuración. Cantidades y extras respetan el producto y la presentación.

Por autorización del usuario se cargan **precios simulados de demostración en COP**, con `version = 2` y `simulated = true`. Se conservan los importes de referencia anteriores y se completan cuadro M/1 figura a **116.000**, L/1 a **146.000** y L/2 a **168.000**. El desglose identifica el precio simulado. Son datos de la BD utilizados por el cotizador real; no son tarifas comerciales aprobadas. Los precios base de los productos también permanecen en `Products.BasePrice` y se administran desde el panel.

Para cambiar una tarifa desde la BD, por ejemplo, ejecutar en la instancia correspondiente:

```sql
UPDATE PricingConfigurations
SET RulesJson = JSON_SET(RulesJson, '$.frames.M."1"', 117000), UpdatedAt = UTC_TIMESTAMP(6)
WHERE Id = 1;
```

La siguiente consulta HTTP y una recarga de la página utilizan el valor guardado. El cambio persiste al reiniciar API/MySQL; editar el recurso inicial no actualiza una BD ya inicializada. Al publicar tarifas reales, revisar toda la matriz, sus capacidades y los precios base de productos, aumentar `version` y establecer `simulated = false` en la misma fila. Si se cambia la tarifa base de referencia de un producto, actualizar también su `Products.BasePrice`: una discrepancia o precio base vacío mantiene **A cotizar**, evitando ignorar una edición administrativa. Los accesorios sin tarifa definida quedan excluidos del estimado y el valor final se confirma por WhatsApp.

## Plataforma y dependencias

Se requiere .NET 10 LTS y MySQL 8.0 o posterior (Compose usa MySQL 8.4 LTS).
No se soporta MariaDB con el proveedor Oracle. EF Core y paquetes Microsoft se alinean
en 10.0.15. [Soporte .NET](https://dotnet.microsoft.com/en-us/platform/support/policy)
y [compatibilidad MySQL](https://dev.mysql.com/doc/connector-net/en/connector-net-entityframework-core.html).
El proveedor [MySql.EntityFrameworkCore](https://www.nuget.org/packages/MySql.EntityFrameworkCore/10.0.12)
se distribuye bajo GPL-2.0-only WITH Universal-FOSS-exception-1.0 (antes Pomelo MIT).
Antes de distribuir una aplicación derivada, revisar las condiciones de esa licencia
y de sus dependencias para el modelo de distribución del proyecto.

Validación de dependencias del 2026-11-18: Angular 21.2.26, Playwright 1.65.1;
`npm audit --omit=dev` y auditoría NuGet transitiva sin avisos. La auditoría npm completa
mantiene 16 paquetes de herramientas afectados por **dos** avisos moderados transitivos:
[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) y
[minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), sobre consumo de recursos
al recorrer archivos/patrones. Se ejecutan sobre el código local durante desarrollo,
no se incluyen en la SPA. Usar código y patrones de compilación confiables y seguir
los parches de Angular CLI; no se forzaron versiones mayores incompatibles transitivas.
No quedan avisos altos o críticos. Repetir estas auditorías antes de publicar: los
resultados dependen de la fecha y del registro consultado.

## Migraciones y salud

Las bases nuevas se crean con migraciones EF versionadas. El arranque se detiene si
la BD o el esquema no están preparados; no sirve pedidos en un modo ficticio.
`/health/live` comprueba el proceso y `/health/ready` consulta la BD y el esquema,
respondiendo 503 si falla. El proxy publica ambas rutas sin caché.

Para una BD anterior creada con EnsureCreated, primero haz una copia y detén todas
las instancias antiguas de la API. Ejecuta una sola vez, con la configuración de esa BD:

```bash
dotnet run --project backend/Leart.Api -- --adopt-existing-schema
# En Compose, con el backend detenido:
docker compose run --rm --no-deps backend --adopt-existing-schema
```

El comando verifica tablas, tipos, longitudes, nulabilidad, charset, valores por defecto,
claves primarias, índices y relaciones contra la migración inicial. Si difieren, termina
sin registrar la línea base: revisar la diferencia sobre una copia; nunca borrar datos
para forzarla. Si coinciden, registra únicamente esa migración y termina sin servir HTTP.
El siguiente arranque aplica las migraciones posteriores conservando datos y catálogo.
MySQL usa DDL con commits implícitos: mantener la copia y usar una sola instancia para
aplicar cambios. Verificar readiness y datos antes de reabrir tráfico.

Para crear futuras migraciones usa dotnet-ef 10.0.15; la fábrica de diseño no conecta a
una BD ni lee secretos. Revisar el SQL generado y ensayarlo sobre una copia antes de aplicar.

## Verificación antes de integrar cambios

Usar Node de [.nvmrc](.nvmrc), npm 11.6.2 y SDK de [global.json](global.json).
[CI](.github/workflows/ci.yml) ejecuta instalación limpia, pruebas y compilación,
auditorías de dependencias y regresiones reales de infraestructura sin secretos reales.
Los avisos altos/críticos de NuGet bloquean restore; npm producción bloquea desde
moderado y herramientas desde alto. Los avisos residuales se describen arriba.

```bash
npm ci
npm test -- --watch=false
npm run build
dotnet test backend/Leart.Api.Tests
# Requieren Docker; crean y retiran únicamente sus propios servicios de prueba:
node scripts/test-mysql.cjs
node scripts/test-nginx.cjs
node scripts/test-backup.cjs
```

La integración MySQL figura omitida en el comando de tests estándar y la ejecuta
explícitamente su runner. Las pruebas incluyen privacidad/revocación, límites y
compensación de adjuntos, catálogo tras reinicio, contratos, precios, variantes,
errores de envío y migración de BD anterior. VS Code ofrece tareas de pruebas sin
abrir el antiguo puerto Karma. Los generadores Angular vuelven a crear tests por defecto.
El workflow solo se ejecutará en GitHub después de publicar estos commits.

## Consultas administrativas acotadas

`GET /api/admin/orders?status=Todos&page=1&pageSize=20` devuelve
`{items,page,pageSize,total}`. pageSize admite 1–100, page 1–100000; el orden es
CreatedAt/Id descendente. Los elementos contienen conteo de fotos, sin historias ni
adjuntos. `GET /api/admin/orders/{id}` carga el detalle autorizado bajo demanda.
`GET /api/admin/orders/dashboard` devuelve conteos agregados y cinco resúmenes recientes.

La migración OrderListIndexes agrega índices por CreatedAt/Id y Status/CreatedAt/Id.
EXPLAIN con 10.000 pedidos sintéticos, estadísticas actualizadas y LIMIT20: ambas
consultas pasaron de filesort a backward index scan. Es evidencia local del plan,
no una estimación de latencia productiva. Las páginas profundas aún usan OFFSET;
medir su uso real antes de plantear paginación por cursor.

## Activos gráficos y medición

`npm start`, `npm test` y `npm run build` generan variantes WebP de320/640/1280px
(sin ampliar originales pequeños) mediante Sharp, conservando las fotografías fuente.
Los resultados y el manifiesto son reproducibles y están ignorados por Git. No omitir
las dependencias de desarrollo durante la construcción: Sharp solo se usa al construir.
El frontend reserva dimensiones, ofrece srcset/sizes y difiere imágenes fuera de pantalla;
hero y foto principal de producto tienen prioridad. Las imágenes subidas mantienen su URL.
Los archivos generados llevan hash de fuente/encoder; solo esos activos y bundles con
hash usan caché immutable. Activos mutables se revalidan; JS/CSS/SVG se comprimen.

`node scripts/measure-catalog.cjs` mide un build servido localmente con API controlada
y los75 productos iniciales. Requiere `npx playwright install chromium`.
Prueba del2026-11-18: Chromium, caché vacía,390×844 DPR1, latencia80ms y200000B/s:

| Métrica local | Antes | Después |
| --- | --- | --- |
| Bytes codificados de imágenes | 2.490.199 | 207.218 |
| Peticiones de imagen | 13 | 5 |
| LCP observado | 2.680ms | 2.780ms |

Se redujo aproximadamente91,7% la transferencia de imágenes. Una corrida por condición
no demuestra mejora de LCP; medir en hosting con datos reales de usuarios antes de
atribuir cambios de experiencia a estas optimizaciones. El script verifica además que
las imágenes solicitadas se decodifiquen correctamente.

## Teclado y diálogos

Cotizador, panel de cotización y diálogos de productos/pedidos gestionan el foco con
Angular CDK: foco inicial dentro del diálogo, ciclo Tab/Shift+Tab, Escape y retorno al
control de origen. Los cambios de paso conservan el foco dentro del cotizador. El fondo
queda inerte y el scroll se restaura al cerrar la última capa. El guardado/upload en
curso bloquea el cierre del editor para preservar el resultado de la operación.

Los contadores, estados, notas y cargas de imagen tienen nombres accesibles. Ocasión
del catálogo y del cotizador usan IDs distintos. Los enlaces sin contacto disponible
carecen de href y anuncian su estado deshabilitado.

```bash
npm run build
npx playwright install chromium
npm run test:keyboard
```

La regresión de Chromium verifica los tres pasos, transición al panel, incremento de
cantidad, creación/edición de productos, detalle de pedido, foco y teclado. Usa API
controlada para aislar la interfaz; las pruebas backend/MySQL y smoke del runtime
verifican por separado autorización, almacenamiento y migraciones. CI ejecuta ambas capas.
No equivale a una certificación completa de accesibilidad ni a pruebas con lectores de pantalla.
