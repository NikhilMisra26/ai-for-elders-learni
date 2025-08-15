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
      // Strict CORS configuration for development server
      cors: {
        origin: [
          'http://localhost:5173',
          'https://kboefdqxbsdkmnmjosjx.supabase.co',
          'https://checkout.stripe.com',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      // Security headers for development server
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        // Note: CSP is handled by platform deployment configs in production (vercel.json/netlify.toml)
      },
    },
    preview: {
      // Security headers for preview server (production preview)
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        // Note: CSP is handled by platform deployment configs in production (vercel.json/netlify.toml)
      },
    },
    build: {
      // Disable sourcemaps in production for security and performance
      sourcemap: mode !== 'production',
      // Configure build for SPA deployment
      rollupOptions: {
        output: {
          // Optimized chunking strategy for better caching
          manualChunks: (id): string | undefined => {
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

            // Return undefined for other files (default chunking)
            return undefined;
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
