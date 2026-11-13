# Sistema de diseño — gacarbla.edu

Documento de producto, UX, contenido, UI y accesibilidad. Registra las decisiones del replanteo de la portada y las reglas que deben mantenerse cuando lleguen el login, las invitaciones y el panel del aula.

- Producto: **aulas privadas** para enseñar y aprender.
- No hay cursos públicos, catálogo ni feed.
- Audiencia: de 8 a 99 años.
- Portada pública sin sesión: **estilo de 10 años**.
- Objetivo: entender el modelo, decidir entre crear un aula o entrar con una invitación, y confiar.

## 1. El modelo

1. Las cuentas adultas (18+) pueden crear un aula. Los perfiles de 16–17, con aprobación de su tutor; los menores de 16 entran como alumnos con una invitación. La portada debe reflejar esta restricción de la API.
2. El aula es privada. Se comparte con una invitación y no aparece en buscadores ni directorios.
3. La web no tiene contenido propio: cada aula la construye quien enseña.
4. Los invitados ven lo que su docente decide.
5. Por defecto, **1 aula con hasta 12 plazas**.
6. Los centros educativos pueden adherirse a un programa con compromiso legal; entonces se eliminan los límites para las cuentas docentes que registren.
7. Si un centro incumple: **3 avisos leves o 1 aviso grave** → retirada de todas las licencias y bloqueo del programa.

## 2. Revisión del equipo

La portada anterior tenía diez secciones y repetía cuatro ideas. Se revisó con tres lentes:

### UX / arquitectura de información
- El hero abría con una negación (“no hay cursos”) en lugar de una propuesta de valor.
- El manifiesto, “Dos lados” y “Dentro de un aula” repetían el mismo mensaje.
- Dos mockups de producto competían entre sí; uno de ellos prometía un builder que aún no existe.
- Los cuatro CTAs (`Entrar`, `Tengo una invitación`, `Crear un aula`, `Crear mi aula`) llevaban al mismo modal.
- “1 aula / 12 plazas” aparecía seis veces sin explicar el motivo.
- La adaptación por edad ocupaba una sección entera: es una decisión de implementación, no un beneficio que el visitante compre.

### Educación, psicología y menores
- El envoltorio infantil y el texto contractual no se hablaban.
- “Cualquier adulto puede crear un aula” debía convivir con una explicación muy clara de que **solo se entra por invitación** y de que los menores de 16 no crean aulas, sino que entran como alumnos.
- El aviso de que el sistema de protección está en construcción no podía ser letra pequeña.
- Las métricas inventadas (“8 alumnos dentro”, “3 entregas”) generaban desconfianza.
- “3.º ESO” chocaba con un estilo pensado para 10 años; se sustituyó por un grupo neutro.
- Hacía falta una frase de agencia para el alumno: “Si algo te parece raro, díselo a tu docente.”

### Marketing / conversión
- El segmento de centros estaba enterrado y con un `mailto` como único CTA.
- El límite debía explicarse como una decisión de producto (grupo cercano), no como escasez.
- Las sanciones debían ir después del beneficio, en una línea compacta.
- El CTA de creación no debía prometer un alta que no existe; la beta se explica y se ofrece un email real.
- La prueba del producto es la vista de aula; no hacen falta testimonios ni cifras.

## 3. Decisión: seis bloques

| # | Bloque | Trabajo | CTA |
| --- | --- | --- | --- |
| — | Cabecera | Orientación mínima | Entrar · Crear un aula |
| 1 | Hero | Qué es y cuál es mi puerta | Crear mi aula · Entrar con invitación |
| 2 | Cómo funciona | Tres pasos, sin builder | Enlace a centros |
| 3 | Límites y centros | Decidir si me basta 1 aula o necesito el programa | Crear · Solicitar el programa |
| 4 | Privacidad y menores | Quién entra, quién ve y qué se hace con los datos | — |
| 5 | Preguntas | Resolver solo lo que cambia una decisión | Email |
| 6 | Cierre | Repetir las dos puertas | Crear · Entrar |

**Eliminado:** manifiesto independiente, “Dos lados”, “Dentro de un aula” como sección separada, sección de edades, builder ficticio y CTA final duplicado. **Fusionado:** “Cómo funciona” en una tira de tres pasos; la adaptación por edad en una línea de privacidad; el mock del aula en el hero.

## 4. Hero

Copy recomendado:

> **Tu grupo. Tu temario. Un aula privada.**
> Cualquier adulto puede crear un aula: ordena el temario, comparte una invitación y reúne a su grupo. Los adolescentes de 16–17 pueden crearla con aprobación familiar. No hay catálogo.

- Evita abrir con una negación.
- La restricción de edad de la API aparece en la primera frase, sin esconderla.
- “No hay catálogo” cierra el modelo sin convertirlo en el titular.
- Dos CTAs claros: `Crear mi aula` y `Entrar con una invitación`.
- Tres hechos: 1 aula/12 plazas, solo por invitación, gratis durante la beta.

### Una sola maqueta

El hero contiene la única vista de producto de la página: una lección de ejemplo con:

