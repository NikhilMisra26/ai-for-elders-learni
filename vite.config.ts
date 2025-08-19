import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import dotenvExpand from 'dotenv-expand';

// https://vite.dev/config/
export default defineConfig(
  (({ mode }): UserConfig => {
    // Load env files in development for Vercel Blob
    if (mode === 'development') {
      const env = loadEnv(mode, process.cwd(), '');
      dotenvExpand.expand({ parsed: env });
    }
    
    return {
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
        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(), payment=(self https://checkout.stripe.com)',
        // Note: CSP is handled by platform deployment configs in production (vercel.json/netlify.toml)
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
        // Note: CSP is handled by platform deployment configs in production (vercel.json/netlify.toml)
      },
    },
    build: {
      // Disable sourcemaps in production for security and performance
      sourcemap: mode !== 'production',
      // Ensure proper module format
      target: 'es2020',
      // Configure build for SPA deployment
      rollupOptions: {
        output: {
          // Ensure React is properly initialized in the correct order
          format: 'es',
          // Optimized chunking strategy for better caching
          manualChunks: (id): string | undefined => {
            // Core React libraries - ensure they're in the same chunk and loaded first
            if (id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react/') ||
                id.includes('node_modules/scheduler')) {
              return 'react-vendor';
            }
            
            // Catch any other React-related modules
            if (id.includes('node_modules/react')) {
              return 'react-vendor';
            }

            // Supabase client - separate chunk for authentication/database
            if (id.includes('node_modules/@supabase') || id.includes('src/lib/supabaseClient')) {
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
          // Ensure proper import order
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId : '';
            if (facadeModuleId.includes('react')) {
              return 'assets/[name]-[hash].js';
            }
            return 'assets/[name]-[hash].js';
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
  };
  }) as (config: { mode: string }) => UserConfig,
);
