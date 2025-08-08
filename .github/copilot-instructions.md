# Copilot Instructions for AI Coding Agents

## Project Overview

- **Type:** React + TypeScript web app, built with Vite, styled using Tailwind CSS.
- **Purpose:** Learning platform for elders, with modular course content, user authentication, and accessibility features.

## Key Architecture & Patterns

- **Entry Point:** `src/main.tsx` mounts `App.tsx`.
- **Routing & Pages:** Main pages/components in `src/components/` (e.g., `HomePage.tsx`, `DashboardPage.tsx`, `AccountPage.tsx`).
- **UI Library:** Custom UI primitives in `src/components/ui/` (e.g., `button.tsx`, `card.tsx`).
- **Context Providers:** App-wide state via React Contexts in `src/contexts/` (e.g., `AuthContext.tsx`, `AccessibilityContext.tsx`).
- **Hooks:** Custom hooks in `src/hooks/` (e.g., `useSessionManager.ts`, `use-mobile.ts`).
- **Business Logic:** Domain logic in `src/lib/` (e.g., `audioNarration.ts`, `progressTracking.ts`).
- **Styling:** Tailwind config in `tailwind.config.js`, theme overrides in `src/styles/theme.css` and `theme.json`.

## Developer Workflows

- **Start Dev Server:** `npm run dev` (Vite)
- **Build:** `npm run build`
- **Preview Production Build:** `npm run preview`
- **Type Checking:** `npx tsc --noEmit`
- **Linting:** (if configured) `npm run lint`

## Project-Specific Conventions

- **Component Naming:** Page-level components use `Page` suffix (e.g., `CoursesPage.tsx`).
- **Enhanced Components:** Files with `-enhanced` (e.g., `AccountPage-enhanced.tsx`) wrap base components with additional logic (e.g., data fetching, context).
- **UI Primitives:** Use/reuse components from `src/components/ui/` for consistent design.
- **Accessibility:** Accessibility logic centralized in `AccessibilityContext.tsx` and related helpers.
- **Course Data:** Course/module data and progress logic in `src/lib/courseData.ts` and `progressTracking.ts`.

## Integration & Data Flow

- **Authentication:** Managed via `AuthContext.tsx` and `SecureRoute.tsx`.
- **Audio Narration:** Provided by `audioNarration.ts` for accessibility.
- **Subscription/Progress:** Managed in `subscription.ts` and `progressTracking.ts`.

## Examples

- To add a new page: create a component in `src/components/`, add to router in `App.tsx`.
- To add a new UI element: implement in `src/components/ui/`, import where needed.
- To extend context: update/create context in `src/contexts/`, wrap in `App.tsx`.

## References

- See `README.md` for high-level project info.
- See `tailwind.config.js` and `theme.json` for styling/theming.
- See `vite.config.ts` for build setup.

---

For questions, review the above files and follow established patterns. When in doubt, prefer composition and reuse of primitives/context.