- barra de aula y etiqueta **Ejemplo**;
- título y explicación breve;
- **fotografía real** de un prisma separando la luz blanca;
- reto interactivo con feedback;
- pie “Aula privada” y enlace “Ver el aula completa”.

No hay métricas inventadas, ni alumnos falsos, ni avisos ficticios. El crédito de la foto es visible.

## 5. Cómo funciona

Tres pasos en una tira horizontal, sin tarjetas ni mock:

1. **Crea el aula** — nombre y grupo; 1 aula y hasta 12 plazas.
2. **Ordena el temario** — módulos, materiales, avisos y retos.
3. **Invita y acompaña** — invitación privada; solo entra quien tú decides.

Debajo, una línea con enlace al programa para centros.

## 6. Límites y centros

- **Cuenta personal:** 1 aula, hasta 12 plazas.
- **Por qué:** “Doce plazas para que el aula siga siendo un grupo, no un curso masivo.”
- **Programa para centros:** sin límite de aulas ni plazas para las cuentas que el centro registre como docentes.
- **Requisito:** compromiso legal con pautas rigurosas de seguridad y protección de menores.
- **Incumplimiento:** 3 avisos leves o 1 aviso grave → todas las licencias retiradas y bloqueo del programa.
- Las condiciones completas se publican antes de la beta.

La regla se presenta en una banda compacta, no como un panel de castigo. El beneficio va antes que la sanción.

## 7. Privacidad y menores

Una banda oscura con cuatro compromisos:

1. **Solo por invitación.** Sin directorio ni buscador.
2. **El docente decide.** Quién entra, qué ve y qué comparte.
3. **Sin anuncios dirigidos.** Ni perfiles publicitarios de menores.
4. **Lectura adaptada.** La letra y el espacio se ajustan a la edad al entrar, sin botones.

Debajo, en tamaño normal:

> El sistema completo de protección de menores está en construcción. Publicaremos la política antes de abrir. Hoy no hay registro ni datos reales.

Y una frase para el alumno: “Si algo te parece raro, díselo a tu docente.”

## 8. Estilos de edad

| Estilo | Edad | Raíz | Radios | Decoración | Movimiento |
| --- | --- | --- | --- | --- | --- |
| `kid` | 8–12 | 112,5 % · 18 px | 34/44 | Completa | Suave |
| `teen` | 13–17 | 106,25 % · 17 px | 28/36 | 45 % | Moderado |
| `adult` | 18–64 | 100 % · 16 px | 24/30 | Ninguna | Sutil |
| `senior` | 65+ | 125 % · 20 px | 18/22 | Ninguna | Mínimo |

- La portada pública sin sesión es siempre `kid`.
- **No hay selector visible**, ni en cabecera, ni en hero, ni en un modal, ni a mitad de página.
- La interfaz se elige por la **fecha de nacimiento exacta** que devuelve el perfil de `users`: 8–12 niño, 13–17 adolescente, 18–64 adulto, 65+ sénior.
- Las bandas legales de la API (`<14`, `14–15`, `16–17`, `18+`) no son una clasificación visual; solo se usan como respaldo si no hay fecha.
- La API puede aplicar el estilo con `edu:set-age-mode` o sirviendo `<html data-age="…">`.
- No se guarda la franja ni la fecha de nacimiento en el cliente; la fecha se usa en memoria y no se registra.
- En el login de alumnado la API solo devuelve la banda legal; se usa como respaldo (`<14` niño, `14–17` adolescente) hasta que exponga fecha exacta o un `uiAgeBand`.
- La sección de edades desaparece: queda una línea en privacidad y una pregunta en la FAQ.

## 9. Acceso

La pantalla `/login/` comparte tokens, tipografía, botones y tarjetas con la portada. Tiene dos puertas:

- **Cuenta gacarbla (adultos):** botón que abre la ventana oficial de `api.gacarbla.es/users/login` en modo popup. La contraseña, el MFA y la verificación de email no pasan por edu; la ventana deja una cookie `HttpOnly` y devuelve el control por `postMessage`. Si el navegador bloquea la ventana, el flujo continúa en la misma pestaña con el redirect oficial y vuelve con `auth=redirect`. Después se restaura la sesión con DPoP + WebSocket, se lee el perfil y se hace `exchange` a edu.
- **Alumnado sin cuenta API:** formulario propio de edu con alias, contraseña y PIN o pregunta de seguridad. Usa HPKE y el login de menor; no hay registro público de alumnos. Sigue el estilo de 10 años de la portada.

Reglas:

- No se piden credenciales de adultos en edu; se delega en la ventana oficial.
- Si la cuenta principal no tiene fecha de nacimiento, no se muestra un error de soporte: se abre una pantalla para crear el perfil edu. La fecha se autocompleta y queda bloqueada; si falta, se escribe en la cuenta principal. El **nombre visible de edu es independiente** y puede diferir del nombre o apodo de la cuenta API.
- El alumnado sí tiene formulario propio, con etiquetas claras, autocompletado y errores específicos.
- El estilo de edad se aplica al completar el acceso; no hay selector.
- La API debe autorizar `https://edu.gacarbla.es` en `CORS_ORIGINS` y en `returnOrigins`, y ofrecer un puente de sesión entre orígenes: `session/restore` es same-origin y el refresh está atado al `jkt` del login.

