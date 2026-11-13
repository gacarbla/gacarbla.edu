# Changelog

Todos los cambios relevantes de gacarbla.edu se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado semántico [SemVer](https://semver.org/lang/es/).

## [Unreleased]

## [0.5.2] - 2026-11-13

### Corregido

- El login de alumnado ya no culpa a la persona cuando la API antigua no
  separa la contraseña del segundo factor: ofrece continuar con el segundo
  paso y recuerda la compatibilidad en la pestaña.

## [0.5.1] - 2026-11-13

### Corregido

- Una cuenta de centro ya no ve el botón de crear aula personal. El panel del
  centro se encargará de sus aulas.

## [0.5.0] - 2026-11-13

### Añadido

- Nuevo login por pasos con una tarjeta persistente, dos puertas de acceso,
  loader para la cuenta API y verificación del alumnado en dos pasos.
- Paso de segundo factor (PIN o pregunta) después de validar la contraseña;
  la API devuelve `EDU_SECOND_FACTOR_REQUIRED` y el método efectivo.
- Menú de perfil en la esquina superior derecha, con avatar, nombre, flecha y
  opciones accesibles.
- Revisión de diseño del equipo de producto, visual, movimiento, psicología,
  accesibilidad y contenido en `docs/DESIGN-REVIEW-2026-11.md`.

### Cambiado

- Centros deja de ser una pestaña principal y pasa al menú de perfil, en un
  tono discreto.
- Nuevo panel con hero, tarjetas de aula, pestañas segmentadas y transiciones
  suaves; se respeta `prefers-reduced-motion`.
- El acceso con cuenta mantiene el fallback de redirect y ahora completa la
  sesión al volver a la misma pestaña.

### Corregido

- El nombre visible de edu sigue siendo independiente del `displayName` de la
  cuenta API.
- El alumnado no ve crear aula, centros ni aprobaciones.

## [0.4.0] - 2026-11-13

### Añadido

- Búsqueda de texto en las páginas del temario, con enlace directo al
  resultado y fragmento de contexto.

## [0.3.2] - 2026-11-13

### Corregido

- El alumnado no ve el formulario de centros aunque abra la ruta directamente.
- El perfil tolera respuestas antiguas de la API sin preferencias de
  notificación.

## [0.3.1] - 2026-11-13

### Corregido

- El alumnado ya no ve «Crear aula», «Centros» ni «Aprobaciones». El estado
  vacío le pide abrir el enlace de invitación de su docente.
- La navegación de la app se adapta al tipo de cuenta.

## [0.3.0] - 2026-11-13

### Añadido

- Aplicación de aulas en `/app/`: panel, creación y edición de aulas, temario
  con carpetas y páginas Markdown, comentarios, publicación, personas,
  invitaciones, ejercicios, boletín, mensajes, aprobaciones y centros.
- Aceptación de invitaciones en `/join/?code=…`.
- Persistencia de la sesión edu en `sessionStorage` (solo refresh token) y
  restauración con DPoP.
- Acceso con `next` para volver a la app o a una invitación después del login.
- Formulario de solicitud del programa para centros.
- Enlace de creación de cuenta en la ventana oficial de la API.

### Cambiado

- El nombre visible de edu es independiente del `displayName` de la cuenta
  API; solo se sincroniza la fecha de nacimiento que falte.
- La portada enlaza los CTAs de creación y acceso a la aplicación real.
- La pantalla de perfil ya no bloquea el nombre visible de edu.

## [0.2.0] - 2026-11-13

### Añadido

- Alta obligatoria del perfil edu cuando la cuenta principal no tiene fecha de
  nacimiento: los datos existentes se autocompletan y quedan bloqueados, y los
  que faltan se guardan también en la cuenta principal.
- Sincronización del nombre visible y la fecha de nacimiento entre la cuenta
  principal y el perfil edu, sin sobrescribir datos ya establecidos.
- Pantalla de perfil en `/login/` con los campos bloqueados o editables según
  lo que exista en la cuenta vinculada.

### Corregido

- El acceso adulto ya no muestra «Contacta con soporte»: pide completar el
  perfil y continúa con el alta.

## [0.1.0] - 2026-11-13

### Añadido

- Portada pública responsive con seis bloques, foto real CC0 y estilos por edad.
- Pantalla `/login/` con acceso de adultos mediante la ventana oficial de
  `api.gacarbla.es` y formulario propio para alumnado sin cuenta API.
- Fallback de la ventana de acceso a la misma pestaña mediante `redirect`.
- Capa de cliente de la API: clave P-256 en IndexedDB, DPoP, HPKE, WebSocket,
  sesiones `users`/`edu`, restauración de cookie, exchange, refresh y logout.
- Estilos `kid`, `teen`, `adult` y `senior` aplicados según la fecha de nacimiento.
- Documentación de producto, diseño, integración y créditos.
- CI con comprobación de tipos, build y guardia de documentos privados.
- Despliegue automático en GitHub Pages y workflow de releases.

[Unreleased]: https://github.com/gacarbla/gacarbla.edu/compare/v0.5.2...HEAD
[0.5.2]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.5.2
[0.5.1]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.5.1
[0.5.0]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.5.0
[0.4.0]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.4.0
[0.3.2]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.3.2
[0.3.1]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.3.1
[0.3.0]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.3.0
[0.2.0]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.2.0
[0.1.0]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.1.0
