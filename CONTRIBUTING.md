# Contribuir

Gracias por querer mejorar gacarbla.edu. Este es el frontend público y la portada es la primera impresión del producto: cuidamos el detalle, el rendimiento y, sobre todo, la accesibilidad.

## Antes de empezar

- Node 20.19+ o 22.12+ (recomendado: Node 22, ver `.nvmrc`).
- `npm install`
- `npm run dev` (sirve en `http://localhost:8082`)

## Flujo de trabajo con git

`main` está protegida: no se empuja directamente. Cada cambio entra por pull request.

1. Actualiza `main`:

   ```bash
   git switch main
   git pull --ff-only
   ```

2. Crea una rama corta y descriptiva:

   | Prefijo | Uso |
   | --- | --- |
   | `feat/` | funcionalidad nueva |
   | `fix/` | corrección de un fallo |
   | `docs/` | documentación |
   | `refactor/` | reestructuración sin cambio de comportamiento |
   | `perf/` | rendimiento |
   | `test/` | pruebas |
   | `chore/` | herramientas, dependencias, CI |
   | `ci/` | workflows y despliegue |

   ```bash
   git switch -c feat/login-alumnado
   ```

3. Haz commits pequeños y coherentes. Usamos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

   ```text
   feat(login): añade el formulario de alumnado
   fix(a11y): devuelve el foco al botón al cerrar el diálogo
   docs: explica el puente de sesión con la API
   chore(deps): actualiza vite a la última versión 7.x
   ```

4. Comprueba tipos y build antes de subir:

   ```bash
   npm run build
   ```

5. Sube la rama y abre el pull request:

   ```bash
   git push -u origin feat/login-alumnado
   gh pr create --fill
   ```

6. El PR debe pasar el check **`build`** de CI. Se fusiona con **Squash and merge** para mantener `main` lineal.

7. Borra la rama al fusionar:

   ```bash
   git switch main
   git pull --ff-only
   git branch -d feat/login-alumnado
   ```

## Versiones y releases

La versión vive en `package.json` y en `CHANGELOG.md`. Se usa SemVer: `MAJOR.MINOR.PATCH`.

1. Actualiza `CHANGELOG.md` en el PR del cambio.
2. Prepara la versión en `main`:

   ```bash
   npm version minor -m "chore(release): %s"
   ```

   Eso actualiza `package.json`, crea el commit y el tag `vX.Y.Z`.
3. Empuja el commit y el tag:

   ```bash
   git push --follow-tags
   ```

4. El workflow `release.yml` comprueba que el tag coincide con `package.json` y crea la GitHub Release con las notas generadas.

## Checklist de PR

- [ ] Funciona con teclado y el foco se ve.
- [ ] No rompe `prefers-reduced-motion` ni el alto contraste del sistema.
- [ ] El contraste de cualquier texto nuevo cumple AA.
- [ ] Los controles principales siguen teniendo un área táctil cómoda.
- [ ] El contenido es claro, en español de España y sin promesas que el producto no cumpla.
- [ ] No se añaden cookies, analítica, píxeles ni peticiones a terceros.
- [ ] Las aulas o datos inventados están etiquetados como ejemplo.
- [ ] Si añades una imagen, su licencia está documentada en `CREDITS.md`.
- [ ] `npm run build` pasa.
- [ ] Se revisó el cambio en modo `kid` y `senior`.
- [ ] No se versiona documentación privada de la API (`docs/api/`, `docs/legal/`).

## Accesibilidad

Es un requisito, no un extra. Si añades un diálogo, usa `<dialog>` o gestiona el foco manualmente. Si añades una animación, debe respetar `prefers-reduced-motion`. Si añades un botón, debe tener nombre accesible y estado (`aria-pressed`, `aria-expanded`, etc.) cuando corresponda.

## Contenido

- No se aceptan testimonios, cifras de alumnos presentadas como reales, reseñas ni logos de clientes inventados.
- Las afirmaciones sobre moderación, edades o datos deben reflejar lo que existe de verdad. Si aún no existe, se explica como principio y se marca como pendiente.
- La voz es cercana y directa; evita la jerga y el tono condescendiente.

## Convivencia

Este proyecto trabaja para una plataforma que quieren usar menores. Mantén un trato respetuoso, no publiques datos personales de terceros y no introduzcas contenido discriminatorio, sexual o violento. Las discusiones técnicas se hacen sobre el código, no sobre las personas.

## Licencia

Al contribuir aceptas que tu aportación se publique bajo la licencia MIT del repositorio.
