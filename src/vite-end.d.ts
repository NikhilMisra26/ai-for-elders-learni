/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string;
declare const BASE_KV_SERVICE_URL: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_ANALYTICS_CACHE_DURATION_MS?: string;
  readonly VITE_MIN_USERS?: string;
  readonly VITE_MIN_COMPLETION_RATE?: string;
  readonly VITE_MIN_RATING?: string;
  readonly VITE_MIN_COUNTRIES?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
