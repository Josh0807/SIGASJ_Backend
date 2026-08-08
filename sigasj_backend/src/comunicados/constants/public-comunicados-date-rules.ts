/**
 * Reglas de vigencia pública (Parte 6) — estado actual del proyecto.
 *
 * Hallazgo: aún NO existe la entidad `Comunicado` ni columnas TypeORM en este
 * repositorio. Por tanto no hay tipos reales `date` vs `timestamp` que citar.
 *
 * Cuando exista la entidad, la consulta en BD debe aplicar (sin offsets
 * hardcodeados ni cambio de TZ global):
 *
 * 1. Estado activo (campo real de la entidad).
 * 2. fechaInicioVisibilidad <= ahora  (o el campo real equivalente).
 * 3. fechaVencimiento >= ahora OR fechaVencimiento IS NULL.
 *
 * La especificación exige `>=` en el límite de vencimiento (incluido el día/
 * instante actual). No sustituir por `>`.
 *
 * Estrategia de “ahora”: usar el reloj/DB del proyecto tal como esté
 * configurado (p. ej. `CURRENT_TIMESTAMP` / parámetro Date en Node), sin
 * restar “-6 horas” manualmente.
 *
 * Inconsistencia conocida: sin entidad/BD no se puede validar zona horaria
 * real; documentado aquí, sin parche improvisado.
 */
export const PUBLIC_COMUNICADOS_DATE_RULES = {
  visibilityStartOperator: '<=' as const,
  expirationOperator: '>=' as const,
  allowNullExpiration: true,
} as const;
