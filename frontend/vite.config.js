import { URL, fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';

import { version } from './package.json';

/** @type {import('vite').UserConfig} */
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const { VITE_DEV_SERVER } = process.env;
  return defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [react()],
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      open: false,
      port: 5174,
      proxy: {
        '/api': {
          target: VITE_DEV_SERVER || 'http://192.168.68.115',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: proxy => {
            proxy.on('error', err => {
              console.log('proxy error', err);
            });
          },
        },
      },
    },
    build: {
      outDir: '../static/dist',
      emptyOutDir: true,
      sourcemap: true,
    },
    optimizeDeps: {
      include: ['@emotion/react', '@emotion/styled', '@mui/material/Tooltip'],
    },
  });
};
