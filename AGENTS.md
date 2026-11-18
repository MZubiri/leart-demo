# Instrucciones de trabajo y seguimiento

Estas instrucciones aplican a todo el repositorio.

## Registro obligatorio del avance

- Antes de trabajar en mejoras, correcciones o tareas relacionadas con la auditoría, leer [AUDITORIA-Y-ROADMAP.md](AUDITORIA-Y-ROADMAP.md), especialmente las secciones 8 a 10.
- Ese documento es el registro central del roadmap y su progreso. Cada avance significativo, incluso parcial, debe quedar documentado allí en el mismo conjunto de cambios y antes de terminar la tarea o comunicar que se completó.
- Identificar los hallazgos afectados por su ID (`H01`–`H26`, `O01`–`O05` o nuevos IDs), actualizar su estado vigente y añadir una entrada con fecha a la bitácora. No renumerar los IDs existentes.
- Registrar qué se avanzó, archivos afectados, validaciones y resultados reales, pendientes, bloqueos y siguiente paso. Enlazar commits o PR únicamente cuando existan.
- No marcar un ítem como completado sin evidencia de que cumple su criterio de aceptación. Si falta validación, usar `Implementado; pendiente de validación`. Los avances parciales mantienen el ítem abierto.
- Conservar la evidencia y el historial de la auditoría. Añadir correcciones y ubicaciones vigentes en las entradas nuevas; no borrar el hallazgo original para simular su resolución.
- Las mejoras opcionales requieren una decisión de incorporarlas al trabajo. La existencia del roadmap no autoriza implementar cambios que el usuario no haya solicitado.
- Si un trabajo nuevo no está contemplado, añadirlo con un ID nuevo y registrar su alcance y prioridad, distinguiendo problemas confirmados de hipótesis y mejoras opcionales.
- No incluir secretos, tokens ni datos personales reales en el registro.

El documento ya contiene los estados permitidos, el seguimiento inicial y una plantilla para cada nueva entrada.
