# Revisión de diseño: login y área de usuario

Fecha: 13/11/2026
Participan: Mara (producto y UX), Ivo (diseño visual), Noa (movimiento e interacción), Dra. Elena (psicología y protección de menores), Ada (accesibilidad y frontend) y Teo (contenido y voz).

Este documento recoge la conversación y las decisiones. No es una suma de opiniones: cada propuesta se contrastó con las demás hasta llegar a un acuerdo.

## 1. El problema

**Mara:** El login actual parece una página de marketing con dos formularios. La persona no sabe si tiene que entrar por la ventana de la API o por el alias de edu. En el área de usuario, el programa para centros compite con las aulas y el perfil está escondido.

**Ivo:** Visualmente hay demasiados bloques: cabecera, intro, dos tarjetas, formulario y footer. La tarjeta central pierde fuerza. El área de usuario usa el mismo peso para todo, así que nada parece prioritario.

**Dra. Elena:** Para un menor, una pantalla con dos caminos y dos formularios a la vez aumenta la carga cognitiva. Necesitamos una sola decisión por pantalla y un lenguaje que no haga sentir mal a quien se equivoca.

**Ada:** Además, al cambiar de paso el foco se queda en el botón anterior. Si el contenido se reemplaza sin mover el foco ni anunciar el cambio, un lector de pantalla no se entera.

**Noa:** Y no hay transición: el contenido salta. Eso hace que la interfaz se sienta barata aunque los colores estén bien.

**Teo:** “Acceder con cuenta” y “acceder con usuario” se parecen demasiado. Hay que explicar en una línea qué es cada cosa, sin tecnicismos.

## 2. La propuesta que se acordó

**Ivo:** Un único escenario: fondo cálido, un contenedor centrado de esquinas muy redondeadas y, dentro, siempre el mismo esqueleto: icono, título, descripción y contenido. El contenedor no se mueve; solo cambia el contenido. Así la persona no pierde el sitio.

**Mara:** De acuerdo, pero la primera pantalla debe ser una decisión, no un formulario. Dos opciones grandes: **Acceder con cuenta** (API) y **Acceder con usuario** (edu). Cada una con una línea de apoyo.

**Teo:** “Acceder con cuenta” = “Para tu cuenta de gacarbla”. “Acceder con usuario” = “Para el alias de tu aula”. Nada de “API” en la interfaz.

**Dra. Elena:** La opción de cuenta no debe pedir la contraseña en edu. Eso transmite desconfianza. Mostramos un mensaje de carga y explicamos que la ventana oficial se encarga. La persona solo espera.

**Noa:** En la opción de cuenta, el cambio a loader tiene que ser inmediato, con una animación calmada. Nada de barra de progreso falsa. Si la ventana se bloquea, el fallback a la misma pestaña ya existe y se mantiene.

**Ada:** El loader necesita `role="status"` y un texto que no dependa solo del color. Si el usuario prefiere menos movimiento, el spinner se convierte en un pulso suave o en texto estático.

**Mara:** Para el alumnado, el flujo es: alias y contraseña → si son correctos, elegir el segundo paso (PIN o pregunta) → entrar. Nunca mostramos el segundo paso antes de saber que la contraseña es correcta.

**Ada:** Eso exige que la API distinga “contraseña correcta, falta el segundo factor” de “credenciales incorrectas”. Si no, la interfaz miente. La API ya puede devolver `EDU_SECOND_FACTOR_REQUIRED` con los métodos disponibles.

**Noa:** El cambio de credenciales a método se hace con un fundido corto y el foco se mueve al título del nuevo paso. Al volver, el foco vuelve al primer campo.

**Teo:** Si la API antigua no devuelve ese código, no dejamos a nadie fuera: mostramos un enlace discreto “Usar mi segundo paso” que permite continuar. Es una red de seguridad, no el camino principal.

**Dra. Elena:** En el paso de método, una sola pregunta: “¿Cómo quieres verificar que eres tú?”. Si solo hay un método, se muestra igualmente como una opción seleccionada, para que la persona sepa qué va a pasar. La pregunta de seguridad se muestra tal cual, sin reformularla.

