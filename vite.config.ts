import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(
  ((): UserConfig => ({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    build: {
      // Configure build for SPA deployment
      rollupOptions: {
        output: {
          // Ensure proper chunking for SPA
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },
  })) as () => UserConfig,
);
