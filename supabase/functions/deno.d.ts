// Type definitions for Supabase Edge Functions (Deno environment)

declare namespace Deno {
  export const env: {
    get(name: string): string | undefined;
  };

  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

// Global fetch types (already available in modern environments)
declare const fetch: typeof globalThis.fetch;
declare const Request: typeof globalThis.Request;
declare const Response: typeof globalThis.Response;
declare const Headers: typeof globalThis.Headers;
