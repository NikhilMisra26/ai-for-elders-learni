import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import dotenvExpand from 'dotenv-expand';

// https://vite.dev/config/
export default defineConfig((({ mode }): UserConfig => {
  // Load env files in development for Vercel Blob
  if (mode === 'development') {
    const env = loadEnv(mode, process.cwd(), '');
    dotenvExpand.expand({ parsed: env });
  }

  return {
    plugins: [
      react({
        // Ensure React 19 compatibility
        jsxRuntime: 'automatic',
      }), 
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    optimizeDeps: {
      // Pre-bundle React dependencies to avoid runtime issues
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
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
          // Simplified chunking strategy to prevent React loading issues
          manualChunks: {
            // Ensure React and ReactDOM are in the same chunk and loaded together
            'react-vendor': ['react', 'react-dom'],
            // UI components
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-slot',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip'
            ],
            // Supabase and auth
            'supabase': ['@supabase/supabase-js'],
          },
        },
        // Explicitly define external dependencies that should not be bundled
        external: [],
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
}) as (config: { mode: string }) => UserConfig);
