import { defineConfig } from 'vite';
import { resolve } from 'path';

import { processLookup } from './lookup-service.js';

export default defineConfig({
  plugins: [
    {
      name: 'api-lookup-middleware',
      configureServer(server) {
        server.middlewares.use('/api/lookup', (req, res) => {
          const url = new URL(req.url, 'http://localhost');
          const query = url.searchParams.get('q') || 
                        url.searchParams.get('w') || 
                        url.searchParams.get('c') || 
                        url.searchParams.get('word') || 
                        url.searchParams.get('code') || '';
          const result = processLookup(query);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(result, null, 2));
        });
      }
    }
  ],
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
        matrix: resolve(import.meta.dirname, 'matrix.html'),
        dict_matrix: resolve(import.meta.dirname, 'dict-matrix.html'), font_maker: resolve(import.meta.dirname, 'font-maker.html')
      }
    }
  }
});


