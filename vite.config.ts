import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
//
// Dev-server proxy mirrors the former CRA src/setupProxy.js: requests to /api
// are forwarded to the backend with the /api prefix stripped, and /version is
// proxied through as-is. SSE (/api/sync/stream) needs buffering disabled so
// events flush immediately.
export default defineConfig({
  // @vitejs/plugin-react v6 transforms JSX via Vite's Rust toolchain (no Babel),
  // so it doesn't read the project Babel config — the build is self-contained.
  plugins: [react()],
  server: {
    port: 5081,
    proxy: {
      // SSE stream: backend route is /sync/stream/:sessionId.
      // The frontend calls /api/sync/stream/:sessionId, so rewrite /api -> ''.
      '/api/sync/stream': {
        target: 'http://localhost:5080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['x-accel-buffering'] = 'no';
            proxyRes.headers['cache-control'] = 'no-cache';
            proxyRes.headers['connection'] = 'keep-alive';
          });
        },
      },
      // General API: strip the /api prefix before forwarding to the backend.
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Version endpoint: forward as-is.
      '/version': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Match the directory referenced by nginx, the Dockerfile, the prerender
    // postbuild step, and the CI build artifact upload.
    outDir: 'dist',
  },
});
