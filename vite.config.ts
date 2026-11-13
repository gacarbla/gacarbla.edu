import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// El sitio se publica en la raíz de edu.gacarbla.es desde GitHub Pages.
// Si algún día se sirve desde un subdirectorio, cambia `base`.
export default defineConfig({
  base: '/',
  // 8082 está en CORS_ORIGINS de la API para desarrollo local.
  server: {
    port: 8082,
    strictPort: true,
  },
  preview: {
    port: 8082,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        login: resolve(process.cwd(), 'login/index.html'),
      },
    },
  },
});
