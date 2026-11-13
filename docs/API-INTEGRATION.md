# Preparación de la integración con la API

Documento de trabajo del frontend. **No define la API**: recoge qué hay hoy, qué habrá que conectar y qué necesitamos que especifique la guía de la API.

## Revisión de la guía privada (13/11/2026)

- La guía de `docs/api/` y `docs/legal/` está revisada en local y **excluida del repositorio** (`.gitignore` + comprobación en CI).
- La conexión local desde `http://localhost:8082` está permitida por CORS y el `core/v1/hello` del WebSocket responde.
- **Bloqueo de producción:** `https://edu.gacarbla.es` no está en `CORS_ORIGINS` ni en `returnOrigins` de `/users/auth/config`. Sin esos dos, REST/WS y la ventana de acceso no pueden volver a edu.
- El WebSocket emite un evento `core/v1/connected` antes de la respuesta de `hello`; el cliente debe ignorar eventos no solicitados y emparejar respuestas por `id`.
- La interfaz se elige por la **fecha de nacimiento exacta** del perfil de `users` (8–12 niño, 13–17 adolescente, 18–64 adulto, 65+ sénior), solo en memoria y solo para presentación. Las bandas legales `<14`, `14-15`, `16-17`, `18+` no son una clasificación visual y solo se usan como respaldo si no hay fecha.
- La creación de aula personal está limitada a 18+ (16–17 con aprobación parental; <16 solo alumno). La portada se ha corregido para no prometer lo contrario.
- El login de adultos se hace en la ventana de `https://api.gacarbla.es/users/login?popup=1&return=…`; la guía anterior describía un login WS que no es el flujo del producto. Edu no maneja la contraseña adulta.
- El login de alumnado sin cuenta API se hace en `/login/` con alias, contraseña y PIN o pregunta; usa HPKE y el endpoint documentado.
- Falta una cuenta de prueba desechable o un buzón para verificar el flujo end-to-end con `REQUIRE_EMAIL_VERIFICATION=true`.
- La regla de 3 avisos leves/1 grave y retirada de licencias aparece como política de producto; la API actual expone avisos y licencia, pero no una automatización de ese umbral.

## Contrato confirmado en `../gacarbla.api` (13/11/2026)

### Sesión de `users`

`POST /users/v1/session/restore` (cookie `gac_session` + DPoP + `x-gac-connection`) devuelve:

```json
{
  "ok": true,
  "data": {
    "accessToken": "…",
    "expiresInSec": 900,
    "startedAt": 1763000000000,
    "absoluteExpiresAt": 1763043200000,
    "userId": "uuid"
  }
}
```

Rota el refresh y la cookie, pero **no devuelve refresh token**: solo la cookie `HttpOnly; Secure; SameSite=Strict` lo contiene. `startedAt` y `absoluteExpiresAt` son epoch en milisegundos.

`users/v1/refresh` (WS) devuelve además `refreshToken`, `jkt`, `startedAt` y `absoluteExpiresAt` (también números).

`GET /users/v1/me` **no usa el sobre `{ ok, data }`** y devuelve la vista REST en snake_case:

```json
{
  "id": "uuid",
  "email": "…",
  "phone": null,
  "username": "…",
  "display_name": "…",
  "birth_date": "1990-01-01",
  "email_verified": true,
  "profile_completed": true,
  "totp_enabled": false,
  "telegram_linked": false
}
```

No incluye `login_history` (esa vista es solo del WS). El cliente de edu usa `apiRequestRaw` para esta ruta y mapea `birth_date`/`display_name` al perfil de presentación.

### Alta y sincronización del perfil edu

- Si `users.birthDate` existe, es la fuente de verdad: edu la usa y no permite cambiarla.
- Si falta, `POST /edu/v1/auth/exchange` devuelve `403 EDU_PROFILE_INCOMPLETE`. El cliente muestra una pantalla para completar el perfil, no un error de soporte.
- El formulario pide la fecha si falta. La fecha se autocompleta y bloquea si ya existe en la cuenta principal; si falta, se guarda en ella.
- Al enviar la fecha, se escribe en `users.birthDate` (el cliente por `users/v1/me/profile.update`; la API también acepta `birthDate` en el exchange). Solo se rellenan campos vacíos: nunca se sobrescribe un dato existente.
- El **nombre visible de edu es independiente**: no se copia de `users.displayName` ni se sincroniza hacia la cuenta principal. La mayoría de cuentas API usan apodos y edu permite otro nombre.
- El `ageMode` del perfil edu (`minor`/`adult`) se recalcula en cada exchange a partir de la fecha de la cuenta principal.
- Después del alta, ambos perfiles siguen vinculados: la cuenta principal manda y edu refleja sus datos.

### Por qué el popup no basta por sí solo

- `assertSameOrigin` (`src/modules/users/routes.ts`) rechaza cualquier `Origin` distinto de `API_BASE_URL` en `session/persist` y `session/restore`. Desde edu devuelve `403 FORBIDDEN` con «origen no permitido».
- El refresh está atado al `jkt` del dispositivo que hizo login (`rotateRefresh`: `rec.jkt !== input.jkt` → revoca la familia y devuelve `REFRESH_REUSE`). La clave DPoP vive en IndexedDB, que es por origen: la ventana de `api.gacarbla.es` y `edu.gacarbla.es` tienen claves distintas.
- Por tanto, además de `CORS_ORIGINS` y `AUTH_RETURN_ORIGINS`, la API necesita un puente de sesión entre orígenes (código de un solo uso canjeado con la clave de edu, o reemisión de la familia atada al nuevo `jkt`). Sin ese puente, el login adulto no puede completarse aunque la ventana se abra y devuelva el control.

