# Changelog

Todos los cambios relevantes de gacarbla.edu se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado semántico [SemVer](https://semver.org/lang/es/).

## [Unreleased]

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

[Unreleased]: https://github.com/gacarbla/gacarbla.edu/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gacarbla/gacarbla.edu/releases/tag/v0.1.0
