# Production Readiness Plan

This checklist captures the remaining work required to launch **AI for Elders** in production.

## Environment & Infrastructure

- Provision a Supabase project and execute the provided SQL migrations for schemas and testimonials【F:README.md†L68-L86】
- Copy `.env.example` to `.env.local` and supply Supabase credentials and other environment variables such as metric thresholds【F:README.md†L88-L93】【F:src/hooks/useMetrics.ts†L23-L36】

## Backend Services

- Replace the simulated payment helper with a real provider like Stripe and handle webhooks and payment records【F:BackendImplementations.md†L12-L17】【F:src/lib/subscription.ts†L329-L356】
- Enforce subscription tiers server-side and restrict premium content via RLS policies【F:BackendImplementations.md†L19-L23】
- Persist invoice history in Supabase instead of local storage and support pagination & PDF downloads【F:BackendImplementations.md†L25-L29】
- Implement transactional email workflows for verification and receipts【F:BackendImplementations.md†L31-L35】
- Move rate limiting to a durable store and expose an API for attempt tracking【F:BackendImplementations.md†L37-L41】

## Frontend & UX

- Restrict the security dashboard shortcut to administrators or remove it from production builds【F:src/App.tsx†L76-L83】
- Build the MDX-based content pipeline for course modules and connect it to the frontend renderer【F:PRODUCTION_README_v2.md†L5347-L5368】
- Ensure metrics and testimonials render only when thresholds are met and data is available【F:README.md†L7-L15】

## Security & Monitoring

- Maintain comprehensive security measures including rate limiting, CSRF/XSS protection, and session management【F:README.md†L31-L35】
- Wire the global error handling service to an external logger for production monitoring【F:src/lib/errorHandler.ts†L1-L44】

## Testing & CI/CD

- Expand unit tests beyond the provided example to cover authentication, payments, and content access【F:PRODUCTION_README_v2.md†L5414-L5423】
- Set up a GitHub Actions workflow to lint, build, and test on every push【F:PRODUCTION_README_v2.md†L5424-L5438】
- Resolve existing ESLint errors before release【a10861†L1-L24】

## Accessibility & Final QA

- Verify senior-friendly features such as large fonts, audio narration, touch targets, and WCAG compliance across devices【F:README.md†L24-L29】
- Confirm dynamic metrics and testimonials pull real data from Supabase with appropriate caching【F:README.md†L7-L15】

Complete these tasks to ensure the platform meets production reliability, security, and usability standards.

Critical / Security (fix first)
Auth not enforced on paid endpoints.
server/server.js trusts userId/userEmail from the client when creating a Stripe Checkout session. There’s no verification of a Supabase JWT (Authorization: Bearer …) server-side. Anyone could start a checkout for any userId.
Fix: Require a Supabase access token, verify it on the server (supabase.auth.getUser(accessToken)), and derive userId/email from the token — ignore client-supplied IDs.

Server env separation & samples.
Backend expects SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL, but there’s no server/.env.example. dotenv.config() will look in server/.env when running from server/.
Fix: Add server/.env.example, and document which envs belong to frontend (VITE_…) vs backend (no prefix).