Edu ya implementa:
1. Intento de ventana emergente.
2. Fallback automático a la misma pestaña si el navegador la bloquea, con `return=…?auth=redirect`.
3. Al volver, restauración de la cookie + `/me` + `exchange` + estilo por edad.
4. Un enlace manual «¿No se abre la ventana? Accede en esta página».

## Estado actual

- La portada sigue siendo estática, pero ya incluye la capa de autenticación y la pantalla `/login/`.
- Implementado: configuración, clave P-256 no extraíble en IndexedDB, `jkt`, proof DPoP, HPKE, cliente WebSocket (`hello`, eventos, respuestas por `id`), sesiones `users`/`edu`, popup de adultos con fallback a redirect, restauración de cookie, lectura de `/users/v1/me` en snake_case, exchange, login de menor, refresh y logout.
- Pendiente: registro de cuentas adultas, persistencia fina de sesión, aulas, invitaciones y el resto de features.
- Los CTAs de crear aula siguen abriendo el diálogo de beta; los de entrar ya llevan a `/login/`.
- El programa para centros usa un `mailto`; no hay formulario.
- Las reglas de límites y sanciones son copy de producto; la API aún no las aplica.
- No hay cookies, analítica, `localStorage` ni datos personales en la portada.
- La foto del prisma es local y tiene licencia CC0; no depende de la API.

## Puntos de integración ya preparados

| Punto | Dónde | Estado |
| --- | --- | --- |
| Estilo por edad | `src/lib/age-mode.ts` + `data-age` en `<html>` | Listo para recibir la franja desde la API |
| Evento de edad | `window.dispatchEvent(new CustomEvent('edu:set-age-mode', { detail: 'teen' }))` | Listo |
| Renderizado con edad conocida | `<html data-age="kid|teen|adult|senior">` | Soportado |
| CTAs de creación / invitación | `data-open-dialog="beta-dialog"` | Pendiente de sustituir por rutas reales |
| Vista de aula de ejemplo | `aula-dialog` | Estática, sin datos reales |
| Límites personales | Sección `#centros` y FAQ | Copy pendiente de validar contra la API |
| Programa para centros | `mailto:hola@gacarbla.es` | Pendiente de formulario/endpoint |
| Reglas 3 avisos / 1 grave | `#centros` y FAQ | Copy pendiente de implementación real |

## Lo que necesitamos que defina la guía

1. **Entorno y URL base**: producción, staging, local; variables `VITE_*` o equivalentes.
2. **Autenticación**: cookies de sesión, tokens, refresh, CSRF, duración y logout.
3. **Edad**: cómo llega la franja (endpoint de sesión, claim, HTML renderizado) y cómo se mapea a `kid|teen|adult|senior`.
4. **Aulas**: crear, leer, actualizar, borrar; campos mínimos; estados (borrador/publicada no aplica: son privadas).
5. **Invitaciones**: generar enlace/código, caducidad, límite de plazas, aceptación, expulsión, reenvío.
6. **Miembros y roles**: docente, alumno, familia/tutor si existe; permisos.
7. **Límites**: 1 aula/12 plazas por defecto; cómo se consultan y cómo se aplican; errores al superarlos.
8. **Programa para centros**: solicitud, verificación, cuentas docentes, licencias, avisos, bloqueo.
9. **Contenido del aula**: temario, materiales, avisos, entregas; qué necesita el frontend y qué no.
10. **Errores y estados**: formato de error, códigos, rate limits, mensajes seguros para menores.
11. **CORS, CSP y cabeceras**: orígenes permitidos, cookies `SameSite`, CSRF, `Content-Security-Policy`.
12. **Privacidad y consentimiento**: qué se guarda, durante cuánto tiempo, quién lo ve y cómo se gestiona el consentimiento familiar.
13. **Analítica**: confirmar que no hay cookies ni terceros; si se añade, debe ser explícita y compatible con menores.
14. **SSR o SPA**: si la API sirve HTML con `data-age` o si el frontend hidrata y aplica la edad después.

## Decisiones ya tomadas en el frontend

- **No hay selector de edad.** La portada pública es siempre `kid` (10 años).
- **No se persiste la edad en el cliente.** La API decide la franja.
- **No se guardan tokens en `localStorage`** salvo que la guía lo justifique; preferencia por cookies `HttpOnly` + CSRF.
- **No se añaden datos reales a la portada.** La vista de aula es un ejemplo etiquetado.
- **No se promete un alta que no existe.** El diálogo de beta ofrece email y demo.
- **La foto es local y CC0**, sin dependencia de API.

## Checklist de implementación (cuando llegue la guía)

- [ ] Configurar URL base y entornos.
- [ ] Cliente HTTP común (errores, credenciales, timeout, cancelación).
- [ ] Sesión: login, logout, refresco y redirección.
- [ ] Aplicar `data-age` desde la sesión.
- [ ] Sustituir el diálogo beta por rutas reales de alta y acceso con invitación.
- [ ] Formulario de creación de aula y estados de carga/error.
- [ ] Aceptación de invitación y control de plazas.
- [ ] Límites reales y mensajes de error claros.
- [ ] Solicitud del programa para centros.
- [ ] Revisar CORS, CSP, cookies y CSRF.
- [ ] Probar con datos de prueba y con una cuenta de menor.
- [ ] Repetir Lighthouse y revisar que no se rompe la accesibilidad.

## Reglas de seguridad para el frontend

- Nunca incluir claves privadas, secretos de API ni tokens de servicio en el bundle.
- No confiar en el cliente para límites, licencias, edades o permisos: la API es la autoridad.
- No mostrar datos de otros alumnos ni aulas ajenas.
- No introducir rastreadores de terceros ni anuncios.
- Cualquier nuevo formulario debe explicar qué datos recoge y para qué.
- Si se añade una imagen, documentar su licencia en `CREDITS.md`.