**Ada:** Los campos llevan etiqueta visible, `autocomplete` correcto, error junto al campo y un mensaje global con `role="alert"`. El botón de enviar se desactiva mientras se comprueba. Nada de errores que borren lo escrito.

**Ivo:** La tarjeta tendrá un icono distinto por paso, un borde superior sutil, fondo papel, radio 2rem y una sombra suave. El fondo lleva dos halos muy difuminados; nada de ruido. En móvil, la tarjeta ocupa el ancho con margen.

**Noa:** Duraciones de 180–240 ms, `ease-out`. El hover de las tarjetas sube 2 px. El dropdown del perfil aparece con un desplazamiento de 6 px y se cierra con Escape o clic fuera. Todo con `prefers-reduced-motion`.

## 3. El área de usuario

**Mara:** La navegación principal debe ser “Mis aulas”. El perfil va arriba a la derecha con una flecha y un desplegable: Mi perfil, Aprobaciones (si procede), Programa para centros y Cerrar sesión. Centros deja de ser una pestaña principal: se usa de vez en cuando.

**Ivo:** El desplegable lleva el avatar con la inicial, el nombre de edu y el alias. Los items tienen 44 px de alto. “Programa para centros” va separado y en un tono más discreto.

**Dra. Elena:** El alumnado no debe ver “Programa para centros” ni “Aprobaciones”. Esas opciones no son para ellos y añaden ruido.

**Ada:** El botón del perfil necesita `aria-haspopup="menu"`, `aria-expanded` y devolver el foco al cerrar. El menú se puede recorrer con flechas.

**Noa:** Las tarjetas de aula entran con un fundido y un desplazamiento mínimo al cambiar de ruta. El hover no mueve el layout; usa `transform` y sombra.

**Ivo:** El panel de aula usa una cabecera clara, pestañas tipo segmento y tarjetas de contenido con más aire. Los botones destructivos van en ghost, no en el mismo peso que “Crear página”.

**Mara:** El estado vacío del alumnado no debe ofrecer “Crear aula”. Debe decir que abra el enlace de invitación. El del docente ofrece crear el aula.

**Teo:** Los textos del área son cortos y en segunda persona: “Tu temario”, “Tu grupo”, “Comparte una invitación”. Nada de “gestione sus recursos”.

## 4. Decisiones finales

| Tema | Decisión | Responsable |
| --- | --- | --- |
| Login | Una sola tarjeta persistente con icono, título, descripción y contenido | Ivo |
| Puertas | “Acceder con cuenta” y “Acceder con usuario”, con una línea de apoyo | Mara + Teo |
| Cuenta API | Loader + ventana oficial; sin contraseña en edu | Mara + Elena |
| Usuario edu | Credenciales → segundo factor → app | Mara + Ada |
| Segundo factor | La API devuelve `EDU_SECOND_FACTOR_REQUIRED` con el método efectivo | Ada |
| Fallback API antigua | Enlace discreto para continuar con el segundo paso | Ada |
| Movimiento | 180–240 ms, foco movido, `prefers-reduced-motion` | Noa + Ada |
| App | “Mis aulas” como única pestaña primaria | Mara |
| Perfil | Avatar + nombre + flecha + dropdown accesible | Ivo + Ada |
| Centros | En el dropdown, separado y discreto | Mara |
| Alumnado | Sin crear aula, sin centros, sin aprobaciones | Elena + Mara |

## 5. Criterios de aceptación

- [ ] El contenedor del login no cambia de posición entre pasos.
- [ ] La primera pantalla solo ofrece dos decisiones.
- [ ] La cuenta API no pide credenciales en edu.
- [ ] El alumnado no ve el segundo paso si la contraseña es incorrecta (API nueva).
- [ ] El foco se mueve al título o al primer campo de cada paso.
- [ ] Los errores se anuncian con `role="alert"` y no borran los campos.
- [ ] El perfil está arriba a la derecha, con flecha y menú.
- [ ] Centros no aparece en la navegación principal.
- [ ] El alumnado no ve acciones de docente.
- [ ] Todo funciona con teclado y con movimiento reducido.
- [ ] 360, 768 y 1440 px sin desbordamiento.
