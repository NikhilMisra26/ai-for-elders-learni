import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(
  (({ mode }): UserConfig => ({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    server: {
      // Security headers for development server
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(), payment=(self https://checkout.stripe.com)',
        // Note: CSP is handled by meta tags in HTML due to Vite's dynamic imports in dev
      },
    },
    preview: {
      // Security headers for preview server (production preview)
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(), payment=(self https://checkout.stripe.com)',
        // Note: CSP is handled by meta tags in HTML
      },
    },
    build: {
      // Disable sourcemaps in production for security and performance
      sourcemap: mode !== 'production',
      // Configure build for SPA deployment
      rollupOptions: {
        output: {
          // Optimized chunking strategy for better caching
          manualChunks: (id) => {
            // Core React libraries
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom')
            ) {
              return 'react-vendor';
            }

            // Supabase client - separate chunk for authentication/database
            if (
              id.includes('node_modules/@supabase') ||
              id.includes('src/lib/supabaseClient')
            ) {
              return 'supabase';
            }

            // Radix UI components - large UI library
            if (id.includes('node_modules/@radix-ui')) {
              return 'radix-ui';
            }

            // Framer Motion - animation library
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-motion';
            }

            // React Query - data fetching
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'react-query';
            }

            // Other large dependencies
            if (id.includes('node_modules/react-router-dom')) {
              return 'router';
            }

            // Group other node_modules into a general vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      // Production-specific optimizations
      ...(mode === 'production' && {
        minify: 'esbuild',
        reportCompressedSize: false, // Faster builds
        chunkSizeWarningLimit: 1000,
      }),
    },
    // Environment-specific configurations
    define: {
      __DEV__: mode !== 'production',
    },
  })) as (config: { mode: string }) => UserConfig,
);
