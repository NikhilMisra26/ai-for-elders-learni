## Secure Stripe Subscription Integration for Vercel + Supabase

### Overview
We are integrating Stripe Checkout + Stripe Customer Portal into a Vercel-hosted app using Supabase for authentication and subscription storage.

### Why this approach
* Security-first: Card details never touch our app (PCI SAQ A scope).
* Minimal overhead: Stripe handles payments UI, compliance, and SCA.
* Scalable: Works fine on Vercel’s Hobby plan until traffic is very large.
* Maintainable: Webhooks act as the single source of truth for subscription state.

---

## Step 1 — Stripe & Environment Setup (Manual step — no Claude execution yet)
**Goal:** Prepare Stripe + Vercel so the integration can run securely.

#### Stripe Dashboard
Create your Products and Prices (advanced, expert).

Enable:
* Link
* Apple Pay
* Google Pay

Copy the price_... IDs for each plan.

#### Environment Variables
In Vercel → Project → Settings → Environment Variables:

Server-only (never exposed):

```
ini
Copy
Edit
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PRICE_ID_ADVANCED=price_...
PRICE_ID_EXPERT=price_...
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
```

Frontend-safe (OK to expose):

```
ini
Copy
Edit
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=public_anon_key_here
```

Also create a local `.env.local` with the same variables for development.

Ensure `.env.local` is in `.gitignore`.

Safety notes:
* Never prefix server-only keys with `VITE_`.
* Never commit `.env.local` to Git.
* Treat the `SUPABASE_SERVICE_ROLE_KEY` as extremely sensitive — it bypasses RLS.

---

## Step 2 — Checkout Session Endpoint
**Goal:** Let authenticated users start a subscription via Stripe Checkout.

Prompt for Claude:

In `/api/checkout/session.ts`, implement a Vercel serverless function that:
* Requires POST requests from authenticated Supabase users.
* Reads the selected plan from request body.
* Uses STRIPE_SECRET_KEY to create a Checkout Session:
	* mode: "subscription".
	* Price ID from env vars (PRICE_ID_ADVANCED or PRICE_ID_EXPERT).
	* Success and cancel URLs (placeholder for now).
	* Metadata: supabase_user_id.
* Returns the session.url in JSON.
* Handles invalid input and Stripe API errors with proper HTTP codes.

Test plan:
* Use curl or Postman to hit endpoint with valid auth token and plan.
* Expect JSON with url.
* Try without auth → expect 401.
* Try invalid plan → expect 400.

---

## Step 3 — Customer Portal Endpoint
**Goal:** Let users manage billing details and cancel subscriptions.

Prompt for Claude:

In `/api/portal.ts`, implement a Vercel serverless function that:
* Requires POST requests from authenticated users.
* Fetches stripe_customer_id from Supabase.
* Uses STRIPE_SECRET_KEY to create a Billing Portal session.
* Returns the url in JSON.
* Handles missing customer IDs gracefully.

Test plan:
* Call endpoint with a user who has stripe_customer_id.
* Expect redirect URL.
* Call with a user who has no Stripe ID → expect 404 or clear error.

---

## Step 4 — Webhook Handler
**Goal:** Keep Supabase subscription state in sync with Stripe.

Prompt for Claude:

In `/api/webhooks/stripe.ts`, implement a Vercel serverless function that:
* Reads raw request body.
* Verifies Stripe signature with STRIPE_WEBHOOK_SECRET.
* Handles:
	* checkout.session.completed
	* customer.subscription.created
	* customer.subscription.updated
	* customer.subscription.deleted
	* invoice.payment_succeeded
	* invoice.payment_failed
* Uses SUPABASE_SERVICE_ROLE_KEY to update subscriptions table.
* Logs event IDs only (no sensitive payload).
* Responds quickly (200 OK).

Test plan:
* Use stripe listen CLI to forward events to local dev server.
* Trigger each event type via test mode and verify DB updates.
* Send event with wrong signature → expect 400.

---

## Step 5 — Database Migration
**Goal:** Add Stripe fields to subscriptions table.

Prompt for Claude:

Write SQL migration to:

Add:
```
stripe_customer_id text,
stripe_subscription_id text,
stripe_price_id text,
status text,
cancel_at_period_end boolean,
current_period_end timestamptz.
```

Update RLS so only service-role key can write these.

Leave all existing columns/data untouched.

Test plan:
* Run migration.
* Try insert/update with service role key → success.
* Try with anon key → fail.

---

