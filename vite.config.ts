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
    // Whitelist only necessary environment variables for security
    const allowedEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const filteredEnv = Object.keys(env)
      .filter((key) => allowedEnvVars.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: env[key] }), {});
    dotenvExpand.expand({ parsed: filteredEnv });
  }

  return {
    plugins: [
      // SWC plugin already targets modern JSX transform; no explicit option needed
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
      // Ensure a single React instance and avoid duplicate copies across deps
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // Pre-bundle React dependencies to avoid runtime issues
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    server: {
      // Strict CORS configuration for development server
      cors: {
        origin: ['http://localhost:5173'],
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
          'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")',
        // Development CSP that allows Vercel Blob storage for audio files and Vercel Analytics

        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' https://*.public.blob.vercel-storage.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:* https://*.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';",
      },
    },
    preview: {
      // Security headers for preview server (production preview)
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        'Permissions-Policy':
          'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")',
        // Preview CSP that allows Vercel Blob storage for audio files and Vercel Analytics

        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' https://*.public.blob.vercel-storage.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';",
      },
    },
    build: {
      // Disable sourcemaps in production for security and performance
      sourcemap: mode !== 'production',
      target: 'es2020',
      // Use Vite defaults for chunking and vendor splitting to guarantee
      // correct dependency ordering on all hosts (e.g., Vercel).
      rollupOptions: {},
      ...(mode === 'production' && {
        minify: 'esbuild',
        reportCompressedSize: false,
        chunkSizeWarningLimit: 1000,
      }),
    },
    // Environment-specific configurations
    define: {
      __DEV__: mode !== 'production',
    },
  };
}) as (config: { mode: string }) => UserConfig);
