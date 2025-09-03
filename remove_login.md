# Remove Login Requirement — Keep Infra and Progress Tracking

## Goal

- Remove the requirement to sign in to access any page (home, courses, modules, dashboard, account).
- Preserve all authentication/subscription infrastructure (Supabase schema, auth flows, contexts, routes, components) for future re‑enablement.
- Maintain user progress tracking without requiring logins, with a security posture that does not weaken database RLS or introduce unsafe anonymous writes.
- Provide a simple, senior‑friendly experience (no passwords; clear “keep my progress” language) with optional cross‑device progress via a secure “save link”.

## Summary Of Current State

- Framework: Vite + React + TypeScript; routing in `src/App.tsx` with `react-router-dom`.
- Auth: `src/contexts/AuthContext.tsx` uses Supabase Auth; `ProtectedRoute` gates most pages; `AuthForm` handles login/register/OTP.
- Progress: `src/lib/progressTracking.ts` reads/writes progress to Supabase when `user` exists. Without a user, progress only lives in memory and is lost on reload.
- Database: `supabase.schema.sql` defines profiles/subscriptions/course_progress/module_progress/user_activity with strict RLS that requires `role = authenticated` and `auth.uid()` row ownership.
- Security posture: strong. No public writes are allowed; RLS requires authenticated users. This must remain intact.

## Non‑Goals

- Do not remove Supabase tables, RLS, or auth logic. We are disabling enforcement at the UI/router layer only.
- Do not relax RLS to permit generic anonymous read/write to user tables.
- Do not use IP address tracking (unreliable, invasive, and not identity).
- Do not introduce device fingerprinting.

## Key Constraints & Principles

- RLS stays strict; no DB writes from unauthenticated clients to user‑scoped tables.
- Progress without login must be device‑bound by default (local persistence) or tied to a user‑held bearer secret (save/restore link).
- Seniors first: messaging and flows must be clear (“Save my progress on this device”, “Copy my save link”).
- Privacy first: no IP or fingerprinting; no PII without consent.

## Options Considered (Decision)

1) Local‑only persistence (device‑bound)
   - Store course/module progress in `localStorage` or `IndexedDB` under a generated `guest_id`.
   - Pros: simple, private, zero server changes, no RLS risk; ideal baseline.
   - Cons: no cross‑device sync unless user manually exports/imports.

2) “Save Link” with Supabase RPC (bearer secret)
   - Add a new `guest_progress` table and two SECURITY DEFINER RPCs (`guest_progress_put/get`) keyed by a 128‑bit secret. Store/restore a JSON blob.
   - Pros: optional cross‑device sync without accounts; keeps RLS on all user tables.
   - Cons: adds SQL and small client logic; must handle rate‑limits and secret handling carefully.

Decision: Implement Option 1 now to remove login gating and preserve progress per device. Add Option 2 as Phase 2 (optional) for cross‑device syncing via a save link.

---

## Implementation Plan (Phase 1: Local‑Only, No Login Required)

High‑level: Introduce “guest mode” identity + local persistence; remove ProtectedRoute gating; keep all auth infra dormant.

### 1) Guest Identity & Persistence

- Add `src/lib/guestId.ts`:
  - `getOrCreateGuestId(): string` — generates a UUIDv4 (crypto) and stores in `localStorage` under `guest_id`.
  - `clearGuestId(): void` — for “reset progress”.

- Add `src/lib/guestStorage.ts`:
  - Thin wrapper around `localStorage` (or `indexedDB` future) for keys under `guest:{guest_id}:...`.
  - JSON safe parse/stringify with error handling.

- Add `src/lib/guestProgress.ts`:
  - Data shape mirrors `UseProgressReturn` slices from `src/lib/progressTracking.ts`:
    - `ModuleProgress[]`, `CourseProgress[]`, `UserActivity[]`, `LearningStats`.
  - Functions:
    - `loadGuestProgress(guestId): GuestProgressSnapshot`
    - `saveGuestProgress(guestId, snapshot): void`
    - `exportGuestProgress(guestId): string` (base64 JSON)
    - `importGuestProgress(guestId, base64Json): void`
    - `resetGuestProgress(guestId): void`

