# Plan de trabajo para Leart

## Objetivo del sitio

Convertir la web en una vitrina clara de productos personalizados que ayude al cliente a:

1. Entender qué vende Leart.
2. Elegir un producto y sus variables principales.
3. Armar una solicitud de cotización.
4. Enviarla por WhatsApp.
5. Después del pago, completar la personalización con fotos, fondos, minifiguras y demás datos del pedido.

La primera versión no necesita pagos en línea. El cierre comercial seguirá ocurriendo por WhatsApp para evitar comisiones y conservar el acompañamiento personalizado.

## Lo que cambia frente a la demo actual

- Reorganizar el catálogo en las líneas reales del negocio: **Cuadros, Sets, Cajas acrílicas, Llaveros y Minifiguras**.
- Confirmar si los **imanes** son una categoría adicional o una presentación de las minifiguras.
- Mostrar claramente las variables que cambian el precio: tamaño, número de minifiguras, mascotas y accesorios.
- Sustituir el concepto de carrito de compra por una **selección para cotizar**.
- Separar la cotización previa de la personalización detallada posterior al pago.
- Vincular los catálogos de fondos y minifiguras que Leart está preparando.
- Mantener WhatsApp como llamada a la acción principal.

## Fase 1 — Alinear contenido y estructura

### Información que debe entregar Leart

- Nombre definitivo de cada línea de producto.
- Lista de precios y reglas de cálculo.
- Fotografías representativas de cada producto.
- Tres tamaños de cuadros, sus dimensiones y límites de minifiguras.
- Grupos y precios de los sets.
- Límite y variantes de las cajas acrílicas.
- Opciones de llaveros, minifiguras, imanes y mascotas.
- Precios o reglas para mascotas y accesorios adicionales.
- Número oficial de WhatsApp.
- Formulario que actualmente se envía después del pago.
- Catálogos definitivos de fondos y minifiguras.

### Resultado

Un mapa aprobado del catálogo y una matriz de variantes, precios y restricciones. Esta información será la fuente única para la web y evitará mostrar combinaciones que Leart no pueda producir.

## Fase 2 — Reorganizar el catálogo

Crear una portada visual para las cinco líneas principales:

1. **Cuadros personalizados**
   - Tamaños S, M y L, sujetos a confirmación.
   - Entre 1 y 8 minifiguras en total.
   - Límite de figuras específico para cada tamaño.
   - Posibilidad de elegir un cuadro mayor aunque la cantidad de figuras sea menor.
   - Variables adicionales: mascotas y accesorios.

2. **Sets armables**
   - Organización por grupos o colecciones.
   - Precio base por grupo.
   - Variación por cantidad de minifiguras.
   - Adiciones de mascotas y accesorios.

3. **Cajas acrílicas**
   - Máximo cuatro minifiguras.
   - Variación por cantidad de figuras y mascotas.
   - Confirmar si esta línea corresponde a las “Minibox” de la demo actual.

4. **Llaveros**
   - Modelos y presentaciones disponibles.
   - Selección de personaje o minifigura.

5. **Minifiguras**
   - Figuras individuales.
   - Confirmar si los imanes pertenecen aquí o deben verse como producto independiente.

Agregar una sección de **Próximamente** para el porta llaves y otros productos en desarrollo, sin permitir todavía su cotización.

## Fase 3 — Crear un cotizador guiado

Cada ficha debe pedir únicamente las variables necesarias para ese producto. Las reglas deben reaccionar a la selección del usuario:

- Un cuadro no permitirá superar la capacidad de su tamaño.
- Una caja acrílica no permitirá más de cuatro minifiguras.
- Los sets mostrarán su grupo, número de figuras y extras compatibles.
- Llaveros y minifiguras tendrán un flujo más corto.
- Mascotas y accesorios aparecerán solo cuando sean aplicables.

El resumen se llamará **Mi cotización** o **Mi selección**, no carrito. El botón final abrirá WhatsApp con un mensaje estructurado que incluya producto, variante, cantidad, extras y observaciones. Si todavía faltan precios definitivos, la interfaz usará “Cotizar” o “Desde”, sin inventar valores.

## Fase 4 — Separar el flujo posterior al pago

La personalización detallada debe abrirse después de que Leart confirme el pago. Hay dos formas de implementarlo:

### Primera entrega

Vincular o incrustar el formulario que Leart usa actualmente. El asesor envía al cliente un enlace después de confirmar el pago.

### Evolución recomendada

Crear una ruta propia, por ejemplo `/personalizar-pedido`, que solicite:

- Número o código del pedido.
- Datos de contacto.
- Producto comprado.
- Personas y mascotas que se representarán.
- Fotografías de referencia.
- Fondo elegido desde el catálogo.
- Minifiguras, vestuario y accesorios elegidos desde el catálogo.
- Nombres, frase, fecha y observaciones.
- Aceptación del resumen antes de enviarlo.

El formulario debe generar una respuesta ordenada para el equipo de Leart. El catálogo de fondos y minifiguras puede incorporarse como selector visual cuando esté terminado.

## Fase 5 — Ajustar contenido comercial

- Explicar que Leart trabaja desde Medellín y realiza envíos a Colombia.
- Presentar la web como catálogo y canal de cotización.
- Explicar el proceso real: elegir, cotizar por WhatsApp, pagar, personalizar, aprobar y producir.
- Mantener fotografías reales como elemento principal.
- Añadir preguntas frecuentes sobre tiempos, disponibilidad, límites, envíos y cambios.
- Mostrar productos nuevos como próximos lanzamientos.

## Fase 6 — Pruebas y publicación

- Probar todas las combinaciones y sus límites.
- Revisar la experiencia móvil, especialmente modales, títulos y selectores visuales.
- Verificar que los mensajes de WhatsApp sean legibles y completos.
- Probar la carga de fotografías en el formulario posterior al pago.
- Revisar textos, precios y nombres con Leart.
- Validar rutas directas y recargas en Coolify.
- Publicar y medir clics en WhatsApp y productos más consultados.

## Prioridades para la próxima demo

1. Cambiar el catálogo a las cinco líneas reales.
2. Renombrar la bolsa como cotización.
3. Crear las reglas de cuadros y cajas acrílicas.
4. Actualizar el recorrido “elegir → WhatsApp → pago → personalización”.
5. Dejar preparado el enlace al formulario actual.
6. Incorporar los catálogos nuevos cuando Leart los entregue.

## Decisiones pendientes

- Confirmar que los tamaños de cuadro se llaman S, M y L.
- Definir cuántas figuras caben en cada tamaño.
- Confirmar si “Minibox” y “caja acrílica” son el mismo producto.
- Confirmar dónde encajan los imanes.
- Definir si la web mostrará precios exactos o solo permitirá cotizar.
- Elegir entre enlazar el formulario actual o construir uno dentro de la web.
- Definir cómo se identifica un pago o pedido antes de permitir la personalización.

## Estimación inicial

- Alineación de información y matriz de productos: **medio a un día**, cuando estén disponibles precios y límites.
- Reorganización del catálogo y contenido: **1 a 2 días**.
- Cotizador con reglas por producto: **2 a 3 días**.
- Integración del formulario actual: **medio a un día**.
- Formulario nativo posterior al pago: **2 a 4 días adicionales**, según dónde se guarden las respuestas y fotografías.
- Pruebas móviles, ajustes y despliegue: **1 día**.

La primera versión alineada con los audios puede quedar lista en aproximadamente **4 a 7 días de trabajo**, una vez Leart entregue la información pendiente. El formulario nativo completo puede plantearse como una segunda entrega.