### Aplicación de aulas

`/app/` es la aplicación privada. Usa las mismas claves visuales, los estilos por edad y un enrutado por hash (`#/aula/…`) para funcionar en GitHub Pages sin servidor. Incluye panel de aulas, temario con carpetas y páginas Markdown, publicación, comentarios, personas e invitaciones, ejercicios, boletín, mensajes, aprobaciones y solicitud de centro.

- La sesión edu se guarda en `sessionStorage` solo con el refresh token; el access vive en memoria y se renueva con DPoP.
- El nombre visible de edu es independiente del `displayName` de la cuenta API. Solo los datos legales que falten (como la fecha de nacimiento) se sincronizan con la cuenta principal.
- Los enlaces de invitación son `/join/?code=…`; el código se muestra una sola vez.
- La app oculta las acciones que el rol no puede hacer, pero la API sigue siendo la autoridad final.

## 10. Accesibilidad

- HTML semántico, un `h1`, landmarks y salto al contenido.
- Diálogos nativos `<dialog>` con foco atrapado y cierre con `Escape`.
- Foco visible de 3 px.
- Imagen con alt descriptivo; crédito visible y en `CREDITS.md`.
- Reto con botones reales, feedback `aria-live` y estado visual/definido.
- `prefers-reduced-motion` desactiva animaciones; no oculta contenido.
- `prefers-contrast: more` refuerza contraste.
- La escala raíz respeta el tamaño de letra del navegador.
- Objetivos táctiles principales ≥ 44 px.
- Lighthouse en producción: **100 accesibilidad, 100 buenas prácticas, 100 SEO**.
- Sin marquesina, scroll infinito, cuentas atrás, testimonios inventados ni urgencia falsa.

## 11. Responsive

- 1180 px: la navegación pasa a menú lateral.
- 960 px: hero, confianza y FAQ a una columna.
- 820 px: planes y reglas se apilan; la lista de confianza pasa a una columna.
- 720 px: CTAs del hero a ancho completo; cabecera con logo y menú.
- 480 px: tarjetas y demo a una columna; se reduce el texto auxiliar.
- 350 px: en sénior se oculta el wordmark para no empujar los controles.
- Probado sin desbordamiento horizontal de 300 a 1500 px en los cuatro estilos.

## 12. Imagen y créditos

- Foto: *Prism flat rainbow (cropped)*, de **Kelvinsong**, Wikimedia Commons, **CC0 1.0**.
- Recorte 16:9 (1200 × 675) y conversión a WebP/JPEG.
- Crédito visible en la tarjeta y en [CREDITS.md](./CREDITS.md).
- Sustituible por una imagen propia manteniendo alt, proporción y crédito.

## 13. Lo que deliberadamente no hacemos

- No fingimos un catálogo ni cursos públicos.
- No usamos testimonios, alumnos, entregas ni reseñas inventadas.
- No incluimos selector de edad ni cambio de aspecto a mitad de página.
- No prometemos un alta que aún no existe: la beta ofrece email y demo.
- No usamos cuentas atrás, “últimas plazas” ni notificaciones falsas.
- No escondemos las sanciones del programa ni las presentamos antes del beneficio.
- No usamos la edad para publicidad.

## 14. Rendimiento y privacidad

- Sin framework de UI. La única dependencia de runtime es `@hpke/core` (HPKE, MIT), exigida por la API.
- CSS y JS propios; imagen social y foto optimizadas.
- Sin peticiones a terceros al cargar.
- Sin cookies, sin analítica y sin `localStorage`.
- `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` y metadatos Open Graph incluidos.

## 15. Extensiones previstas

- **Login e invitaciones:** aplicar `data-age` y redirigir al aula invitada.
- **Panel del aula:** reutilizar tokens y jerarquía; mantener privacidad por defecto.
- **Límites y licencias:** la portada ya explica las reglas; la API implementa contadores, avisos y bloqueo.
- **Centro educativo:** página de condiciones del programa y solicitud.
- **Páginas legales:** privacidad, términos y condiciones del programa.
- **Internacionalización:** extraer cadenas manteniendo la voz.

## 16. Cómo cambiar sin romper el sistema

1. Colores en `tokens.css`; contraste comprobado.
2. Escala, radios y decoración en `modes.css`.
3. Reutiliza `.btn`, `.chip`, `.badge`, `.section-head`, `.tick-list`, `.plan-card` y `.text-link`.
4. Todo control nuevo debe funcionar con teclado y tener foco visible.
5. Toda animación debe respetar `prefers-reduced-motion`.
6. No reintroduzcas selector de edad ni cambio de aspecto a mitad de página.
7. No añadas métricas o testimonios inventados.
8. Antes de publicar: `npm run build` y una pasada visual en 360, 768 y 1440 px en los cuatro estilos.