Notes:
- Keep file/module boundaries small and typed.
- All writes should be debounced to avoid excessive `localStorage` churn.

### 2) Extend useProgress To Support Guest Mode

- In `src/lib/progressTracking.ts`:
  - Detect `user` from `useAuth()`. If no user, enter “guest mode”.
  - On mount in guest mode: `const guestId = getOrCreateGuestId()` and `loadGuestProgress(guestId)` to hydrate state.
  - After every state update in guest mode (module complete, course update, stats changes, activity log), call `saveGuestProgress(guestId, snapshot)`.
  - When a user logs in in the future, we can provide a separate merge path (Phase 3 below).

Implementation detail:
- Build a small `selectSnapshot()` helper that turns current React state into the persisted snapshot to keep serialization consistent.
- Add simple migration guards (version tag in snapshot) for future changes.

### 3) Remove Login Gating From Routes

- In `src/App.tsx`:
  - Replace each `<ProtectedRoute ...>` wrapper with direct component rendering for non‑admin pages.
    - `/courses/basic`, `/courses/advanced`, `/courses/expert`, module routes, `/dashboard`, `/account`, `/reviews` should render directly.
  - Retain the hidden Security Dashboard opening logic but ensure it still requires an authenticated admin (as it does today). This keeps admin tooling protected without re‑introducing login to learners.
  - Stop opening the `AuthForm` dialog via `onAuthRequired` flows; keep the dialog code in place but it should never auto‑open.

- In `src/components/ProtectedRoute.tsx`:
  - Leave the component in place for future use, but have its default behavior in non‑admin contexts be a no‑op pass‑through when `user` is null (render children without login prompts). Keep the admin role path returning AccessDenied as today.
  - Alternatively, remove usages and add a deprecation JSDoc while keeping the file intact.

### 4) Allow Starting/Continuing Courses Without Login

- In `src/components/CoursesPage.tsx`:
  - `handleStartCourse`: remove the `if (!user) onAuthClick()` branch. Always run `startCourse(courseId)`.
  - Advanced/Expert: keep “Coming Soon” UI already present instead of tier gating.

- In `src/components/ModulePage.tsx` and progress actions:
  - Ensure “complete module” paths work in guest mode (useProgress will persist locally).

### 5) Dashboard/Account In Guest Mode

- `src/components/DashboardPage.tsx` and `AccountPage-enhanced.tsx`:
  - Ensure all stats read from `useProgress` render in guest mode.
  - Add subtle label “Saved on this device” near progress widgets.

- Add a new “Backup/Restore” card on Account page:
  - Buttons: “Export Progress”, “Import Progress”, “Reset Progress on This Device”.
  - Export copies a base64 JSON to clipboard or triggers a file download; Import reads a file or pasted base64; Reset clears guest storage keys.
  - This is optional UI if you prefer to defer to Phase 2’s save link; keeping it here helps seniors without accounts.

### 6) Header/Auth UX

- `src/components/Header.tsx`:
  - Remove login prompts from the main nav (keep Account/Progress links active for everyone).
  - If there’s a visible “Sign In” button, hide it by default (can be re‑enabled later). Keep “Sign Out” visible only when a user is actually signed in.

- `AuthForm` remains available but should never block navigation.

### 7) Analytics & Testimonials

- `src/lib/analytics.ts` (testimonials): keep “submit” gated on user presence. In guest mode, either hide the action or show “Sign‑in coming soon”. No DB changes needed.
- Platform stats/testimonials fetching remains unchanged.

### 8) Validation & Quality

- Update docs where relevant (README quick blurb) to explain guest progress and save/restore.
- Run:
  - `pnpm run typecheck`
  - `pnpm run lint:fix`
  - `pnpm run build`

Manual QA checklist:
- Navigate to all pages without login; no auth dialogs appear.
- Start a course, complete a module, refresh page → progress persists.
- Export progress, reset, import → progress restored.

---

## Implementation Plan (Phase 2: Optional Cross‑Device Sync via Save Link)

Goal: Allow seniors to optionally save progress to the cloud without an account using a private bearer secret they control (a link or short code). Keep user tables/RLS unchanged.

