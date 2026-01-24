/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ANALYTICS_CACHE_DURATION_MS?: string;
  readonly VITE_MIN_USERS?: string;
  readonly VITE_MIN_COMPLETION_RATE?: string;
  readonly VITE_MIN_RATING?: string;
  readonly VITE_MIN_COUNTRIES?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