## Step 6 — Frontend Integration
**Goal:** Add UI for upgrading, managing billing, and showing status.

Prompt for Claude:

On account/settings page:
* Add “Upgrade” button → POST /api/checkout/session → redirect to session.url.
* Add “Manage Billing” button → POST /api/portal → redirect to url.
* Fetch subscription status from Supabase and display it.
* Use Supabase auth context for current user.

Test plan:
* Click Upgrade → see Stripe Checkout.
* Click Manage Billing → see Stripe Portal.
* Status changes after webhook events.

---

## Step 7 — Test Mode QA
**Goal:** Validate the entire flow in Stripe test mode.

Prompt for Claude:

Write a full QA checklist to:
* Buy subscription with test card.
* Confirm webhook updates Supabase.
* Confirm status in UI.
* Cancel in Portal → confirm DB/UI update.
* Simulate failed payment → confirm status change.

---

## Step 8 — Go Live
**Goal:** Switch to live mode safely.

Manual steps:
* Replace test keys with live keys in Vercel env vars.
* Add live webhook secret.
* Update live domain in Stripe Dashboard.
* Test real card payment and Portal.
* Monitor logs for 48 hours.

---

## Security Rules Recap
* Never expose Stripe secret keys or Supabase service role key to frontend.
* Always verify webhook signatures.
* Only trust subscription state updated from webhooks.
* Keep `.env.local` out of Git.
* Use Vercel env vars for production secrets.

---

## Security Hardening Addendum (Read This Before Implementing)
The following expands each step with explicit security controls and implementation guardrails. These instructions are written so an AI coding assistant (Claude) produces correct, safe code. Do not delete earlier sections; this augments them.

### Threat Model (Primary Surfaces)
| Surface | Potential Threats | Mitigations Required |
|---------|-------------------|-----------------------|
| `/api/checkout/session` | Plan / price ID tampering, unauthorized access, replay, abuse via high frequency | Auth required, strict allow‑list mapping of plan->PRICE_ID env, rate limiting, idempotency keys if client retries, short timeouts |
| `/api/portal` | Unauthorized access to another customer's portal, user w/out customer id enumeration | Auth required, fetch customer id server-side only, 404 generic message |
| `/api/webhooks/stripe` | Forged events, replay, race conditions, secret leakage, logging PII | Raw body signature verification, store & check processed event IDs, log only event.id + type, strict event switch, fast 200 |
| Supabase subscription table | Privilege escalation, direct user writes, status spoofing | RLS (read-only per user), only service-role key updates Stripe fields via webhook |
| Secrets (env) | Accidental exposure in bundle, logs, git | No `VITE_` prefix for server secrets, `.env.local` gitignored, NEVER console.log secrets |
| Metadata / Logs | Leakage of card data or PII | Never log raw Stripe objects; only derived minimal fields (ids, status) |
| Denial of Service | Excessive creation attempts | Lightweight rate limit (IP+user) and early input validation |

