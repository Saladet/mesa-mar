import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Cada publicación lleva su propia versión del service worker, para que los móviles se actualicen
function versionServiceWorker() {
  let salida = 'dist';
  return {
    name: 'mesa-version-sw',
    apply: 'build',
    configResolved(config) {
      salida = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const ruta = resolve(salida, 'sw.js');
      if (!existsSync(ruta)) return;
      const sw = readFileSync(ruta, 'utf8');
      writeFileSync(ruta, sw.replace('__VERSION__', Date.now().toString(36)));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), versionServiceWorker()],
  build: { target: 'es2020' },
});