### A) Supabase SQL (new table + RPC)

Add to `supabase.schema.sql` (idempotent style):

```sql
-- GUEST PROGRESS TABLE (no PII)
CREATE TABLE IF NOT EXISTS public.guest_progress (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret      text UNIQUE NOT NULL,
  data        jsonb NOT NULL,
  user_agent  text,
  last_ip     inet,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_progress ENABLE ROW LEVEL SECURITY;

-- No direct select/update policies for anon; allow insert only so RPC can upsert safely.
DROP POLICY IF EXISTS guest_progress_insert ON public.guest_progress;
CREATE POLICY guest_progress_insert
  ON public.guest_progress
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_guest_progress_updated_at ON public.guest_progress;
CREATE TRIGGER update_guest_progress_updated_at
  BEFORE UPDATE ON public.guest_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: upsert by secret
CREATE OR REPLACE FUNCTION public.guest_progress_put(p_secret text, p_data jsonb, p_user_agent text default null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- enforce minimum secret length (128-bit base64url ≈ 22 chars) to avoid weak keys
  IF length(p_secret) < 22 THEN
    RAISE EXCEPTION 'weak secret';
  END IF;

  INSERT INTO public.guest_progress (secret, data, user_agent)
  VALUES (p_secret, p_data, p_user_agent)
  ON CONFLICT (secret)
  DO UPDATE SET data = EXCLUDED.data,
                user_agent = EXCLUDED.user_agent,
                updated_at = now();
END;
$$;

-- RPC: get by secret
CREATE OR REPLACE FUNCTION public.guest_progress_get(p_secret text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT data FROM public.guest_progress WHERE secret = p_secret LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.guest_progress_put(text, jsonb, text) TO anon;
GRANT EXECUTE ON FUNCTION public.guest_progress_get(text) TO anon;
```

Notes:
- Keep RLS strict on user tables; we only add a separate bucket for guest blobs.
- The RPCs are SECURITY DEFINER and parameterized; do not log `p_secret`.
- Optionally add an index on `(secret)` and row TTLs if storage growth matters.

### B) Client Changes

- `src/lib/guestId.ts`:
  - Generate a second value `guest_secret` (random 128‑bit, base64url). Store alongside `guest_id`.

- `src/lib/guestProgress.ts`:
  - Add `syncToCloud(secret, snapshot)` → `supabase.rpc('guest_progress_put', { p_secret: secret, p_data: snapshot, p_user_agent: navigator.userAgent })`.
  - Add `fetchFromCloud(secret)` → `supabase.rpc('guest_progress_get', { p_secret: secret })`.

- UI (Account page):
  - Add “Save Progress Link” button that copies a URL like: `https://app.example.com/#save=<base64url(secret)>`.
  - On app load, if URL hash `save=` is present and no user is logged in:
    - Fetch the blob via RPC and hydrate local guest progress; store secret locally for future sync.
  - Add “Sync Now” button to manually push local progress to cloud.

Security & UX:
- Treat the link as a private key; anyone with it can load that progress. Use plain language: “Anyone with this link can view your progress. Keep it private.”
- Do not expose the secret in logs or analytics.
- Rate‑limit client calls best‑effort and rely on Supabase org quotas.

---

## Future: Re‑Enable Logins + Migrate Guest Progress (Phase 3)

When auth returns, we should allow users to “claim” their guest progress.

### A) Client Merge (Local‑Only Baseline)

- On successful login, read guest snapshot (`guest_id`) and write it into the user tables by calling existing upserts in `progressTracking.ts`.
- Mark a client flag `guest_migrated:true` so we don’t re‑merge repeatedly.

### B) Client Merge (Cloud Save Link)

- If a `guest_secret` is present or provided by the user:
  - Fetch guest blob via RPC and merge into authenticated profile (call existing DB upserts).
  - Optionally add a “Delete guest cloud record” action that calls a future authenticated RPC to purge it.

### C) Keep Admin/Security Tools As Is

- Security dashboard remains gated to authenticated admins only.
- No changes to existing RLS on user tables.

---

## Risks, Limitations, and Mitigations