### Mandatory Implementation Guardrails (Claude MUST follow)
1. Never import or initialize Stripe with a secret key inside client/browser code.
2. All serverless functions go in `/api/` at the repo root (Vercel convention). Filenames: `api/checkout/session.ts`, `api/portal.ts`, `api/webhooks/stripe.ts`.
3. Use `stripe` npm package (pin version e.g. `^14.x`). Instantiate once per file: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });` (adjust to current stable).
4. Validate HTTP method (`POST` only). Reject others with `405` + `Allow: POST` header.
5. Authentication:
	 * Expect `Authorization: Bearer <supabase-jwt>` header from client.
	 * Verify JWT using Supabase client created with anon key (NOT service role) server-side, OR call Supabase auth endpoint; if invalid → 401.
6. Never trust `plan` beyond mapping: `const priceId = plan === 'advanced' ? process.env.PRICE_ID_ADVANCED : plan === 'expert' ? process.env.PRICE_ID_EXPERT : null;` If null → 400.
7. Do not accept arbitrary `price_id` from client; ignore if supplied.
8. Checkout Session:
	 * `mode: 'subscription'`, `allow_promotion_codes: true` (optional), `metadata: { supabase_user_id: user.id }`.
	 * Provide explicit `success_url` & `cancel_url` referencing production and local dev domains via env (e.g. `APP_URL` + query placeholders) rather than hardcoded localhost.
9. Customer Portal:
	 * Retrieve user's `stripe_customer_id` (select only that column) from Supabase; if missing → 404 with generic `{ error: 'No billing profile' }`.
10. Webhook handler:
		* Must read raw body (no JSON auto-parse). In Vercel functions, access `req` as a Node stream; accumulate Buffer.
		* Use `const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)` inside try/catch.
		* Idempotency: Before acting, check if `event.id` already processed (create a table `stripe_event_log(event_id text primary key, processed_at timestamptz default now())`). Insert with `on conflict do nothing`; if conflict, return 200 early.
		* Handle only whitelisted event types; default branch returns 200 without action.
		* For subscription events extract: status, current_period_end, cancel_at_period_end, price id, customer id, subscription id. Update row keyed by `stripe_subscription_id` or user id (metadata from checkout session if needed).
		* Absolutely never log full `event` or `data.object`; log only: `console.log('[stripe-webhook]', event.id, event.type);`
11. Database writes use Supabase service role key ONLY inside webhook (and optionally a background job). Do not expose service role key elsewhere.
12. RLS Policies: Ensure ordinary users cannot update Stripe fields; if absent, add: `USING (auth.uid() = user_id)` for select, and `WITH CHECK (false)` for updates on those columns.
13. Error Handling:
		* Return JSON shape `{ error: 'message' }` with safe generic phrasing.
		* Do not propagate internal stack traces to client.
14. Rate Limiting (baseline): For `checkout` & `portal` endpoints implement an in-memory (or edge KV) token bucket keyed by user id + minute; limit (e.g. 5/min). If limit exceeded → 429.
15. Timeouts: Stripe SDK calls should rely on default http timeout; keep function logic minimal to avoid Vercel cold start overhead.
16. Dependency Safety: Pin `stripe` version; no unmaintained third-party wrappers.
17. Types: Use Stripe TypeScript types; enable `strict` in `tsconfig` if not already.
18. Testing: Provide sample CURL commands (without real keys) and a mocked webhook payload test harness script.
19. No PII in Analytics: When adding metrics, only send anonymized, non-sensitive events (no emails, no Stripe IDs to third-party analytics unless required and documented).
20. Secret Rotation: Document procedure (rotate in Stripe Dashboard → add new env var → deploy → remove old key); code must read from env per invocation (no compile-time embedding).

### Additional SQL Migration Requirements (Augment Step 5)
Add table for webhook idempotency & tighten policies:
```
create table if not exists public.stripe_event_log (
	event_id text primary key,
	processed_at timestamptz default now()
);

-- RLS (allow read only to service role if desired; otherwise disable RLS for this table)
alter table public.stripe_event_log enable row level security;
create policy "deny all" on public.stripe_event_log for all using (false) with check (false);
-- Optionally allow select for debugging with service role only (handled via key not by policy).
```

Tighten subscription column write access (pseudo-policy snippet – adjust table/column names):
```
alter table public.subscriptions enable row level security;

-- Users can select only their row
create policy "subscriptions_select_own" on public.subscriptions
	for select using ( auth.uid() = user_id );

-- Block direct user updates to Stripe-managed fields
create policy "subscriptions_no_user_update" on public.subscriptions
	for update using (false) with check (false);

-- (Updates happen via service role key outside RLS evaluation.)
```

### Webhook Event Handling Mapping (Minimum Required Fields)
| Event | Extract | Action |
|-------|---------|--------|
| `checkout.session.completed` | session.id, session.metadata.supabase_user_id, session.customer, session.subscription | Store stripe_customer_id (if new), link subscription id |
| `customer.subscription.created` / `updated` | id, customer, status, current_period_end, cancel_at_period_end, items[0].price.id | Upsert subscription record |
| `customer.subscription.deleted` | id | Mark status = 'canceled' |
| `invoice.payment_succeeded` | subscription, customer | (Optional) mark last_paid_at |
| `invoice.payment_failed` | subscription | Mark status = 'past_due' or store latest_invoice_status |

### Minimal Data Model (Conceptual)
`subscriptions` table columns (existing + new): `id (uuid) | user_id (uuid fk) | stripe_customer_id | stripe_subscription_id | stripe_price_id | status | cancel_at_period_end | current_period_end | last_paid_at timestamptz | created_at | updated_at`.

### Logging & Monitoring
* Only log: timestamp, function name, event.id, event.type, subscription id, user id (uuid). Nothing else.
* Add simple anomaly detection: If more than N failed signature validations in 5m → temporarily log a warning (possible probing).

### Local Dev & Testing Instructions (Non-sensitive)
```
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Simulate checkout in test mode via hitting `/api/checkout/session` then opening returned URL.