Stripe webhook robustness.
You correctly use express.raw and verify signatures, and you even reference idempotency RPCs — nice. But production will fail unless the Supabase SQL is applied.
Fix: Ensure supabase/migrations/003_add_webhook_idempotency.sql (and the whole supabase/*.sql) are run on the target project (make a one-liner migration script).

CORS error path.
The custom origin function returns callback(new Error('Not allowed by CORS')) (in server/server.js). If not caught, Express will emit a 500.
Fix: Reply with a 403 JSON on CORS failure or use cors({ origin: allowedOrigins }) after normalizing origins.

Build / Deploy blockers
Bad TypeScript flag in build.
package.json → "build": "tsc -b --noCheck && vite build" — --noCheck is not a valid tsc flag, and -b requires a composite project.
Fix: Change to "typecheck": "tsc --noEmit", and "build": "vite build". If you prefer prebuild checks: "build": "npm run typecheck && vite build".

Husky set up but no hooks.
scripts.prepare = "husky" exists and .husky/ is empty.
Fix: Add pre-commit running eslint + tsc --noEmit.

Workspace vestige.
workspaces: { "packages": ["packages/*"] } but no packages/.
Fix: Remove to avoid confusing pnpm/yarn.

Server production hardening.
Add compression middleware, a stricter helmet config with CSP (allowing fonts.googleapis.com/fonts.gstatic.com), and request logging (pino-http). Document Node version via "engines".

Data integrity / Stripe ↔ Supabase
Don’t trust client amount.
Frontend keeps amounts (VITE_STRIPE_AMOUNT_*) but the server uses only priceId (good). Just make clear in code/comments that server is source of truth; delete client amounts to avoid drift.

Success/cancel UX.
success_url includes ?session_id=… but the frontend doesn’t surface a success state.
Fix: On /account, read session_id and show a friendly “Payment complete” toast + force a subscription refresh.

API design / Architecture
No real routing.
src/App.tsx hand-rolls “routing” via local state; deep-links, back/forward, and refresh are lost.
Fix: Add React Router or TanStack Router; map /, /courses, /dashboard, /account, /support.

Server is one big file.
server/server.js handles CORS, Stripe, Supabase, and validation in a single module.
Fix: Split into middleware/, routes/checkout, routes/portal, routes/webhook, lib/supabase, lib/stripe, and share a zod schema for payloads.

Migrations are optional right now.
You ship great SQL (supabase.schema.sql, supabase/migrations/*).
Fix: Provide a tiny CLI or Makefile: supabase db reset && psql < supabase.schema.sql && for f in supabase/migrations/*.sql; do psql < $f; done.

UX for seniors (comfort & clarity)
Language toggle.
Many elders prefer Spanish or larger localized CTAs.
Fix: Add i18n (e.g., i18next) with EN/ES for titles, toasts, errors, and pricing copy. Persist choice.

Motion sensitivity.
You have animations (tw-animate-css).
Fix: Respect prefers-reduced-motion and expose a “Reduce motion” toggle in AccessibilityContext.

Bigger touch targets / spacing presets.
Ensure min target size ≥ 44×44 px; add a global --touch-target token and apply to buttons, checkboxes, toggles.

Reading aids.
You already expose TTS and font size 💯. Add line spacing options (1.4–1.8), a focus mode (hide side content), and a “high-contrast” switch that goes beyond dark mode (pure grayscale with accent).

Error copy.
Some toasts are generic (“Please try again”).
Fix: Show actionable next steps (“Check your email for the 6-digit code” / “Card declined—try another card or contact bank”).

Session reminders.
useSessionManager auto-extends on activity; also show a 1-minute “Your session will end soon” banner with a large “Stay signed in” button.

Accessibility (a11y)
Dark-mode consistency.
You toggle body.classList.add('dark') and also define Tailwind v4 @custom-variant dark; tailwind.config.js still sets darkMode: ['selector','[data-appearance="dark"]'].
Fix: Pick one. Easiest: keep the .dark class and remove the darkMode selector setting to avoid confusion.

Form semantics.
AuthForm.tsx likely uses custom <Input> components — add aria-invalid, aria-describedby, and proper autoComplete (email, current-password, new-password, one-time-code) to inputs.

Keyboard order / skip link.
Add a “Skip to content” link and ensure dialog & menu components trap focus (Radix usually does, but verify).

TTS fallbacks.
speechSynthesis is gated (good). Add a visible message when unsupported and avoid overlapping utterances (you mostly handle this; also debounce new requests).

Performance
Fonts.
You preconnect & display=swap.
Fix: Preload the specific Inter weights you use or self-host. Consider font-size-adjust to reduce layout shift.

Code-splitting already present.
Nice lazy imports. Also prefetch the next likely route on hover (router.prefetch if you add a router).

API timeouts & retries.
Wrap fetches with timeouts and exponential backoff for flaky networks (seniors often have them). Centralize in src/lib/api.ts.

Content / SEO / PWA
SEO basics missing.
index.html lacks meta description, og:image/title/description, and <meta name="theme-color">.
Fix: Add them and a favicon set.

Installability.
No Web App Manifest or service worker.
Fix: Add a minimal PWA (offline for syllabus pages; cache first for fonts/CSS).

Legal pages.
Add Terms, Privacy, and Refund Policy; link from footer and Stripe Checkout.

DX niceties
Local dev scripts.
Add root scripts to run both servers:

"dev": "concurrently \"vite\" \"npm --prefix server run dev\""

"start:server": "npm --prefix server start"

Remove unused deps.
react-native-dotenv isn’t used; prune. Lock react ecosystem versions to ones your UI lib supports (React 19 is fine today, but verify Radix/shadcn compatibility).

Better error telemetry.
You have a solid errorHandler. Pipe it to Sentry/Better Stack in production with redaction.

Stripe/Supabase specifics (polish)
Customer ↔ profile linking.
After webhook checkout.session.completed, you set stripe_customer_id/stripe_subscription_id — great. Also store latest_invoice_id + plan price id for quick UI render.

Portal session protection.
For /api/create-portal-session, fetch the authenticated user’s stripe_customer_id server-side; don’t accept it from the client.

Invoice history UI.
You have useInvoiceHistory. Surface a CSV download and email receipts toggle.