- Device‑only persistence can be lost if the user clears browser data. Mitigation: clear messaging, optional export or save link.
- Save‑link model is bearer‑secret; if the link is shared, others can view the progress. Mitigation: clear warnings; allow reset.
- We intentionally avoid IP‑based tracking (unreliable, privacy‑sensitive, not a stable identity).
- We avoid weakening RLS or adding open anonymous write paths to user tables.

---

## File‑By‑File Change List (Phase 1)

- `src/lib/guestId.ts` — new module for guest ID management.
- `src/lib/guestStorage.ts` — new module wrapping localStorage access.
- `src/lib/guestProgress.ts` — new persistence helpers (load/save/export/import/reset).
- `src/lib/progressTracking.ts` — add guest mode: hydrate from local, persist on change; no server writes when `!user`.
- `src/App.tsx` — remove `ProtectedRoute` gating; stop opening `AuthForm` automatically.
- `src/components/ProtectedRoute.tsx` — make non‑admin usage a pass‑through (or remove usages; keep file for future).
- `src/components/CoursesPage.tsx` — allow `startCourse` without login; keep “Coming Soon” tier UI.
- `src/components/DashboardPage.tsx`, `src/components/AccountPage-enhanced.tsx` — ensure guest mode rendering; add “Saved on this device” indicator; add backup/restore UI (export/import/reset).
- `src/components/Header.tsx` — remove sign‑in prompts in nav; keep sign‑out only when authenticated.

Optional Phase 2
- `supabase.schema.sql` — add `guest_progress` table + RPCs (put/get) as above.
- `src/lib/guestProgress.ts` — add `syncToCloud` and `fetchFromCloud` helpers.
- `src/App.tsx` — parse URL fragment `#save=...` on load to hydrate guest data.
- `Account` UI — add “Save Progress Link” and “Sync Now”.

---

## Exact Steps For An LLM To Execute (Phase 1)

1) Create files:
   - `src/lib/guestId.ts`
   - `src/lib/guestStorage.ts`
   - `src/lib/guestProgress.ts`

2) Implement guest ID and storage helpers with TS types and safe JSON handling.

3) Modify `src/lib/progressTracking.ts`:
   - Import guest helpers; detect guest mode (`!user`).
   - On mount, hydrate state from `loadGuestProgress` when guest.
   - On state changes (module completion, course updates, stats), debounce `saveGuestProgress` when guest.
   - Keep existing Supabase upserts intact for when `user` exists.

4) Update routing in `src/App.tsx`:
   - Remove `<ProtectedRoute>` wrappers around all learner pages.
   - Ensure the hidden admin Security Dashboard remains behind the authenticated admin check.

5) Adjust components:
   - `CoursesPage.tsx`: remove `onAuthClick()` gating in `handleStartCourse`.
   - `Header.tsx`: hide sign‑in CTA; keep sign‑out button only if `user`.
   - `DashboardPage.tsx`, `AccountPage-enhanced.tsx`: ensure they read from `useProgress` without requiring `user`; add “Saved on this device” note; add a simple backup/restore panel.

6) Validate locally:
   - `pnpm run typecheck && pnpm run lint:fix && pnpm run build`.
   - Manual navigation across pages; verify progress persists across refresh and browser restarts.

7) Document briefly in `README.md` that the app now works without login and progress is stored on the device, with optional export/import.

---

## Open Questions For You

- Do you want Phase 2 (save link with cloud sync) now, or keep Phase 1 (local‑only) for simplicity?
- Any regulatory constraints (GDPR/CPRA) requiring a consent banner for local persistence?
- Should “Account” show different wording in guest mode (e.g., “Your Progress” instead of “Account”)?
- For future auth return, do you prefer automatic merge of guest progress on first login, or an explicit “Import my device progress” step?

---

## Why IP‑Based Tracking Is Not Recommended

- IPs are shared (NAT), dynamic, and often masked (VPNs), leading to incorrect associations.
- They are considered personal data under many regulations and require extra care/consent.
- IPs don’t represent a stable identity across sessions or devices.

The above plan avoids these pitfalls and maintains your current security standards while making the experience login‑free for seniors.