### Sample cURL (Placeholders Only)
```
curl -X POST https://your-app.vercel.app/api/checkout/session \
	-H "Authorization: Bearer <SUPABASE_JWT>" \
	-H "Content-Type: application/json" \
	-d '{"plan":"advanced"}'

curl -X POST https://your-app.vercel.app/api/portal \
	-H "Authorization: Bearer <SUPABASE_JWT>"
```

### Security Review Checklist Before Go-Live
* [ ] All server secrets absent from client bundle (grep for key prefixes).
* [ ] Webhook rejects invalid signatures.
* [ ] Idempotent processing verified (duplicate delivery ignored).
* [ ] RLS prevents user writes to Stripe fields.
* [ ] No logs contain card data / PII (sample logs inspected).
* [ ] Rate limiting triggers when exceeding threshold.
* [ ] Dependency scan clean (e.g. `npm audit` high severity = 0).
* [ ] Stripe test subscriptions exercise all event branches.
* [ ] Secret rotation procedure documented and tested on staging.

### Important Reality Note
No system can be declared “100% safe”; these controls minimize realistic risks by delegating card handling to Stripe (PCI scope reduction to SAQ A) and enforcing least privilege & integrity checks. Continue periodic reviews and updates.

---

## Claude Code Generation Reminder (Condensed Directives)
Implement ONLY backend logic inside `/api` using server-side env vars; never expose secrets; verify auth & webhook signatures; enforce allow-lists; perform idempotent, minimal, logged (non-sensitive) updates; and avoid logging raw Stripe objects.

---

## CRITICAL SECURITY REQUIREMENTS - MUST READ BEFORE ANY IMPLEMENTATION

### Zero-Trust Security Architecture
Every request must be treated as potentially hostile. No assumptions about client trustworthiness.

### PCI DSS 4.0 Compliance Requirements (Mandatory by March 2025)
- **Network Segmentation**: All payment processing must be isolated
- **Encryption**: TLS 1.3 minimum for all API communications
- **Key Management**: Rotate all keys quarterly, immediately on suspected compromise
- **Logging**: Audit all payment attempts without logging PII/card data
- **Access Control**: Implement least privilege for all operations

### Supabase Security Critical Updates (2025)
- **Asymmetric JWT Migration**: All projects must migrate to asymmetric JWTs by October 2025
- **Service Role Key Risks**: This key bypasses ALL Row Level Security - treat as TOP SECRET
- **JWT Verification**: Always verify using JWKS endpoint, never trust client-provided tokens
- **RLS Enforcement**: Never store authorization data in user_metadata (user-modifiable)

### Vercel Serverless Security Patterns
- **Cold Start Security**: Initialize security contexts outside handler for reuse
- **Environment Variables**: Never log or expose process.env values
- **Edge Middleware**: Pre-filter malicious requests before function execution
- **Timeout Handling**: Set aggressive timeouts to prevent DoS
- **Memory Limits**: Enforce limits to prevent resource exhaustion

### Supply Chain Security
- Pin all dependencies to exact versions
- Run npm audit before every deployment
- Use Stripe's official SDK only (no wrappers)
- Verify package integrity with npm ci

### Incident Response Plan
1. **Detection**: Monitor for failed signature verifications, rate limit violations
2. **Containment**: Immediately rotate compromised keys
3. **Eradication**: Identify and fix vulnerability
4. **Recovery**: Restore service with enhanced monitoring
5. **Lessons**: Document and update security procedures

### Security Testing Requirements
Before ANY deployment:
- [ ] Penetration testing on payment flows
- [ ] JWT signature bypass attempts
- [ ] Rate limiting effectiveness
- [ ] Error message information leakage
- [ ] Timing attack resistance
- [ ] CSRF token validation

### Legal Liability Protection
- **Data Minimization**: Never store data you don't need
- **Audit Trail**: Log security events for legal compliance
- **Terms of Service**: Must include payment processing disclaimers
- **Privacy Policy**: Must detail Stripe data sharing
- **PCI Attestation**: Maintain quarterly compliance reports

### Red Flags - STOP IMMEDIATELY IF:
- Any code attempts to log Stripe secret keys
- Frontend code imports Stripe with secret key
- Service role key appears in client bundle
- Raw card numbers appear anywhere in logs
- Webhook signature verification is disabled
- Rate limiting is removed or bypassed

Remember: One security breach can destroy the entire business. When in doubt, choose the more secure option.


