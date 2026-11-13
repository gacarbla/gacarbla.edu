# gacarbla.edu — portada

Portada pública de **gacarbla.edu**, un espacio para que cualquier persona adulta cree un **aula privada**, ordene su temario y lo comparta con su grupo mediante una invitación. Los perfiles de 16–17 pueden crear aulas con aprobación de su tutor; los menores de 16 entran como alumnos con una invitación.

La web **no tiene cursos públicos ni catálogo**. No hay un feed que explorar: cada aula la construye quien enseña y solo entra quien recibe la invitación.

[![CI](https://github.com/gacarbla/gacarbla.edu/actions/workflows/ci.yml/badge.svg)](https://github.com/gacarbla/gacarbla.edu/actions/workflows/ci.yml)
[![Deploy](https://github.com/gacarbla/gacarbla.edu/actions/workflows/deploy.yml/badge.svg)](https://github.com/gacarbla/gacarbla.edu/actions/workflows/deploy.yml)

- Web: <https://edu.gacarbla.es>
- Repositorio: <https://github.com/gacarbla/gacarbla.edu>
- Diseño: [DESIGN.md](./DESIGN.md)
- Créditos: [CREDITS.md](./CREDITS.md)
- Preparación de la API: [docs/API-INTEGRATION.md](./docs/API-INTEGRATION.md)
- Licencia: [MIT](./LICENSE)

## Estado

| Pieza | Estado |
| --- | --- |
| Portada responsive | Lista |
| Modelo de aulas privadas | Reflejado en toda la portada |
| Estilos por edad | Implementados; se aplican tras identificar a la persona |
| Selector de edad en la portada | **No existe**, por decisión de producto |
| Límites y programa para centros | Reglas en la API y formulario de solicitud en `/app/#/centros` |
| Capa de autenticación API | Implementada: dispositivo, DPoP, HPKE, WS, sesiones, refresh y restauración en la pestaña |
| Acceso de adultos | Implementado: ventana oficial de `api.gacarbla.es/users/login` + restauración de cookie |
| Acceso de alumnado sin cuenta API | Implementado: formulario propio en `/login/` con alias, contraseña y PIN/pregunta |
| Registro de cuentas adultas | Se hace en la ventana oficial de `api.gacarbla.es`; enlazado desde el acceso |
| Aplicación de aulas | Implementada en `/app/`: temario, personas, invitaciones, ejercicios, boletín, mensajes, aprobaciones y centros |
| Invitaciones y aulas reales | Implementadas: enlaces `/join/?code=…` y aceptación con sesión edu |
| Despliegue estático | GitHub Pages desde `main`, con Actions y dominio `edu.gacarbla.es` |

## Producto

- Las cuentas adultas (18+) pueden crear un aula; los perfiles de 16–17, con aprobación de su tutor; los menores de 16 entran como alumnos con una invitación.
- Las aulas son privadas: se accede con una invitación; no hay directorio público.
- Por defecto, una cuenta puede crear **1 aula con hasta 12 plazas de alumno**.
- Los **centros educativos** pueden solicitar un programa de colaboración con compromiso legal de seguir pautas rigurosas de seguridad y protección de menores. Mientras cumplen, se eliminan los límites para todas las cuentas que registren como docentes.
- Incumplimiento: **3 avisos leves o 1 aviso grave** suponen la retirada de todas las licencias y el bloqueo del acceso al programa.

La portada explica estas reglas; la implementación real (verificación, licencias, avisos y bloqueo) corresponde a la API y debe revisarse con legal antes de la beta.

## Estructura de la portada

La página se ha reducido a seis bloques después de una revisión de UX, educación/psicología y marketing:

1. **Hero**: propuesta de valor, dos puertas (crear / entrar con invitación) y una única vista de aula con una fotografía real.
2. **Cómo funciona**: tres pasos, sin mock duplicado ni builder ficticio.
3. **Límites y centros**: 1 aula/12 plazas, razón del límite, programa para centros y consecuencias.
4. **Privacidad y menores**: acceso por invitación, control del docente, sin anuncios dirigidos y lectura adaptada. Una línea, no una sección entera.
5. **Preguntas**: solo las que cambian una decisión.
6. **Cierre**: dos acciones y una nota de beta.

Se eliminaron el manifiesto, la sección “dos lados”, la sección independiente de edades, el builder de ejemplo y el exceso de repeticiones.

## Stack

- **Vite** + **TypeScript** estricto.
- **CSS propio** con capas, tokens y variables. Sin framework de UI.
- **`@hpke/core`** (MIT) como única dependencia de runtime: HPKE para el cifrado de credenciales que exige la API.
- Tipografías **autoalojadas** (Bricolage Grotesque e Instrument Sans). Sin peticiones a Google Fonts.
- JavaScript mínimo: estilos de edad desde la API, diálogos, reto de ejemplo, cabecera y revelados al hacer scroll.
- Sin analítica, sin cookies de seguimiento y sin píxeles de terceros.

## Arranque

Requiere Node 20.19+ o 22.12+ (hay un `.nvmrc` con Node 22).

```bash
npm install
npm run dev
```

La web estará en <http://localhost:8082>.

```bash
npm run build      # comprueba tipos y genera dist/
npm run preview    # sirve dist/ en local
npm run typecheck  # solo TypeScript
```

## Acceso

La pantalla `/login/` tiene dos puertas:

1. **Cuenta gacarbla (adultos).** Abre la ventana oficial `https://api.gacarbla.es/users/login?popup=1&return=…`. Las credenciales, el MFA y la verificación de email se gestionan en `api.gacarbla.es`; edu no las ve. Si el navegador bloquea la ventana, el acceso continúa en la misma pestaña con el redirect oficial y vuelve a edu con `auth=redirect`. En ambos casos, al volver se restaura la cookie `HttpOnly` con DPoP + WebSocket, se lee `/users/v1/me` y se hace `exchange` a `edu`.
2. **Alumnado sin cuenta API.** Formulario propio de edu con alias, contraseña y PIN o pregunta de seguridad; usa HPKE y el login de menor documentado. Sigue el mismo sistema visual que la portada.

Si la cuenta principal no tiene fecha de nacimiento, edu no muestra un error de soporte: pide **completar el perfil de edu**. La fecha se autocompleta y queda bloqueada; el **nombre visible de edu es independiente** y puede ser distinto del nombre o apodo de la cuenta principal. Los datos legales que faltan se guardan en la cuenta principal, de modo que ambos perfiles siguen vinculados y sincronizados.

La API debe autorizar el origen de edu tanto en `CORS_ORIGINS` como en `returnOrigins` de `/users/auth/config`. Además, `session/restore` es same-origin y el refresh está atado al `jkt` del navegador que hizo login; para que el acceso adulto funcione desde edu hace falta un puente de sesión en la API (código de un solo uso canjeado con la clave DPoP de edu, o reemisión de la familia). El detalle está en `docs/API-INTEGRATION.md`.

## Aplicación de aulas

La app vive en **`/app/`** y requiere sesión. Usa las mismas claves visuales y los estilos por edad de la portada.

- **Mis aulas:** lista de aulas, creación de aula personal y acceso a cada aula.
- **Temario:** carpetas, páginas Markdown, edición con control de versión, publicación/despublicación, duplicado, borrado, búsqueda y comentarios.
- **Personas:** censo, cambios de rol, expulsión, invitaciones con enlace `/join/?code=…` y revocación.
- **Ejercicios:** creación de opción múltiple, verdadero/falso y respuesta corta; intentos del alumnado y corrección automática.
- **Boletín:** progreso, intentos, notas manuales y nota ponderada.
- **Mensajes:** hilos alumno-docente y tutor-docente.
- **Aprobaciones:** el tutor revisa y responde las acciones sensibles de un menor.
- **Centros:** formulario de solicitud del programa para centros.
- **Perfil:** alias de edu, nombre visible independiente de la cuenta API y preferencias de notificación.

La UI cubre los tres tipos de ejercicio más habituales. La API ya expone además archivos adjuntos, emparejar, ordenar, rellenar huecos, audio/dibujo y administración de centros; esas pantallas quedan para la siguiente iteración.

La sesión edu se guarda en `sessionStorage` solo con el refresh token (nunca el access) y se rota con DPoP. El nombre visible de edu es independiente del `displayName` de la cuenta API: la mayoría de cuentas usan apodos y edu permite otro nombre.

La portada enlaza los CTAs de creación a `/login/?next=/app/`; los enlaces de invitación llevan a `/join/?code=…`.

## Estilos por edad

La portada pública, sin sesión, se sirve **siempre en el estilo de 10 años** (`kid`). No hay botones, ajustes ni demo que cambien el aspecto en directo.

Al entrar, la interfaz se elige por la fecha de nacimiento exacta del perfil (8–12, 13–17, 18–64 o 65+); las bandas legales de la API solo se usan como respaldo. El estilo se aplica así:

```ts
window.dispatchEvent(new CustomEvent('edu:set-age-mode', { detail: 'teen' }));
```

Valores: `kid` (8–12), `teen` (13–17), `adult` (18–64), `senior` (65+). La función real está en `src/lib/age-mode.ts`. Si la API renderiza el HTML con la edad ya conocida, puede servir `<html data-age="teen">` para evitar cualquier parpadeo.

Reglas:

- **No se guarda la edad ni la franja en el cliente.** La API decide y la portada solo aplica el estilo.
- No guardes fechas de nacimiento en el frontend; usa la franja que devuelva el servidor.
- La portada no debe volver a introducir un selector de edad.
- La adaptación es una línea dentro de privacidad, no una sección que explique el sistema de diseño.

## Límites y centros

| Nivel | Límites | Requisitos |
| --- | --- | --- |
| Cuenta personal | 1 aula · hasta 12 plazas | Ninguno especial |
| Programa para centros | Sin límite de aulas ni plazas para las cuentas docentes | Centro educativo adherido y compromiso legal con seguridad y protección de menores |

Consecuencias del programa: **3 avisos leves o 1 aviso grave** → retirada de todas las licencias y bloqueo del acceso al programa.

La sección `#centros` y la FAQ son la fuente de verdad visible. Si cambian las condiciones, actualiza ambas y `DESIGN.md`.

## Imagen

La lección de ejemplo usa una fotografía real de un prisma separando la luz blanca, de **Kelvinsong** (Wikimedia Commons, **CC0**). Está recortada a 16:9 y convertida a WebP/JPEG. La atribución aparece en la propia tarjeta y en [CREDITS.md](./CREDITS.md).

Para cambiar la imagen, sustituye `public/images/prism-light.jpg` y `.webp` manteniendo el alt y el crédito.

## Despliegue

GitHub Pages publica `dist/` con el workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

1. Se ejecuta en cada `push` a `main` y a mano (`workflow_dispatch`).
2. Instala con `npm ci`, comprueba tipos y compila con Vite.
3. Sube el artefacto estático y lo despliega en el entorno `github-pages`.

El repositorio ya incluye `public/CNAME` con `edu.gacarbla.es` y `public/.nojekyll`.

### Configuración única de Pages

1. **Settings → Pages → Build and deployment → Source:** *GitHub Actions*.
2. **Custom domain:** `edu.gacarbla.es`.
3. En Cloudflare, crea un registro **CNAME**:
   - Nombre: `edu`
   - Destino: `gacarbla.github.io`
   - Proxy: **DNS only** (nube gris), para que GitHub pueda emitir el certificado.
4. Cuando GitHub muestre el certificado como emitido, activa **Enforce HTTPS**.

Si GitHub pide verificar el dominio, añade el TXT `_github-pages-challenge-gacarbla.edu` con el valor que indique. El despliegue funciona igualmente en `https://gacarbla.github.io/gacarbla.edu/` mientras el DNS no esté listo.

### Versiones

- La versión vive en `package.json` y se refleja en [CHANGELOG.md](./CHANGELOG.md).
- Los tags siguen `vMAJOR.MINOR.PATCH` (por ejemplo, `v0.1.0`).
- El workflow [`.github/workflows/release.yml`](./.github/workflows/release.yml) crea una release al empujar un tag `v*`.

```bash
npm version minor -m "chore(release): %s"
git push --follow-tags
```

> Si cambia el dominio, actualiza `public/CNAME`, `public/robots.txt`, `public/sitemap.xml`, el README y la configuración de Pages.

## Estructura de archivos

```text
.
├─ .github/workflows/          # CI, deploy a Pages y releases
├─ index.html                     # portada completa (HTML semántico)
├─ login/index.html               # acceso de adultos y alumnado
├─ public/
│  ├─ images/prism-light.*        # foto real CC0 (JPEG + WebP)
│  ├─ fonts/                      # Bricolage Grotesque + Instrument Sans
│  └─ CNAME, .nojekyll, OG, robots, sitemap, manifest
├─ src/
│  ├─ main.ts
│  ├─ login.ts                    # formulario de alumnado y puerta de adultos
│  ├─ api/
│  │  ├─ config.ts                # API_BASE_URL / WS_URL
│  │  ├─ errors.ts                # ApiError y códigos reintentables
│  │  └─ http.ts                  # fetch + DPoP + reintento único
│  ├─ auth/
│  │  ├─ device.ts                # clave P-256 no extraíble en IndexedDB
│  │  ├─ dpop.ts                  # proof ES256
│  │  ├─ hpke.ts                  # HPKE X25519 / AES-128-GCM
│  │  ├─ ws.ts                    # hello, eventos y frames
│  │  ├─ session.ts               # sesiones users/edu en memoria
│  │  ├─ users.ts, edu.ts         # restore, exchange, refresh, logout
│  │  ├─ popup.ts                 # ventana oficial de api.gacarbla.es
│  │  └─ index.ts                 # orquestación + estilo por edad
│  ├─ lib/
│  │  ├─ age-mode.ts              # estilos por edad + edad exacta
│  │  ├─ aula-demo.ts             # reto interactivo del aula
│  │  └─ dialogs.ts, header.ts, reveal.ts
│  └─ styles/
│     ├─ main.css                 # orden de capas
│     ├─ tokens.css               # color, tipo, espacio, sombras
│     ├─ base.css                 # base y accesibilidad
│     ├─ layout.css               # containers y cabeceras de sección
│     ├─ components.css           # botones, cabecera, diálogos
│     ├─ sections.css             # hero, pasos, centros, confianza, FAQ, footer
│     ├─ modes.css                # estilos kid/teen/adult/senior
│     └─ utilities.css            # sr-only, revelados, impresión
├─ DESIGN.md
├─ CREDITS.md
└─ LICENSE
```

## Accesibilidad

- HTML semántico, un solo `h1`, landmarks y enlaces de salto.
- Foco visible, navegación completa con teclado y diálogos nativos (`<dialog>`).
- Una sola maqueta de producto, con su etiqueta **Ejemplo** y sin métricas inventadas.
- La fotografía tiene alt descriptivo y crédito visible.
- Sin marquesina ni animaciones de fondo; el reto es una interacción real y acotada.
- La aparición al hacer scroll se desactiva con `prefers-reduced-motion`.
- Se respeta el contraste alto del sistema con `prefers-contrast: more`.
- La escala raíz respeta el tamaño de letra configurado en el navegador.
- Lighthouse en build de producción: **accesibilidad 100, buenas prácticas 100, SEO 100**.
- Sin testimonios inventados, cuentas atrás falsas ni patrones oscuros.

## Privacidad

- Sin cookies de seguimiento ni analítica de terceros.
- Fuentes e imagen servidas desde el propio dominio.
- **No se guarda ninguna preferencia de edad en el dispositivo.** La franja la aporta la API al identificarse.
- Los datos de ejemplo están etiquetados como ejemplo y no se presentan como contenido real.
- Las afirmaciones de seguridad describen principios y reglas de producto; el sistema completo se documentará antes de la beta.

## Contenido y marca

- Nombre y wordmark: `gacarbla.edu`. El icono es un libro abierto con una chispa.
- Voz: cercana, clara y directa. Frases cortas, sin jerga y sin infantilizar.
- Paleta: verde bosque, crema, amarillo sol, coral y menta.
- La fotografía real sustituye a la ilustración vectorial del prisma.

Antes de abrir la beta, revisa con el equipo de API y legal las frases sobre límites, centros, avisos, licencias y protección de menores.

## Contribuir

1. Abre una rama desde `main`.
2. Ejecuta `npm install` y `npm run dev`.
3. Mantén el foco en accesibilidad, rendimiento y claridad de contenido.
4. Antes de abrir un PR: `npm run build`.
5. Si añades una imagen, documenta su licencia en `CREDITS.md`.

No se aceptan scripts de seguimiento, contenido que suplante aulas reales, selectores de edad en la portada ni cambios que rompan los estilos `kid`/`senior`.

## Licencia

MIT. Consulta [LICENSE](./LICENSE).
