import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANTE: "base" debe ser "/nombre-de-tu-repo/".
// Si tu repositorio en GitHub se llama distinto a "panel-pacientes",
// cambiá el valor de acá para que coincida exactamente.
export default defineConfig({
  plugins: [react()],
  base: '/panel-pacientes/',
});
