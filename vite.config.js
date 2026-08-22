import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        demo: resolve(import.meta.dirname, 'demo.html'),
        dict: resolve(import.meta.dirname, 'dict.html'),
        matrix: resolve(import.meta.dirname, 'matrix.html')
      }
    }
  }
});
