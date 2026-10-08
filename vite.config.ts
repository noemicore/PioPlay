import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas para que funcione dentro de la app Android.
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
