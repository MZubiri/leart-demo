# Auditoría técnica, roadmap y registro de avance

> **Documento vivo y registro central del trabajo.** Cada avance, validación, bloqueo o decisión sobre este roadmap debe quedar registrado aquí antes de cerrar la tarea o comunicarla como terminada. Las instrucciones completas están en [Cómo mantener este documento](#cómo-mantener-este-documento).

## 1. Contexto y alcance

- **Repositorio:** [MZubiri/leart-demo](https://github.com/MZubiri/leart-demo).
- **Fecha de la auditoría inicial:** 2026-11-18.
- **Commit auditado:** [`c4ab4d85a5e08669f53cdd04142d9b59e4bbb480`](https://github.com/MZubiri/leart-demo/commit/c4ab4d85a5e08669f53cdd04142d9b59e4bbb480).
- **Cobertura:** código, configuración, despliegue, pruebas, scripts y datos del catálogo; 225 archivos versionados y 75 productos iniciales.
- **Método:** revisión estática y comprobaciones en copias temporales, navegador, Nginx y MySQL locales desechables.
- **Límite:** los resultados describen ese commit y sus configuraciones declaradas. La configuración efectiva del hosting, el comportamiento bajo carga y las métricas reales de experiencia web quedan pendientes de validación.
- **Autorización actual:** el usuario autorizó implementar las correcciones una por una, validarlas y hacer un commit por corrección. Las mejoras opcionales siguen fuera del alcance hasta una decisión específica.

La auditoría inicial no modificó archivos del repositorio. Esta entrega agrega este informe y las instrucciones de seguimiento de [AGENTS.md](AGENTS.md); no implementa correcciones de la aplicación.

Las referencias a líneas corresponden al commit auditado. Si cambia un archivo, conservar la evidencia histórica y añadir en la bitácora la ubicación vigente y, cuando exista, el commit o PR de la corrección.

## 2. Diagnóstico y arquitectura

La demo compila, pero hay problemas que conviene resolver antes de usarla con pedidos y fotografías reales: credenciales públicas permiten administrar la aplicación, los adjuntos son accesibles sin autenticación y varios flujos pueden perder información o confirmar operaciones fallidas.

La arquitectura consiste en una SPA Angular con rutas diferidas y estado mediante signals, una API ASP.NET Core con controladores que acceden directamente a Entity Framework, MySQL y archivos en disco. Es una base razonable para este tamaño. Las principales dificultades están en la integridad de datos, las reglas comerciales duplicadas y la operación.

Las bases aprovechables incluyen tipado estricto en TypeScript, rutas diferidas, contraseñas almacenadas con BCrypt, autenticación de los controladores administrativos y consultas mediante Entity Framework. Estas medidas no compensan los problemas específicos descritos a continuación.

## 3. Validación inicial

Estos resultados son la línea base del 2026-11-18; no representan validaciones realizadas después de futuras correcciones.

| Comprobación | Resultado |
| --- | --- |
| Compilación Angular de producción | Correcta. Bundle inicial: 441,58 kB; transferencia comprimida estimada por el compilador: 107,78 kB. No es una medición de transferencia del hosting. |
| Pruebas del backend con SDK .NET 9 temporal | 4/4 pasan. Aparece un conflicto entre versiones de `EntityFrameworkCore.Relational`. |
| `npm test` | Falla: `Cannot determine project or target for command`. |
| Auditoría npm | 31 paquetes afectados: 2 críticos, 9 altos y 20 moderados. No equivalen a 31 vulnerabilidades distintas ni a 31 vías explotables en producción. |
| Auditoría NuGet | Aviso moderado en MySqlConnector 2.4.0, condicionado a una configuración concreta de TLS. |
| API y MySQL locales | Reproducidos acceso administrativo con credenciales predeterminadas y JWT firmado con la clave publicada, lectura anónima y conservación de adjuntos, validaciones insuficientes y sobrescritura del catálogo al reiniciar. |
| Navegador con respuestas API controladas | Reproducidos falsa confirmación ante HTTP 400, catálogo incorrecto ante respuesta vacía, fallos del editor, mezcla de variantes y ausencia de cierre del diálogo con Escape. |
| Nginx aislado | Reproducido 404 de imágenes subidas por precedencia de ubicaciones, mientras un PDF equivalente pasa por el proxy. |
| Integridad del clon al terminar la auditoría | Git limpio. Las copias y servicios temporales de prueba se retiraron. |

### Alcance de los avisos de dependencias

Una dependencia afectada no demuestra una vulnerabilidad explotable en esta aplicación. Parte de los avisos npm corresponde a herramientas de desarrollo. Los avisos del router encontrados requieren SSR, que este proyecto no usa.

El [aviso de MySqlConnector](https://github.com/advisories/GHSA-473q-m89c-ghf8) requiere condiciones específicas de TLS y no afecta las conexiones locales utilizadas en las pruebas. No es evidencia de intrusión ni de explotación en producción.

.NET 9 terminó su soporte el **2026-11-10**, según los [metadatos oficiales de Microsoft](https://builds.dotnet.microsoft.com/dotnet/release-metadata/9.0/releases.json). Las versiones y los avisos deben volver a comprobarse cuando se ejecute la actualización.

## 4. Prioridades y estimaciones

| Prioridad | Significado |
| --- | --- |
| P0 | Bloquear publicación hasta resolver o mitigar con evidencia suficiente. |
| P1 | Abordar en el siguiente ciclo correctivo. |
| P2 | Mejora planificada. |
| P3 | Evolución opcional. |

Los esfuerzos se expresan en días de trabajo de una persona con experiencia fullstack e incluyen comprobaciones enfocadas. Hay trabajo compartido entre hallazgos; no se deben sumar todos los esfuerzos individuales como si fueran independientes. La estimación global está en el roadmap.

## 5. Problemas confirmados

Confirmado significa reproducido en el entorno local descrito o demostrado por un flujo inequívoco del código. No significa que se haya verificado la configuración de una instalación productiva.

### Seguridad

| ID | Prioridad e impacto | Hallazgo y evidencia | Tarea accionable y esfuerzo |
| --- | --- | --- | --- |
| H01 | **P0 · Crítico:** control administrativo y de datos. | Completado | R003 |
| H02 | **P0 · Crítico:** confidencialidad de fotografías. | Completado | R005 |
| H03 | **P1 · Alto:** exposición de información interna. | Completado | R007 |
| H04 | **P1 · Alto:** abuso del login y almacenamiento. | Completado | R009 |
| H05 | **P1 · Alto:** sesiones comprometidas siguen vigentes. | Los tokens duran 24 horas en [TokenService.cs:31](backend/Leart.Api/Services/TokenService.cs#L31). Cambiar la contraseña solo actualiza su hash en [AdminAuthController.cs:93](backend/Leart.Api/Controllers/AdminAuthController.cs#L93). El token anterior siguió funcionando después del cambio. | Incorporar revocación o versión de sesión comprobada por el servidor y definir una duración adecuada. **1 d**. |
| H06 | **P2 · Medio:** archivos no verificados. | La validación comprueba extensión y tamaño, pero no el contenido real: [FileStorageService.cs:43](backend/Leart.Api/Services/FileStorageService.cs#L43). Un archivo de texto renombrado a JPG fue aceptado y servido. | Validar y decodificar imágenes, limitar dimensiones y normalizarlas. Definir una política separada para PDF si realmente se necesita. **1–2 d**. |

### Integridad y comportamiento comercial

| ID | Prioridad e impacto | Hallazgo y evidencia | Tarea accionable y esfuerzo |
| --- | --- | --- | --- |
| H07 | **P1 · Alto:** confirmación falsa de recepción. | Ante cualquier error HTTP, el formulario marca el envío como completado en [personalization.page.ts:92](src/app/pages/personalization.page.ts#L92). Después afirma que registró datos y fotos en [personalization.page.html:24](src/app/pages/personalization.page.html#L24). La condición de envío omite el teléfono requerido: [personalization.page.ts:36](src/app/pages/personalization.page.ts#L36). Reproducido con HTTP 400. | Confirmar únicamente tras persistencia exitosa, conservar el formulario y permitir reintento. Mostrar una alternativa por WhatsApp con un mensaje fiel al resultado. **0,5–1 d**. |
| H08 | **P1 · Alto:** pedidos incompletos y archivos huérfanos. | Los errores al guardar fotos se ignoran y el pedido puede responder 200 sin ellas. Los archivos se escriben antes de persistir la BD: [PublicController.cs:123](backend/Leart.Api/Controllers/PublicController.cs#L123). Los límites están desalineados: 20 MB por archivo en [FileStorageService.cs:18](backend/Leart.Api/Services/FileStorageService.cs#L18), frente a 25 MB por petición en [nginx.conf:7](nginx.conf#L7). | Prevalidar el conjunto completo, alinear límites y devolver el resultado de cada adjunto. Añadir compensación y limpieza cuando falle la persistencia. **1–2 d**. |
| H09 | **P1 · Alto:** borrar un pedido conserva sus fotos. | El borrado elimina registros, pero no archivos físicos: [AdminOrdersController.cs:112](backend/Leart.Api/Controllers/AdminOrdersController.cs#L112). Tras borrar un pedido, su adjunto siguió respondiendo HTTP 200. | Implementar eliminación o retención explícita de adjuntos, con reintentos y comprobación de archivos huérfanos. **0,5–1 d**. |
| H10 | **P1 · Alto:** se revierten cambios administrativos. | Cada arranque sobrescribe nombre, imagen, descripción, variantes, precio y otros campos de los productos iniciales: [DbInitializer.cs:53](backend/Leart.Api/Data/DbInitializer.cs#L53), invocado desde [Program.cs:192](backend/Leart.Api/Program.cs#L192). Una edición se perdió al reiniciar. Un producto inicial eliminado también se vuelve a insertar. | Separar carga inicial y migraciones de datos, preservar las ediciones del negocio y versionar cualquier actualización del catálogo. **1 d**. |
| H11 | **P1 · Alto:** editor de productos defectuoso. | Dentro del formulario hay controles con `ngModel` sin nombre ni configuración independiente: [admin-products.component.ts:124](src/app/admin/pages/admin-products.component.ts#L124). En producción, varios campos mostraron el texto de la regla comercial en lugar de su valor. | Asignar nombres únicos o utilizar un formulario reactivo tipado. Verificar creación y edición en desarrollo y producción. **0,5–1 d**. |
| H12 | **P1 · Alto:** editar destruye metadatos. | El payload fija ocasiones y reduce las variantes a una etiqueta; omite grupo, precio, código y orden: [admin-products.component.ts:718](src/app/admin/pages/admin-products.component.ts#L718). El PUT reemplaza esos campos con valores vacíos o predeterminados: [AdminProductsController.cs:101](backend/Leart.Api/Controllers/AdminProductsController.cs#L101). | Definir un contrato explícito de actualización: formulario completo o PATCH con campos presentes. Preservar los datos no editados. **1–2 d**. |
| H13 | **P1 · Alto:** mezcla de configuraciones en una cotización. | La selección se identifica únicamente por producto y la nota nueva reemplaza la anterior: [store.service.ts:61](src/app/store/store.service.ts#L61). Agregar un cuadro S y otro M terminó como dos unidades con la configuración M. | Modelar líneas con identificador propio y configuración estructurada. Agrupar solo configuraciones equivalentes y migrar la selección guardada. **1 d**. |
| H14 | **P1 · Alto:** precios y capacidades inconsistentes. | El precio usa tablas locales y prioriza el grupo del producto sobre la variante elegida: [pricing.ts:73](src/app/store/pricing.ts#L73), [pricing.ts:106](src/app/store/pricing.ts#L106). Elegir Grupo 4 en el flujo genérico calculó 130.000 COP en lugar de los 165.000 de su tabla. Los límites usan valores de categoría en [app.ts:109](src/app/app.ts#L109): Mini Hockey declara máximo cuatro en [DbInitializer.cs:1813](backend/Leart.Api/Data/DbInitializer.cs#L1813), pero el cotizador puede permitir ocho. | Establecer una fuente única de precios, variantes y restricciones. Usar identificadores estables y respetar mínimos, máximos y permisos de extras por producto. **3–5 d**. |
| H15 | **P1 · Alto:** catálogo incorrecto ante vacío o fallo. | Una respuesta válida `[]` se ignora en [products.service.ts:20](src/app/core/services/products.service.ts#L20); en navegador siguieron apareciendo 75 productos. Ante fallos de BD, la API entrega el catálogo inicial en [PublicController.cs:63](backend/Leart.Api/Controllers/PublicController.cs#L63), que incluye un producto inactivo. La cotización recupera productos ausentes desde los datos locales: [store.service.ts:30](src/app/store/store.service.ts#L30). | Distinguir vacío, carga y fallo; respetar siempre la disponibilidad actual y evitar recuperar productos retirados sin validación. **1–2 d**. |
| H16 | **P2 · Medio:** validaciones insuficientes en la API. | Los DTO no expresan límites de longitud y dominio: [OrderDtos.cs:3](backend/Leart.Api/DTOs/OrderDtos.cs#L3). El cálculo de máximos permite inconsistencias en [AdminProductsController.cs:75](backend/Leart.Api/Controllers/AdminProductsController.cs#L75): se aceptó un producto con mínimo 1 y máximo −5. Se admiten estados arbitrarios en [AdminOrdersController.cs:106](backend/Leart.Api/Controllers/AdminOrdersController.cs#L106). | Validar longitudes, cantidades, categorías, estados y relaciones entre campos antes de persistir. Devolver errores 4xx claros. **1–2 d**. |
| H17 | **P2 · Medio:** plantillas configurables sin efecto. | El panel guarda plantillas en [admin-settings.component.ts:559](src/app/admin/pages/admin-settings.component.ts#L559), pero los mensajes se construyen con texto fijo en [store.service.ts:119](src/app/store/store.service.ts#L119) y [personalization.page.ts:40](src/app/pages/personalization.page.ts#L40). | Consumir las plantillas configuradas y validar sus variables. **0,5 d**. |

### Despliegue, rendimiento, testing y calidad

| ID | Prioridad e impacto | Hallazgo y evidencia | Tarea accionable y esfuerzo |
| --- | --- | --- | --- |
| H18 | **P1 · Alto:** imágenes subidas devuelven 404. | La ubicación por expresión regular de imágenes en [nginx.conf:36](nginx.conf#L36) tiene precedencia sobre el proxy de [nginx.conf:29](nginx.conf#L29). Reproducido: JPG existente en backend devolvió 404; PDF pasó correctamente por el proxy. | Corregir la precedencia de ubicaciones y verificar las rutas públicas y privadas de adjuntos tras H02. **0,5 d**. |
| H19 | **P1 · Alto:** pérdida de datos en el despliegue autónomo documentado. | El contenedor guarda BD y adjuntos internamente en [Dockerfile:47](Dockerfile#L47), mientras el comando recomendado no monta almacenamiento persistente: [README.md:80](README.md#L80). Reemplazar ese contenedor pierde los datos de su capa escribible. | Estandarizar el despliegue con persistencia explícita, preferentemente sobre Compose ya disponible. Documentar y probar backup y restauración conjunta de BD y archivos. **1–2 d**. |
| H20 | **P1 · Alto:** evolución de esquema y disponibilidad engañosa. | Se usa creación inicial con `EnsureCreated`, que no migra esquemas existentes: [Program.cs:191](backend/Leart.Api/Program.cs#L191). Tras agotar los intentos de conexión, la aplicación continúa: [Program.cs:205](backend/Leart.Api/Program.cs#L205). El fallback puede devolver 200 aunque la BD no esté disponible. | Incorporar migraciones versionadas, comprobar actualizaciones sobre una BD anterior y separar liveness de readiness. Evitar declarar operativa una instancia incapaz de guardar pedidos. **2–3 d**. |
| H21 | **P1 · Alto:** plataforma sin soporte y dependencias pendientes. | El proyecto y las imágenes usan .NET 9: [Leart.Api.csproj:4](backend/Leart.Api/Leart.Api.csproj#L4), [Dockerfile:16](Dockerfile#L16). Su soporte terminó el 2026-11-10. Versiones bloqueadas de Angular, Piscina y Playwright en [package-lock.json:319](package-lock.json#L319), [package-lock.json:6460](package-lock.json#L6460) y [package-lock.json:6483](package-lock.json#L6483). Ver el alcance condicionado de los avisos en la sección 3. | Migrar a una plataforma soportada, actualizar dependencias compatibles y alinear EF y proveedor MySQL. Revisar cada aviso por alcance real. **2–4 d**. |
| H22 | **P1 · Alto:** protección de regresiones insuficiente. | Existe el comando de pruebas en [package.json:9](package.json#L9), pero falta su target en [angular.json:42](angular.json#L42). Las cuatro pruebas actuales se limitan a almacenamiento y generación de tokens: [FileStorageServiceTests.cs:52](backend/Leart.Api.Tests/FileStorageServiceTests.cs#L52), [TokenServiceTests.cs:12](backend/Leart.Api.Tests/TokenServiceTests.cs#L12). No hay pipeline de CI versionado. | Habilitar el ejecutor frontend y CI. Priorizar precios y límites, edición sin pérdida, variantes, errores de envío, privacidad de adjuntos y persistencia tras reinicio. **2–4 d**, distribuidos entre fases. |
| H23 | **P2 · Medio:** consultas que escalan con todo el histórico. | La lista de pedidos carga todos los registros con adjuntos: [AdminOrdersController.cs:24](backend/Leart.Api/Controllers/AdminOrdersController.cs#L24). El dashboard solicita ese conjunto para contar: [admin-dashboard.component.ts:299](src/app/admin/pages/admin-dashboard.component.ts#L299). La autodetección de versión de MySQL está dentro de la configuración scoped del contexto: [Program.cs:34](backend/Leart.Api/Program.cs#L34). | Paginar pedidos, proyectar listas resumidas, consultar conteos agregados, usar lecturas sin tracking y resolver la versión del servidor una sola vez. Medir antes de elegir índices adicionales. **1–2 d**. |
| H24 | **P2 · Medio:** transferencia gráfica evitable. | Las imágenes del catálogo se cargan sin lazy loading ni variantes responsivas: [catalog.page.html:42](src/app/pages/catalog.page.html#L42), [home.page.html:55](src/app/pages/home.page.html#L55). El backend entrega un PNG de aproximadamente 1,66 MB para cuadros: [DbInitializer.cs:105](backend/Leart.Api/Data/DbInitializer.cs#L105), aunque existe una versión WebP. | Servir tamaños adecuados, preferir formatos optimizados, diferir imágenes fuera de pantalla y reservar dimensiones. Medir LCP y transferencia con el catálogo real. **1–2 d**. |
| H25 | **P2 · Medio:** errores administrativos silenciosos. | Un fallo al cargar pedidos solo desactiva la carga: [admin-orders.component.ts:494](src/app/admin/pages/admin-orders.component.ts#L494). La pantalla puede mostrar que no hay pedidos ante un error de servidor. Otros errores se ignoran en [admin-dashboard.component.ts:284](src/app/admin/pages/admin-dashboard.component.ts#L284). | Diferenciar vacío, error y datos anteriores. Mostrar reintento y resultado de las operaciones. **0,5–1 d**. |
| H26 | **P2 · Medio:** navegación por teclado incompleta. | El modal se declara como diálogo en [app.html:36](src/app/app.html#L36), pero no gestiona foco ni cierre con Escape. Se reprodujo que permanece abierto al pulsarlo. El panel de cotización de [app.html:126](src/app/app.html#L126) tampoco tiene comportamiento modal completo. | Gestionar foco inicial, confinamiento y restauración del foco, Escape y nombres accesibles de controles. **0,5–1 d**. |

## 6. Mejoras opcionales

Estas propuestas aportan mantenibilidad o capacidad comercial. No son defectos que obliguen por sí mismos a cambiar la arquitectura y no están programadas ni aprobadas para implementación.

| ID | Mejora y fundamento | Prioridad, impacto y esfuerzo |
| --- | --- | --- |
| O01 | **Separar el cotizador del componente raíz.** [app.ts:77](src/app/app.ts#L77) concentra navegación, selección, capacidades, precios y pasos. Extraer presentación y reglas puras facilitaría sus pruebas. | **P2 · Medio · 2–3 d**. Puede integrarse con H14. |
| O02 | **Consolidar contratos y mapeos.** El mapeo se duplica en [PublicController.cs:175](backend/Leart.Api/Controllers/PublicController.cs#L175) y [AdminProductsController.cs:175](backend/Leart.Api/Controllers/AdminProductsController.cs#L175). El cliente usa actualizaciones abiertas en [admin.service.ts:74](src/app/core/services/admin.service.ts#L74). Usar DTO específicos y un contrato OpenAPI comprobable. | **P2 · Medio · 1–2 d**. |
| O03 | **Mejorar SEO y previsualizaciones por producto.** Metadatos globales e imágenes sociales relativas en [index.html:16](src/index.html#L16); título genérico en [app.routes.ts:22](src/app/app.routes.ts#L22). Definir URLs absolutas y metadatos por producto; evaluar prerender según el canal de adquisición. | **P3 · Comercial potencial · 1–3 d**. |
| O04 | **Revisar el almacenamiento y ciclo de sesión del navegador.** El token queda en localStorage y la autenticación inicial solo comprueba su existencia: [auth.service.ts:30](src/app/core/services/auth.service.ts#L30). Esto no demuestra un XSS, pero amplía su impacto si apareciera. Evaluar cookie HttpOnly con protección CSRF y gestionar expiración. | **P2 · Medio · 1–2 d**. No reemplaza H05. |
| O05 | **Ordenar documentación y herramientas del catálogo.** El plan conserva límites 4/6/8 en [PLAN-DE-TRABAJO-AUDIOS.md:52](PLAN-DE-TRABAJO-AUDIOS.md#L52), mientras los datos comerciales indican 3/6/10 en [excel_readable.txt:30](tools/catalog-data/excel_readable.txt#L30). Los scripts combinan rutas relativas incompatibles tras su traslado: [cross_ref.py:5](tools/catalog-data/cross_ref.py#L5) y [cross_ref.py:22](tools/catalog-data/cross_ref.py#L22). Confirmar la matriz vigente y documentar un proceso reproducible si se seguirán usando. | **P3 · Bajo/medio · 0,5–1,5 d**. |

La discrepancia documental de capacidades requiere una decisión comercial: no hay fundamento para sustituir automáticamente los límites actuales por los del plan antiguo. Sí está confirmado que el cotizador debe respetar de forma coherente la matriz aprobada.

## 7. Roadmap por fases

Las pruebas de cada corrección se incorporan durante su fase. H22 es transversal; la última fase completa la cobertura y automatización pendientes.

| Fase | Tareas accionables | Criterio de aceptación | Esfuerzo |
| --- | --- | --- | --- |
| **F1. Cerrar exposición y controlar acceso** | H01–H06: rotar credenciales, proteger fotos, sanear errores, limitar abuso y revocar sesiones. Definir acceso al formulario postpago. | La clave publicada y la contraseña inicial dejan de funcionar. Adjuntos privados responden 401/403 sin autorización. Cambiar contraseña invalida sesiones anteriores. Archivos inválidos se rechazan explícitamente. | **4–6 d**. |
| **F2. Recuperar integridad de pedidos y administración** | H07–H13, H15–H16 y H18: corregir confirmaciones, adjuntos, borrado, seeding, formularios, actualización, variantes y proxy. | Un fallo conserva el formulario. Editar conserva los demás campos. S y M permanecen como líneas distintas. Reiniciar conserva ediciones. Borrar cumple la política de adjuntos. | **6–9 d**. |
| **F3. Unificar reglas comerciales** | H14 y H17: aprobar matriz de precios y capacidades, centralizar reglas, tipar variantes y conectar plantillas. | Catálogo, ficha, cotizador y WhatsApp coinciden. Las pruebas cubren límites y combinaciones por producto, incluidos grupos y extras. | **3–5 d**. |
| **F4. Hacer reproducible el despliegue** | H19–H21: plataforma soportada, dependencias alineadas, migraciones, persistencia, readiness y recuperación. | Actualizar desde una BD anterior funciona. Recrear servicios conserva datos. Restaurar una copia recupera pedidos y fotos. Una BD caída marca la instancia como no preparada. | **5–7 d**. |
| **F5. Consolidar calidad y rendimiento** | Completar H22–H26: CI, regresiones críticas, paginación, imágenes, estados de error y accesibilidad. | CI ejecuta build y pruebas. Los listados están acotados. Se registran métricas de carga. Los flujos principales funcionan con teclado y ante errores de red. | **4–6 d**. |

**Estimación global: 22–33 días de trabajo**, con tareas compartidas y pruebas incorporadas durante las fases. Las mejoras opcionales quedan fuera de ese rango. La primera entrega debería concentrarse en F1 y F2 para reducir exposición de datos y pérdida de información del negocio.

Dependencias principales:

- Resolver H02 antes de cerrar la corrección definitiva de rutas de H18.
- Coordinar H08 y H09 para que almacenamiento, eliminación y compensación compartan una política consistente.
- Coordinar H10 y H20 para separar catálogo inicial, evolución de datos y migraciones de esquema.
- Resolver H11 y H12 antes de confiar en la edición comercial usada para validar H14.
- Confirmar la matriz comercial antes de cerrar H14; no deducir precios ni capacidades de documentos contradictorios.
- Crear comprobaciones de regresión durante F1–F4 y completar CI y mediciones en F5.

## 8. Cómo mantener este documento

Estas instrucciones aplican a cualquier persona o agente que avance en este roadmap.

1. **Antes de empezar:** leer este documento y [AGENTS.md](AGENTS.md), identificar los IDs afectados y revisar su estado y bitácora. La existencia de una tarea pendiente no autoriza por sí sola implementarla.
2. **Al iniciar trabajo autorizado:** pasar el ítem a `En curso` en la tabla de seguimiento e indicar en la bitácora el alcance que se abordará.
3. **Después de cada avance significativo:** actualizar este documento en el mismo conjunto de cambios. Registrar qué parte avanzó, qué sigue pendiente, qué archivos cambiaron y qué se comprobó. No esperar a terminar toda la fase.
4. **Antes de cerrar la tarea o comunicar progreso:** comprobar que la tabla y la bitácora reflejan el estado real. Toda afirmación de avance debe poder relacionarse con una entrada del registro.
5. **Para completar un ítem:** documentar el criterio de aceptación satisfecho y la evidencia de validación. Una implementación sin comprobar queda como `Implementado; pendiente de validación`.
6. **Para avances parciales:** mantener el ítem abierto y detallar las subtareas terminadas y pendientes. Si hace falta, crear subtareas como `H14.1`, conservando el ID y alcance del hallazgo original.
7. **Para bloqueos o decisiones:** registrar el impedimento, la dependencia y el siguiente paso. Una tarea descartada requiere motivo y decisión explícita; no se elimina el hallazgo histórico.
8. **Para nuevos hallazgos o cambios de alcance:** añadir IDs nuevos sin renumerar los existentes. Diferenciar evidencia confirmada, hipótesis por verificar y mejoras opcionales. Actualizar el roadmap y las estimaciones cuando corresponda.
9. **Para la evidencia:** indicar comandos o comprobaciones y su resultado real; enlazar archivos y, cuando existan, commits o PR. No inventar resultados ni exigir un commit o PR si todavía no existe. En cambios solo documentales, indicar validación documental y que las pruebas de aplicación no aplican.
10. **Para conservar el historial:** añadir entradas a la bitácora, sin reemplazar las anteriores. Si un problema reaparece, reabrir el ítem y registrar la regresión.
11. **Para proteger datos:** no guardar claves, tokens, contraseñas ni datos personales reales en este documento. Describir las comprobaciones usando información de prueba o referencias seguras.

### Estados admitidos

| Estado | Uso |
| --- | --- |
| Pendiente | Hallazgo sin corrección iniciada. |
| En curso | Hay trabajo autorizado en ejecución; puede tener avances parciales. |
| Bloqueado | No se puede continuar una parte; la bitácora indica causa y dependencia. |
| Implementado; pendiente de validación | Hay cambios, pero falta comprobar su aceptación. |
| Completado | Se verificó el alcance y quedaron registradas las evidencias y los pendientes ajenos al ítem, si existen. |
| No programada | Mejora opcional sin incorporación aprobada al roadmap. |
| Descartado con motivo | Existe una decisión explícita documentada de no ejecutar el ítem. |

La tabla siguiente es la fuente del **estado vigente de cada ítem**. La bitácora conserva su historial. Una fase se considera completada únicamente cuando se cumplen sus criterios de aceptación y los ítems asignados están resueltos o tienen una decisión explícita documentada. H22 se verifica durante todas las fases y se cierra al completar su alcance transversal.

## 9. Seguimiento de ítems

**Situación vigente:** 0 de 26 problemas corregidos. Las 5 mejoras opcionales no están programadas. Ver el estado y la evidencia de cada ítem; las tareas en curso no cuentan como completadas.

| ID | Fase | Estado vigente | Última entrada de avance o validación |
| --- | --- | --- | --- |
| H01 | F1 | Pendiente | — |
| H02 | F1 | Pendiente | — |
| H03 | F1 | Pendiente | — |
| H04 | F1 | Pendiente | — |
| H05 | F1 | Pendiente | — |
| H06 | F1 | Pendiente | — |
| H07 | F2 | Pendiente | — |
| H08 | F2 | Pendiente | — |
| H09 | F2 | Pendiente | — |
| H10 | F2 | Pendiente | — |
| H11 | F2 | Pendiente | — |
| H12 | F2 | Pendiente | — |
| H13 | F2 | Pendiente | — |
| H14 | F3 | Pendiente | — |
| H15 | F2 | Pendiente | — |
| H16 | F2 | Pendiente | — |
| H17 | F3 | Pendiente | — |
| H18 | F2 | Pendiente | — |
| H19 | F4 | Pendiente | — |
| H20 | F4 | Pendiente | — |
| H21 | F4 | Pendiente | — |
| H22 | Transversal / cierre F5 | Pendiente | — |
| H23 | F5 | Pendiente | — |
| H24 | F5 | Pendiente | — |
| H25 | F5 | Pendiente | — |
| H26 | F5 | Pendiente | — |
| O01 | Por definir | No programada | — |
| O02 | Por definir | No programada | — |
| O03 | Por definir | No programada | — |
| O04 | Por definir | No programada | — |
| O05 | Por definir | No programada | — |

Al actualizar esta tabla, actualizar también el resumen de situación inicial/vigente si cambia el número de ítems completados o programados. Un ítem con varias subtareas solo cuenta como completado cuando se satisface su alcance completo.

## 10. Bitácora de avances y decisiones

### R001 — 2026-11-18 — Auditoría y documentación de seguimiento

- **Tipo:** documentación de línea base.
- **Responsable:** Codex, a solicitud del usuario.
- **Alcance:** registrar los 26 hallazgos confirmados, las 5 mejoras opcionales, evidencias, prioridades, estimaciones y roadmap por fases.
- **Avance realizado:** auditoría consolidada y creación de este documento con tabla de seguimiento, estados, criterios de cierre y plantilla de bitácora. Creación de [AGENTS.md](AGENTS.md) para que futuros agentes actualicen este registro al avanzar.
- **Archivos de esta entrega:** [AUDITORIA-Y-ROADMAP.md](AUDITORIA-Y-ROADMAP.md) y [AGENTS.md](AGENTS.md).
- **Validación de esta entrega:** comprobación documental de enlaces locales, referencias de líneas, cobertura de IDs, estados iniciales y diff de Git. Las pruebas de aplicación no aplican a esta entrega documental; los resultados de la sección 3 pertenecen a la auditoría previa.
- **Estado de correcciones:** H01–H26 siguen pendientes; O01–O05 siguen sin programar.
- **Pendiente:** ejecutar las fases cuando se autorice su implementación; registrar aquí cada avance y validación.
- **Commit o PR de esta entrega:** no creado.

### R002 — 2026-11-18 — Inicio de correcciones secuenciales y configuración segura

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H01; Hay una clave JWT fija en [appsettings.json:14](backend/Leart.Api/appsettings.json#L14), un administrador con contraseña conocida en [DbInitializer.cs:30](backend/Leart.Api/Data/DbInitializer.cs#L30) y acceso MySQL como root con contraseña fija y puerto publicado en [docker-compose.yml:6](docker-compose.yml#L6). En local, el login predeterminado y un JWT firmado con la clave publicada obtuvieron acceso administrativo HTTP 200. → En curso.
- **Avance y alcance:** Autorizada la implementación una por una, con validación y commit por hallazgo. Se versionó la línea base documental en 1fe840e y se inicia H01: secretos externos, alta inicial controlada y usuario de BD limitado.
- **Archivos y evidencia:** Este documento.
- **Validación:** Revisión de configuración, arranque, bootstrap, despliegue y pruebas existentes. Sin correcciones verificadas todavía.
- **Pendientes o límites:** Implementar y comprobar H01; no se han intervenido instalaciones productivas.
- **Próximo paso:** Validar configuración segura, bootstrap y despliegue antes del commit H01.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R003 — 2026-11-18 — H01 — Secretos externos y alta inicial controlada

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H01; En curso → Completado.
- **Avance y alcance:** JWT y conexión requieren configuración explícita y rechazan claves publicadas, root y contraseñas predeterminadas. El administrador se crea solo con credenciales de bootstrap y su restablecimiento es un comando explícito que termina sin servir HTTP. La contraseña inicial publicada deja de permitir login. Compose usa cuenta limitada, sin publicar BD/API; se retiraron secretos del código, login, archivos de configuración y arranque MariaDB.
- **Archivos y evidencia:** [SecurityConfiguration.cs](backend/Leart.Api/Services/SecurityConfiguration.cs), [AdminBootstrap.cs](backend/Leart.Api/Services/AdminBootstrap.cs), [Program.cs](backend/Leart.Api/Program.cs), [AdminAuthController.cs](backend/Leart.Api/Controllers/AdminAuthController.cs), [SecurityConfigurationTests.cs](backend/Leart.Api.Tests/SecurityConfigurationTests.cs), [AdminBootstrapTests.cs](backend/Leart.Api.Tests/AdminBootstrapTests.cs), [docker-compose.yml](docker-compose.yml), [entrypoint.sh](entrypoint.sh), [.env.example](.env.example), [README.md](README.md)
- **Validación:** dotnet test: 17/17 pasan, incluidos rechazo de claves antiguas y bootstrap sin reinicialización; npm run build correcto; bash -n entrypoint.sh y git diff --check correctos. docker compose config validado con secretos efímeros; API y MySQL no publican puertos. El conflicto EF previo sigue pendiente en H21.
- **Pendientes o límites:** Las instalaciones existentes deben aplicar el procedimiento de rotación/restablecimiento documentado; no se accedió a producción.
- **Próximo paso:** H02: sacar fotos de pedidos del directorio público y autorizar su lectura.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R004 — 2026-11-18 — H02 — Inicio de almacenamiento privado de adjuntos

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H02; Los adjuntos se guardan dentro del directorio público en [FileStorageService.cs:37](backend/Leart.Api/Services/FileStorageService.cs#L37), servido mediante archivos estáticos en [Program.cs:147](backend/Leart.Api/Program.cs#L147). Una URL conocida se pudo leer sin token. El GUID dificulta adivinarla, pero no autoriza su acceso. → En curso.
- **Avance y alcance:** Se inicia la separación de fotos de pedidos e imágenes públicas, incluida migración de archivos antiguos y lectura autenticada desde el panel.
- **Archivos y evidencia:** Este documento.
- **Validación:** Revisión de almacenamiento, DTO, proxy y visor. H01 confirmado en e19ab37.
- **Pendientes o límites:** Implementación y pruebas de acceso HTTP y migración.
- **Próximo paso:** Comprobar que las URLs antiguas no sirvan fotografías y el administrador sí pueda descargarlas.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R005 — 2026-11-18 — H02 — Adjuntos privados y visor autenticado

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H02; En curso → Completado.
- **Avance y alcance:** Las fotos se guardan fuera de wwwroot; se migran archivos antiguos sin sobrescribir conflictos. Las rutas públicas antiguas y /private devuelven 404. La descarga exige JWT y marca no-store; el panel usa HttpClient autenticado, URLs de blob con tipos seguros y libera recursos al cerrar. Compose conserva el almacenamiento privado.
- **Archivos y evidencia:** [FileStorageService.cs](backend/Leart.Api/Services/FileStorageService.cs), [AdminOrdersController.cs](backend/Leart.Api/Controllers/AdminOrdersController.cs), [Program.cs](backend/Leart.Api/Program.cs), [AttachmentAccessTests.cs](backend/Leart.Api.Tests/AttachmentAccessTests.cs), [FileStorageServiceTests.cs](backend/Leart.Api.Tests/FileStorageServiceTests.cs), [admin-orders.component.ts](src/app/admin/pages/admin-orders.component.ts), [admin.service.ts](src/app/core/services/admin.service.ts), [docker-compose.yml](docker-compose.yml), [README.md](README.md)
- **Validación:** 19/19 pruebas backend pasan. Prueba HTTP: anónimo 401 en descarga, rutas públicas 404, administrador 200 con contenido esperado y Cache-Control no-store. Probada migración y bloqueo de recorrido de rutas. Build Angular correcto; sin diagnósticos nuevos.
- **Pendientes o límites:** La migración de fotos reales se ejecutará al desplegar; hacer backup de ambos volúmenes según README. H09 abordará la eliminación física al borrar pedidos.
- **Próximo paso:** H03: sustituir stack traces públicos por Problem Details genéricos.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R006 — 2026-11-18 — H03 — Inicio de respuestas de error seguras

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H03; El manejador global devuelve mensaje, excepción completa y stack trace también en producción: [Program.cs:114](backend/Leart.Api/Program.cs#L114). Una entrada demasiado larga produjo HTTP 500 con detalles de Entity Framework y rutas del servidor. → En curso.
- **Avance y alcance:** Se reemplazará el middleware HTML de diagnóstico por Problem Details sin detalles internos y con identificador de correlación.
- **Archivos y evidencia:** Este documento.
- **Validación:** H02 confirmado en a211d1a; prueba de error HTTP por añadir.
- **Pendientes o límites:** Comprobar que excepciones internas no aparezcan en la respuesta.
- **Próximo paso:** Ejecutar prueba HTTP de fallo controlado y hacer commit H03.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R007 — 2026-11-18 — H03 — Errores genéricos con correlación

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H03; En curso → Completado.
- **Avance y alcance:** Se sustituyó el HTML con excepción y stack trace por Problem Details genéricos, sin caché y con traceId. Los detalles quedan solo en el registro interno.
- **Archivos y evidencia:** [ApiExceptionHandler.cs](backend/Leart.Api/Services/ApiExceptionHandler.cs), [Program.cs](backend/Leart.Api/Program.cs), [ErrorResponseTests.cs](backend/Leart.Api.Tests/ErrorResponseTests.cs)
- **Validación:** 20/20 pruebas backend pasan; fallo HTTP controlado devuelve 500 application/problem+json con traceId, sin el detalle privado ni el tipo de excepción. Diff sin errores.
- **Pendientes o límites:** Sin pendientes en este alcance; el destino operativo de logs depende del despliegue.
- **Próximo paso:** H04: límites de intentos, concurrencia y cuota de almacenamiento.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R008 — 2026-11-18 — H04 — Inicio de protección contra abuso

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H04; El login en [AdminAuthController.cs:24](backend/Leart.Api/Controllers/AdminAuthController.cs#L24) y la recepción pública de pedidos y archivos en [PublicController.cs:94](backend/Leart.Api/Controllers/PublicController.cs#L94) carecen de limitación de frecuencia y cuotas de aplicación. La referencia del pedido es texto libre, sin comprobación de pedido confirmado. → En curso.
- **Avance y alcance:** Se añaden límites por IP al login y formulario, concurrencia global acotada y cuota de fotos privadas. El formulario continúa público: la referencia por sí sola no se tratará como prueba de pago.
- **Archivos y evidencia:** Este documento.
- **Validación:** H03 confirmado en eb3bc61. Se comprobarán 429, Retry-After y cuota antes de aceptar archivos.
- **Pendientes o límites:** Implementación y pruebas de límites.
- **Próximo paso:** Validar rechazos y documentar configuración de proxy confiable.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### R009 — 2026-11-18 — H04 — Límites de envío, concurrencia y almacenamiento

- **Responsable:** Codex, por autorización del usuario.
- **Ítem y estado:** H04; En curso → Completado.
- **Avance y alcance:** Login limitado a 5 intentos por IP/minuto y formulario a 10 envíos por IP/hora; concurrencia global de 16 sin cola y respuestas 429 con Retry-After. Cuota privada de 1 GiB configurable, comprobada bajo exclusión de escrituras. Solo se aceptan IP reenviadas desde proxies explícitamente confiables.
- **Archivos y evidencia:** [AbuseProtection.cs](backend/Leart.Api/Services/AbuseProtection.cs), [FileStorageService.cs](backend/Leart.Api/Services/FileStorageService.cs), [StorageQuotaExceededException.cs](backend/Leart.Api/Services/StorageQuotaExceededException.cs), [AbuseProtectionTests.cs](backend/Leart.Api.Tests/AbuseProtectionTests.cs), [README.md](README.md)
- **Validación:** 23/23 pruebas backend pasan, incluidas rechazo HTTP del sexto login y undécimo envío con políticas independientes y cuota sin crear archivo. Diff correcto.
- **Pendientes o límites:** Políticas locales para una instancia de API; varias réplicas requieren coordinación compartida. Formulario público deliberado: la referencia no acredita pago; README lo explicita. Configurar las IP reales del proxy al desplegar.
- **Próximo paso:** H05: invalidar tokens al cambiar/restablecer contraseña o eliminar un administrador.
- **Commit:** esta entrada se incluye con los cambios del ítem; consultar el historial Git por su ID.

### Plantilla para la siguiente entrada

Copiar la plantilla, asignar el siguiente identificador `R002`, `R003`, etc., y completar los campos. Eliminar los textos de ejemplo de la entrada real.

```markdown
### RXXX — AAAA-MM-DD — Título concreto del avance

- **Tipo:** inicio / avance parcial / validación / cierre / bloqueo / decisión / regresión.
- **Responsable:** persona o agente.
- **Fase e ítems:** F1; H01, H02 o subtareas relacionadas.
- **Alcance autorizado:** parte del trabajo que se aborda.
- **Avance realizado:** comportamiento cambiado y subtareas terminadas.
- **Archivos y evidencia:** enlaces relativos a archivos, líneas vigentes y commit o PR si existe.
- **Validación:** comandos o comprobaciones, resultado real y criterio de aceptación cubierto.
- **Pendientes o límites de validación:** qué falta y qué no se pudo comprobar.
- **Bloqueos o decisiones:** motivo, dependencia y siguiente paso; indicar si no aplica.
- **Estado anterior → nuevo:** por cada ítem afectado.
- **Próximo paso:** tarea concreta para continuar.
```
