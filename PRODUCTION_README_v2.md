# DISCOVER 50 AI — Production Blueprint and Code Reference

_Generated: 2025-08-08 01:37:48 UTC_

## Codebase Tree

```
discover-50-ai/
  .gitignore
  .spark-initial-sha
  LICENSE
  PRD.md
  README.md
  SECURITY.md
  components.json
  index.html
  package-lock.json
  package.json
  tailwind.config.js
  theme.json
  tsconfig.json
  vite.config.ts
  .git/
    HEAD
    config
    description
    index
    packed-refs
    hooks/
      applypatch-msg.sample
      commit-msg.sample
      fsmonitor-watchman.sample
      post-update.sample
      pre-applypatch.sample
      pre-commit.sample
      pre-merge-commit.sample
      pre-push.sample
      pre-rebase.sample
      pre-receive.sample
      prepare-commit-msg.sample
      push-to-checkout.sample
      sendemail-validate.sample
      update.sample
    info/
      exclude
    logs/
      HEAD
      refs/
        heads/
          main
        remotes/
          origin/
            HEAD
    objects/
      info/
      pack/
        pack-4dab3e5a476507f3df2dd9a605b76e4b99cd3573.idx
        pack-4dab3e5a476507f3df2dd9a605b76e4b99cd3573.pack
        pack-4dab3e5a476507f3df2dd9a605b76e4b99cd3573.rev
    refs/
      heads/
        main
      remotes/
        origin/
          HEAD
      tags/
  .github/
    copilot-instructions.md
    dependabot.yml
  src/
    App.tsx
    ErrorFallback.tsx
    index.css
    main.css
    main.tsx
    prd-complete.md
    prd.md
    vite-end.d.ts
    components/
      AccountPage-enhanced.tsx
      AccountPage.tsx
      AuthForm.tsx
      CoursesPage.tsx
      DashboardPage.tsx
      Header.tsx
      HomePage-enhanced.tsx
      HomePage.tsx
      ModulePage.tsx
      SecureRoute.tsx
      SecurityDashboard.tsx
      ui/
        accordion.tsx
        alert-dialog.tsx
        alert.tsx
        aspect-ratio.tsx
        avatar.tsx
        badge.tsx
        breadcrumb.tsx
        button.tsx
        calendar.tsx
        card.tsx
        carousel.tsx
        chart.tsx
        checkbox.tsx
        collapsible.tsx
        command.tsx
        context-menu.tsx
        dialog.tsx
        drawer.tsx
        dropdown-menu.tsx
        form.tsx
        hover-card.tsx
        input-otp.tsx
        input.tsx
        label.tsx
        menubar.tsx
        navigation-menu.tsx
        pagination.tsx
        popover.tsx
        progress.tsx
        radio-group.tsx
        resizable.tsx
        scroll-area.tsx
        select.tsx
        separator.tsx
        sheet.tsx
        sidebar.tsx
        skeleton.tsx
        slider.tsx
        sonner.tsx
        switch.tsx
        table.tsx
        tabs.tsx
        textarea.tsx
        toggle-group.tsx
        toggle.tsx
        tooltip.tsx
    contexts/
      AccessibilityContext.tsx
      AuthContext.tsx
    hooks/
      use-mobile.ts
      useSessionManager.ts
    lib/
      audioNarration.ts
      courseData.ts
      progressTracking.ts
      security.ts
      subscription.ts
      utils.ts
    styles/
      theme.css
```

## Project Metadata

### package.json

```text
{
    "name": "spark-template",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "kill": "fuser -k 5000/tcp",
        "build": "tsc -b --noCheck && vite build",
        "lint": "eslint .",
        "optimize": "vite optimize",
        "preview": "vite preview"
    },
    "dependencies": {
        "@github/spark": "^0.0.1",
        "@heroicons/react": "^2.2.0",
        "@hookform/resolvers": "^4.1.3",
        "@octokit/core": "^6.1.4",
        "@phosphor-icons/react": "^2.1.7",
        "@radix-ui/colors": "^3.0.0",
        "@radix-ui/react-accordion": "^1.2.3",
        "@radix-ui/react-alert-dialog": "^1.1.6",
        "@radix-ui/react-aspect-ratio": "^1.1.2",
        "@radix-ui/react-avatar": "^1.1.3",
        "@radix-ui/react-checkbox": "^1.1.4",
        "@radix-ui/react-collapsible": "^1.1.3",
        "@radix-ui/react-context-menu": "^2.2.6",
        "@radix-ui/react-dialog": "^1.1.6",
        "@radix-ui/react-dropdown-menu": "^2.1.6",
        "@radix-ui/react-hover-card": "^1.1.6",
        "@radix-ui/react-label": "^2.1.2",
        "@radix-ui/react-menubar": "^1.1.6",
        "@radix-ui/react-navigation-menu": "^1.2.5",
        "@radix-ui/react-popover": "^1.1.6",
        "@radix-ui/react-progress": "^1.1.2",
        "@radix-ui/react-radio-group": "^1.2.3",
        "@radix-ui/react-scroll-area": "^1.2.9",
        "@radix-ui/react-select": "^2.1.6",
        "@radix-ui/react-separator": "^1.1.2",
        "@radix-ui/react-slider": "^1.2.3",
        "@radix-ui/react-slot": "^1.1.2",
        "@radix-ui/react-switch": "^1.1.3",
        "@radix-ui/react-tabs": "^1.1.3",
        "@radix-ui/react-toggle": "^1.1.2",
        "@radix-ui/react-toggle-group": "^1.1.2",
        "@radix-ui/react-tooltip": "^1.1.8",
        "@tailwindcss/container-queries": "^0.1.1",
        "@tailwindcss/vite": "^4.1.11",
        "@tanstack/react-query": "^5.83.1",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "cmdk": "^1.1.1",
        "d3": "^7.9.0",
        "date-fns": "^3.6.0",
        "embla-carousel-react": "^8.5.2",
        "framer-motion": "^12.6.2",
        "input-otp": "^1.4.2",
        "lucide-react": "^0.484.0",
        "marked": "^15.0.7",
        "next-themes": "^0.4.6",
        "octokit": "^4.1.2",
        "react": "^19.0.0",
        "react-day-picker": "^9.6.7",
        "react-dom": "^19.0.0",
        "react-error-boundary": "^6.0.0",
        "react-hook-form": "^7.54.2",
        "react-resizable-panels": "^2.1.7",
        "react-router-dom": "^7.7.1",
        "recharts": "^2.15.1",
        "sonner": "^2.0.1",
        "tailwind-merge": "^3.0.2",
        "three": "^0.175.0",
        "tw-animate-css": "^1.2.4",
        "uuid": "^11.1.0",
        "vaul": "^1.1.2",
        "zod": "^3.25.76"
    },
    "devDependencies": {
        "@eslint/js": "^9.21.0",
        "@tailwindcss/postcss": "^4.1.8",
        "@types/react": "^19.0.10",
        "@types/react-dom": "^19.0.4",
        "@vitejs/plugin-react": "^4.3.4",
        "@vitejs/plugin-react-swc": "^3.10.1",
        "eslint": "^9.28.0",
        "eslint-plugin-react-hooks": "^5.2.0",
        "eslint-plugin-react-refresh": "^0.4.19",
        "globals": "^16.0.0",
        "tailwindcss": "^4.1.11",
        "typescript": "~5.7.2",
        "typescript-eslint": "^8.38.0",
        "vite": "^6.3.5"
    },
    "workspaces": {
        "packages": [
            "packages/*"
        ]
    }
}
```

### vite.config.ts

```text
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
```

### tailwind.config.js

```text
import fs from "fs";

/** @type {import('tailwindcss').Config} */

let theme = {};
try {
  const themePath = "./theme.json";

  if (fs.existsSync(themePath)) {
    theme = JSON.parse(fs.readFileSync(themePath, "utf-8"));
  }
} catch (err) {
  console.error('failed to parse custom styles', err)
}
const defaultTheme = {
  container: {
    center: true,
    padding: "2rem",
  },
  extend: {
    screens: {
      coarse: { raw: "(pointer: coarse)" },
      fine: { raw: "(pointer: fine)" },
      pwa: { raw: "(display-mode: standalone)" },
    },
    colors: {
      neutral: {
        1: "var(--color-neutral-1)",
        2: "var(--color-neutral-2)",
        3: "var(--color-neutral-3)",
        4: "var(--color-neutral-4)",
        5: "var(--color-neutral-5)",
        6: "var(--color-neutral-6)",
        7: "var(--color-neutral-7)",
        8: "var(--color-neutral-8)",
        9: "var(--color-neutral-9)",
        10: "var(--color-neutral-10)",
        11: "var(--color-neutral-11)",
        12: "var(--color-neutral-12)",
        a1: "var(--color-neutral-a1)",
        a2: "var(--color-neutral-a2)",
        a3: "var(--color-neutral-a3)",
        a4: "var(--color-neutral-a4)",
        a5: "var(--color-neutral-a5)",
        a6: "var(--color-neutral-a6)",
        a7: "var(--color-neutral-a7)",
        a8: "var(--color-neutral-a8)",
        a9: "var(--color-neutral-a9)",
        a10: "var(--color-neutral-a10)",
        a11: "var(--color-neutral-a11)",
        a12: "var(--color-neutral-a12)",
        contrast: "var(--color-neutral-contrast)",
      },
      accent: {
        1: "var(--color-accent-1)",
        2: "var(--color-accent-2)",
        3: "var(--color-accent-3)",
        4: "var(--color-accent-4)",
        5: "var(--color-accent-5)",
        6: "var(--color-accent-6)",
        7: "var(--color-accent-7)",
        8: "var(--color-accent-8)",
        9: "var(--color-accent-9)",
        10: "var(--color-accent-10)",
        11: "var(--color-accent-11)",
        12: "var(--color-accent-12)",
        contrast: "var(--color-accent-contrast)",
      },
      "accent-secondary": {
        1: "var(--color-accent-secondary-1)",
        2: "var(--color-accent-secondary-2)",
        3: "var(--color-accent-secondary-3)",
        4: "var(--color-accent-secondary-4)",
        5: "var(--color-accent-secondary-5)",
        6: "var(--color-accent-secondary-6)",
        7: "var(--color-accent-secondary-7)",
        8: "var(--color-accent-secondary-8)",
        9: "var(--color-accent-secondary-9)",
        10: "var(--color-accent-secondary-10)",
        11: "var(--color-accent-secondary-11)",
        12: "var(--color-accent-secondary-12)",
        contrast: "var(--color-accent-secondary-contrast)",
      },
      fg: {
        DEFAULT: "var(--color-fg)",
        secondary: "var(--color-fg-secondary)",
      },
      bg: {
        DEFAULT: "var(--color-bg)",
        inset: "var(--color-bg-inset)",
        overlay: "var(--color-bg-overlay)",
      },
      "focus-ring": "var(--color-focus-ring)",
    },
    borderRadius: {
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      "2xl": "var(--radius-2xl)",
      full: "var(--radius-full)",
    },
  },
  spacing: {
    px: "var(--size-px)",
    0: "var(--size-0)",
    0.5: "var(--size-0-5)",
    1: "var(--size-1)",
    1.5: "var(--size-1-5)",
    2: "var(--size-2)",
    2.5: "var(--size-2-5)",
    3: "var(--size-3)",
    3.5: "var(--size-3-5)",
    4: "var(--size-4)",
    5: "var(--size-5)",
    6: "var(--size-6)",
    7: "var(--size-7)",
    8: "var(--size-8)",
    9: "var(--size-9)",
    10: "var(--size-10)",
    11: "var(--size-11)",
    12: "var(--size-12)",
    14: "var(--size-14)",
    16: "var(--size-16)",
    20: "var(--size-20)",
    24: "var(--size-24)",
    28: "var(--size-28)",
    32: "var(--size-32)",
    36: "var(--size-36)",
    40: "var(--size-40)",
    44: "var(--size-44)",
    48: "var(--size-48)",
    52: "var(--size-52)",
    56: "var(--size-56)",
    60: "var(--size-60)",
    64: "var(--size-64)",
    72: "var(--size-72)",
    80: "var(--size-80)",
    96: "var(--size-96)",
  },
  darkMode: ["selector", '[data-appearance="dark"]'],
}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { ...defaultTheme, ...theme },
};
```

### tsconfig.json

```text
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "skipLibCheck": true,
    "strictNullChecks": true,
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    /* Linting */
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    },
  },
  "include": [
    "src"
  ]
}
```

### index.html

```text
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DISCOVER 50 AI - Learn AI at Your Own Pace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="/src/main.css" rel="stylesheet" />
</head>

<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>

</html>
```

### README.md

```text
# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas

🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
```

### Scripts

```json
{
  "dev": "vite",
  "kill": "fuser -k 5000/tcp",
  "build": "tsc -b --noCheck && vite build",
  "lint": "eslint .",
  "optimize": "vite optimize",
  "preview": "vite preview"
}
```

### Dependencies

```json
{
  "@github/spark": "^0.0.1",
  "@heroicons/react": "^2.2.0",
  "@hookform/resolvers": "^4.1.3",
  "@octokit/core": "^6.1.4",
  "@phosphor-icons/react": "^2.1.7",
  "@radix-ui/colors": "^3.0.0",
  "@radix-ui/react-accordion": "^1.2.3",
  "@radix-ui/react-alert-dialog": "^1.1.6",
  "@radix-ui/react-aspect-ratio": "^1.1.2",
  "@radix-ui/react-avatar": "^1.1.3",
  "@radix-ui/react-checkbox": "^1.1.4",
  "@radix-ui/react-collapsible": "^1.1.3",
  "@radix-ui/react-context-menu": "^2.2.6",
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-hover-card": "^1.1.6",
  "@radix-ui/react-label": "^2.1.2",
  "@radix-ui/react-menubar": "^1.1.6",
  "@radix-ui/react-navigation-menu": "^1.2.5",
  "@radix-ui/react-popover": "^1.1.6",
  "@radix-ui/react-progress": "^1.1.2",
  "@radix-ui/react-radio-group": "^1.2.3",
  "@radix-ui/react-scroll-area": "^1.2.9",
  "@radix-ui/react-select": "^2.1.6",
  "@radix-ui/react-separator": "^1.1.2",
  "@radix-ui/react-slider": "^1.2.3",
  "@radix-ui/react-slot": "^1.1.2",
  "@radix-ui/react-switch": "^1.1.3",
  "@radix-ui/react-tabs": "^1.1.3",
  "@radix-ui/react-toggle": "^1.1.2",
  "@radix-ui/react-toggle-group": "^1.1.2",
  "@radix-ui/react-tooltip": "^1.1.8",
  "@tailwindcss/container-queries": "^0.1.1",
  "@tailwindcss/vite": "^4.1.11",
  "@tanstack/react-query": "^5.83.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "d3": "^7.9.0",
  "date-fns": "^3.6.0",
  "embla-carousel-react": "^8.5.2",
  "framer-motion": "^12.6.2",
  "input-otp": "^1.4.2",
  "lucide-react": "^0.484.0",
  "marked": "^15.0.7",
  "next-themes": "^0.4.6",
  "octokit": "^4.1.2",
  "react": "^19.0.0",
  "react-day-picker": "^9.6.7",
  "react-dom": "^19.0.0",
  "react-error-boundary": "^6.0.0",
  "react-hook-form": "^7.54.2",
  "react-resizable-panels": "^2.1.7",
  "react-router-dom": "^7.7.1",
  "recharts": "^2.15.1",
  "sonner": "^2.0.1",
  "tailwind-merge": "^3.0.2",
  "three": "^0.175.0",
  "tw-animate-css": "^1.2.4",
  "uuid": "^11.1.0",
  "vaul": "^1.1.2",
  "zod": "^3.25.76"
}
```

### Dev Dependencies

```json
{
  "@eslint/js": "^9.21.0",
  "@tailwindcss/postcss": "^4.1.8",
  "@types/react": "^19.0.10",
  "@types/react-dom": "^19.0.4",
  "@vitejs/plugin-react": "^4.3.4",
  "@vitejs/plugin-react-swc": "^3.10.1",
  "eslint": "^9.28.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.19",
  "globals": "^16.0.0",
  "tailwindcss": "^4.1.11",
  "typescript": "~5.7.2",
  "typescript-eslint": "^8.38.0",
  "vite": "^6.3.5"
}
```

## Implemented vs Missing

### Implemented

- Auth context and UI flows exist
- Progress tracking UX with local storage
- Subscription UI and plan definitions exist
- Course content scaffold in TypeScript
- Font sizing, dark mode, narration via Web Speech API

### Missing or Mocked

- Server-side auth with persistent sessions and email flows
- Server-side progress storage and aggregation
- Stripe integration with webhooks and entitlements
- MDX content pipeline and media hosting
- Pre-generated TTS MP3s, captions, print styles, high contrast mode

## Source Reference

### src/App.tsx

#### `src/App.tsx`

Imports: ./components/AccountPage, ./components/AuthForm, ./components/CoursesPage, ./components/DashboardPage, ./components/Header, ./components/HomePage, ./components/SecurityDashboard, ./components/ui/dialog, ./components/ui/sonner, ./contexts/AccessibilityContext, ./contexts/AuthContext, ./hooks/useSessionManager, react
Components or functions: App, AppContent
Preview:

```tsx
import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { CoursesPage } from './components/CoursesPage'
import { DashboardPage } from './components/DashboardPage'
import { AccountPage } from './components/AccountPage'
import { AuthForm } from './components/AuthForm'
import { SecurityDashboard } from './components/SecurityDashboard'
import { Dialog, DialogContent } from './components/ui/dialog'
import { Toaster } from './components/ui/sonner'
import { useSessionManager } from './hooks/useSessionManager'

type Page = 'home' | 'courses' | 'dashboard' | 'account'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false)

  // Initialize session management
  useSessionManager()

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  const handleAuthClick = () => {
    setShowAuthDialog(true)
  }

  const handleAuthClose = () => {
    setShowAuthDialog(false)
  }

  // Security dashboard access (for demo purposes - in production, this would be admin-only)
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      setShowSecurityDashboard(true)
    }
  }

  // Add keyboard listener for security dashboard
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
      case 'courses':
        return <CoursesPage onAuthClick={handleAuthClick} />
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'account':
        return <AccountPage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
      default:
```

### src/ErrorFallback.tsx

#### `src/ErrorFallback.tsx`

Imports: ./components/ui/alert, ./components/ui/button, lucide-react
Exports: ErrorFallback
Notes: env vars DEV
Preview:

```tsx
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';

import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <Alert variant='destructive' className='mb-6'>
          <AlertTriangleIcon />
          <AlertTitle>This spark has encountered a runtime error</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. The
            error details are shown below. Contact the spark author and let them
            know about this issue.
          </AlertDescription>
        </Alert>

        <div className='bg-card border rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-sm text-muted-foreground mb-2'>
            Error Details:
          </h3>
          <pre className='text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32'>
            {error.message}
          </pre>
        </div>

        <Button
          onClick={resetErrorBoundary}
          className='w-full'
          variant='outline'
        >
          <RefreshCwIcon />
          Try Again
        </Button>
      </div>
    </div>
  );
};
```

### src/components

#### `src/components/AccountPage-enhanced.tsx`

Imports: ./AuthForm, @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/dialog, @/components/ui/input, @/components/ui/label, @/components/ui/separator, @/contexts/AuthContext, @/lib/progressTracking, @/lib/subscription, react, sonner
Exports: AccountPage
Components or functions: AccountPage
Preview:

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription, subscriptionPlans, formatPrice, simulatePaymentFlow, useInvoiceHistory } from '@/lib/subscription'
import { useProgress } from '@/lib/progressTracking'
import { AuthForm } from './AuthForm'
import { toast } from 'sonner'
import {
  CreditCard,
  CheckCircle,
  User,
  Mail,
  Calendar,
  Crown,
  Star,
  Settings,
  Download,
  AlertTriangle,
  Shield,
  X,
  ChartBar,
  Trophy,
  Fire,
  Gift,
  Clock,
  ArrowRight
} from '@phosphor-icons/react'

interface AccountPageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function AccountPage({ onNavigate, onAuthClick }: AccountPageProps) {
  const { user } = useAuth()
  const {
    subscription,
    getCurrentPlan,
    canAccessTier,
    startTrial,
    upgradeToPaid,
    cancelSubscription,
    reactivateSubscription,
    getDaysUntilExpiry
  } = useSubscription()
  const { learningStats } = useProgress()
  const { invoices } = useInvoiceHistory()

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'advanced' | 'expert'>('advanced')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (!user) {
```

#### `src/components/AccountPage.tsx`

Imports: ./AuthForm, @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/dialog, @/components/ui/label, @/components/ui/separator, @/contexts/AuthContext, @/lib/progressTracking, @/lib/subscription, react, sonner
Exports: AccountPage
Components or functions: AccountPage
Preview:

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription, subscriptionPlans, formatPrice, simulatePaymentFlow, useInvoiceHistory } from '@/lib/subscription'
import { useProgress } from '@/lib/progressTracking'
import { AuthForm } from './AuthForm'
import { toast } from 'sonner'
import {
  CreditCard,
  CheckCircle,
  User,
  Mail,
  Calendar,
  Crown,
  Star,
  Settings,
  Download,
  AlertTriangle,
  Shield,
  X,
  ChartBar,
  Trophy,
  Fire,
  Gift,
  Clock,
  ArrowRight,
  Phone
} from '@phosphor-icons/react'

interface AccountPageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function AccountPage({ onNavigate, onAuthClick }: AccountPageProps) {
  const { user } = useAuth()
  const {
    subscription,
    getCurrentPlan,
    startTrial,
    upgradeToPaid,
    cancelSubscription,
    reactivateSubscription
  } = useSubscription()
  const { learningStats } = useProgress()
  const { invoices } = useInvoiceHistory()

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'advanced' | 'expert'>('advanced')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
```

#### `src/components/AuthForm.tsx`

Imports: @/components/ui/button, @/components/ui/card, @/components/ui/input, @/components/ui/label, @/contexts/AuthContext, @/lib/security, @phosphor-icons/react, react, sonner
Exports: AuthForm
Components or functions: AuthForm
Preview:

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeSlash, Shield, AlertTriangle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { validatePassword, validateEmail } from '@/lib/security'

interface AuthFormProps {
  onClose: () => void
}

export function AuthForm({ onClose }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, register, isLoading, securityState } = useAuth()

  // Real-time password validation for registration
  const passwordValidation = isLogin ? null : validatePassword(password)
  const emailValidation = email ? validateEmail(email) : null

  const getPasswordStrengthColor = () => {
    if (!passwordValidation) return ''
    switch (passwordValidation.strength) {
      case 'strong': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'weak': return 'text-red-600'
      default: return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all fields')
      return
    }

    // Email validation
    if (emailValidation && !emailValidation.isValid) {
      toast.error(emailValidation.errors[0])
      return
    }

    // Password validation for registration
    if (!isLogin && passwordValidation && !passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0])
      return
    }

    // Check rate limiting
    if (securityState.isLocked) {
      toast.error(`Account temporarily locked. Try again in ${securityState.lockoutTime} minutes.`)
```

Implementation guidance for this file:

- Wire to backend auth routes. Use cookie sessions. Add loading and error states. Add email verification flows in UI.

#### `src/components/CoursesPage.tsx`

Imports: ./ModulePage, @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/input, @/components/ui/progress, @/components/ui/separator, @/contexts/AuthContext, @/lib/courseData, @/lib/progressTracking, @/lib/subscription, react, sonner
Exports: CoursesPage
Components or functions: CoursesPage
Preview:

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useProgress } from '@/lib/progressTracking'
import { useSubscription } from '@/lib/subscription'
import { courseData, getAvailableCourses, Course } from '@/lib/courseData'
import { ModulePage } from './ModulePage'
import { toast } from 'sonner'
import {
  BookOpen,
  CheckCircle,
  Clock,
  Lock,
  Play,
  ArrowRight,
  Shield,
  Star,
  Users,
  Award,
  Search,
  Filter,
  BookmarkSimple,
  ChartBar,
  Trophy
} from '@phosphor-icons/react'

interface CoursesPageProps {
  onAuthClick: () => void
}

export function CoursesPage({ onAuthClick }: CoursesPageProps) {
  const { user } = useAuth()
  const { subscription, canAccessTier } = useSubscription()
  const { getCourseProgress, startCourse, getDashboardSummary } = useProgress()

  const [selectedModule, setSelectedModule] = useState<{courseId: string, moduleId: string} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'advanced' | 'expert'>('all')

  const dashboardSummary = getDashboardSummary()
  const availableCourses = getAvailableCourses(subscription.planId)

  // Filter courses based on search and filter
  const filteredCourses = Object.values(courseData).filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterTier === 'all' || course.tier === filterTier
    return matchesSearch && matchesFilter
  })

  if (selectedModule) {
    return (
      <ModulePage
        courseId={selectedModule.courseId}
        moduleId={selectedModule.moduleId}
```

#### `src/components/DashboardPage.tsx`

Imports: ./AuthForm, @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/progress, @/components/ui/separator, @/contexts/AuthContext, @/lib/courseData, @/lib/progressTracking, @/lib/subscription, react
Exports: DashboardPage
Components or functions: DashboardPage
Preview:

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useProgress } from '@/lib/progressTracking'
import { useSubscription } from '@/lib/subscription'
import { courseData } from '@/lib/courseData'
import { AuthForm } from './AuthForm'
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  Star,
  ChartBar,
  Trophy,
  Fire,
  Target,
  Users,
  Gift,
  Settings,
  BookmarkSimple,
  Play,
  Sparkle
} from '@phosphor-icons/react'

interface DashboardPageProps {
  onNavigate: (page: string) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth()
  const { subscription, getCurrentPlan, getDaysUntilExpiry } = useSubscription()
  const {
    getDashboardSummary,
    getLearningRecommendations,
    learningStats,
    setWeeklyGoal
  } = useProgress()

  const [showGoalSetting, setShowGoalSetting] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your learning dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
```

#### `src/components/Header.tsx`

Imports: @/components/ui/button, @/contexts/AccessibilityContext, @/contexts/AuthContext, react
Exports: Header
Components or functions: Header
Preview:

```tsx
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useAccessibility } from '@/contexts/AccessibilityContext'
import {
  TextAa,
  Moon,
  Sun,
  User,
  SignOut,
  List
} from '@phosphor-icons/react'
import { useState } from 'react'

interface HeaderProps {
  onAuthClick: () => void
  onNavigate: (page: string) => void
  currentPage: string
}

export function Header({ onAuthClick, onNavigate, currentPage }: HeaderProps) {
  const { user, logout } = useAuth()
  const { fontSize, isDarkMode, increaseFontSize, decreaseFontSize, toggleDarkMode } = useAccessibility()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'courses', label: 'Courses' },
    { id: 'dashboard', label: 'Progress' },
    { id: 'account', label: 'Account' }
  ]

  const handleLogout = () => {
    logout()
    onNavigate('home')
    setShowMobileMenu(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
            >
              DISCOVER 50 AI
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-base font-medium transition-colors hover:text-primary ${
                  currentPage === item.id
                    ? 'text-primary border-b-2 border-primary pb-1'
```

Implementation guidance for this file:

- Add SkipLink component and ensure keyboard navigation. Add aria-current on active nav items.

#### `src/components/HomePage-enhanced.tsx`

Imports: @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/separator, @/contexts/AuthContext, @/lib/subscription, react
Exports: HomePage
Components or functions: HomePage
Preview:

```tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription, subscriptionPlans, formatPrice } from '@/lib/subscription'
import {
  Brain,
  Shield,
  Heart,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  SpeakerHigh,
  Eye,
  Sparkle,
  Trophy,
  BookOpen,
  Clock,
  Phone,
  CreditCard,
  Globe,
  ChartBar
} from '@phosphor-icons/react'

interface HomePageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function HomePage({ onNavigate, onAuthClick }: HomePageProps) {
  const { user } = useAuth()
  const { subscription } = useSubscription()

  const heroFeatures = [
    {
      icon: <SpeakerHigh className="w-5 h-5" />,
      text: "Audio narration for all content"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      text: "Large fonts & high contrast design"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Privacy-focused learning"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Learn at your own pace"
    }
  ]

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "Senior-Friendly Design",
```

#### `src/components/HomePage.tsx`

Imports: @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/separator, @/contexts/AuthContext, @/lib/subscription, react
Exports: HomePage
Components or functions: HomePage
Preview:

```tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription, subscriptionPlans, formatPrice } from '@/lib/subscription'
import {
  Brain,
  Shield,
  Heart,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  SpeakerHigh,
  Eye,
  Sparkle,
  Trophy,
  BookOpen,
  Clock,
  Phone,
  CreditCard,
  Globe,
  ChartBar
} from '@phosphor-icons/react'

interface HomePageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function HomePage({ onNavigate, onAuthClick }: HomePageProps) {
  const { user } = useAuth()
  const { subscription } = useSubscription()

  const heroFeatures = [
    {
      icon: <SpeakerHigh className="w-5 h-5" />,
      text: "Audio narration for all content"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      text: "Large fonts & high contrast design"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Privacy-focused learning"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Learn at your own pace"
    }
  ]

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "Senior-Friendly Design",
```

#### `src/components/ModulePage.tsx`

Imports: @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/components/ui/progress, @/components/ui/select, @/components/ui/separator, @/components/ui/slider, @/components/ui/textarea, @/contexts/AccessibilityContext, @/contexts/AuthContext, @/lib/audioNarration, @/lib/courseData, @/lib/progressTracking, @/lib/subscription, react, sonner
Exports: ModulePage
Components or functions: ModulePage
Preview:

```tsx
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useAccessibility } from '@/contexts/AccessibilityContext'
import { useProgress } from '@/lib/progressTracking'
import { useSubscription } from '@/lib/subscription'
import { useAudioNarration, getEstimatedSpeechTime, announceToScreenReader } from '@/lib/audioNarration'
import { getCourseById, getModuleById, getNextModule, getPreviousModule } from '@/lib/courseData'
import { toast } from 'sonner'
import {
  Play,
  Pause,
  Stop,
  CheckCircle,
  BookOpen,
  Clock,
  Star,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  SpeakerHigh,
  SpeakerX,
  List,
  ChartBar,
  Printer,
  StarFour
} from '@phosphor-icons/react'

interface ModulePageProps {
  courseId: string
  moduleId: string
  onBack: () => void
  onNavigate: (courseId: string, moduleId: string) => void
}

export function ModulePage({ courseId, moduleId, onBack, onNavigate }: ModulePageProps) {
  const { user } = useAuth()
  const { subscription, canAccessTier } = useSubscription()
  const {
    completeModule,
    isModuleCompleted,
    rateModule,
    getCourseProgress,
    getModuleProgress,
    setCurrentModule
  } = useProgress()

  // Get course and module data
  const course = getCourseById(courseId)
  const module = getModuleById(courseId, moduleId)
  const nextModule = getNextModule(courseId, moduleId)
  const previousModule = getPreviousModule(courseId, moduleId)
  const courseProgress = getCourseProgress(courseId)
```

#### `src/components/SecureRoute.tsx`

Imports: @/components/ui/button, @/components/ui/card, @/contexts/AuthContext, @phosphor-icons/react, react
Exports: SecureRoute, usePermissions
Components or functions: SecureRoute, TierUpgradePrompt, usePermissions
Preview:

```tsx
import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Shield, ArrowRight } from '@phosphor-icons/react'

interface SecureRouteProps {
  children: ReactNode
  requiresAuth?: boolean
  requiredTier?: 'free' | 'advanced' | 'expert'
  fallback?: ReactNode
  onAuthRequired?: () => void
}

/**
 * Security wrapper component that protects routes and content
 * based on authentication status and user tier
 */
export function SecureRoute({
  children,
  requiresAuth = false,
  requiredTier,
  fallback,
  onAuthRequired
}: SecureRouteProps) {
  const { user } = useAuth()

  // Check if user is authenticated when required
  if (requiresAuth && !user) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this content
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={onAuthRequired} size="lg">
              <Shield className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check tier access if specified
  if (requiredTier && user) {
    const tierLevels = { free: 0, advanced: 1, expert: 2 }
    const userLevel = tierLevels[user.tier]
    const requiredLevel = tierLevels[requiredTier]

```

#### `src/components/SecurityDashboard.tsx`

Imports: @/components/ui/badge, @/components/ui/button, @/components/ui/card, @/lib/security, @phosphor-icons/react, react
Exports: SecurityDashboard
Components or functions: SecurityDashboard
Preview:

```tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SecurityLogger } from '@/lib/security'
import { Shield, AlertTriangle, Info, RefreshCw } from '@phosphor-icons/react'

interface SecurityDashboardProps {
  onClose: () => void
}

export function SecurityDashboard({ onClose }: SecurityDashboardProps) {
  const [logs, setLogs] = useState<ReturnType<typeof SecurityLogger.getLogs>>([])
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all')

  const loadLogs = () => {
    const allLogs = SecurityLogger.getLogs(filter === 'all' ? undefined : filter)
    setLogs(allLogs.slice(-50).reverse()) // Show last 50 logs, newest first
  }

  useEffect(() => {
    loadLogs()
  }, [filter])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default'
    } as const

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getEventDescription = (event: string, details: any) => {
    switch (event) {
      case 'user_registered':
        return `New user registration: ${details.email}`
      case 'user_login':
        return `User login: ${details.email}`
      case 'user_logout':
```

#### `src/components/ui/accordion.tsx`

Imports: @/lib/utils, @radix-ui/react-accordion, lucide-react/dist/esm/icons/chevron-down, react
Components or functions: Accordion, AccordionContent, AccordionItem, AccordionTrigger
Preview:

```tsx
import { ComponentProps } from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
```

#### `src/components/ui/alert-dialog.tsx`

Imports: @/components/ui/button, @/lib/utils, @radix-ui/react-alert-dialog, react
Components or functions: AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger
Preview:

```tsx
"use client"

import { ComponentProps } from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog({
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
```

#### `src/components/ui/alert.tsx`

Imports: @/lib/utils, class-variance-authority, react
Components or functions: Alert, AlertDescription, AlertTitle
Preview:

```tsx
import { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
```

#### `src/components/ui/aspect-ratio.tsx`

Imports: @radix-ui/react-aspect-ratio, react
Components or functions: AspectRatio
Preview:

```tsx
import { ComponentProps } from 'react';
import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

function AspectRatio({
  ...props
}: ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot='aspect-ratio' {...props} />;
}

export { AspectRatio };
```

#### `src/components/ui/avatar.tsx`

Imports: @/lib/utils, @radix-ui/react-avatar, react
Components or functions: Avatar, AvatarFallback, AvatarImage
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

function Avatar({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
```

#### `src/components/ui/badge.tsx`

Imports: @/lib/utils, @radix-ui/react-slot, class-variance-authority, react
Components or functions: Badge
Preview:

```tsx
import { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot='badge'
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
```

#### `src/components/ui/breadcrumb.tsx`

Imports: @/lib/utils, @radix-ui/react-slot, lucide-react/dist/esm/icons/chevron-right, lucide-react/dist/esm/icons/more-horizontal, react
Components or functions: Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
Preview:

```tsx
import { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"

import { cn } from "@/lib/utils"

function Breadcrumb({ ...props }: ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
```

#### `src/components/ui/button.tsx`

Imports: @/lib/utils, @radix-ui/react-slot, class-variance-authority, react
Components or functions: Button
Preview:

```tsx
import { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

#### `src/components/ui/calendar.tsx`

Imports: @/components/ui/button, @/lib/utils, lucide-react/dist/esm/icons/chevron-left, lucide-react/dist/esm/icons/chevron-right, react, react-day-picker
Components or functions: Calendar
Preview:

```tsx
import { ComponentProps } from "react"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
```

#### `src/components/ui/card.tsx`

Imports: @/lib/utils, react
Components or functions: Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
Preview:

```tsx
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
```

#### `src/components/ui/carousel.tsx`

Imports: @/components/ui/button, @/lib/utils, lucide-react/dist/esm/icons/arrow-left, lucide-react/dist/esm/icons/arrow-right, react
Components or functions: Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel
Notes: uses React context
Preview:

```tsx
"use client"

import { ComponentProps, createContext, useCallback, useContext, useEffect, useState, KeyboardEvent } from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
```

#### `src/components/ui/chart.tsx`

Imports: @/lib/utils, react, recharts
Exports: ChartConfig
Components or functions: ChartContainer, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload, useChart
Notes: uses React context
Preview:

```tsx
import { ComponentProps, ComponentType, createContext, CSSProperties, ReactNode, useContext, useId, useMemo } from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: ReactNode
    icon?: ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = createContext<ChartContextProps | null>(null)

function useChart() {
  const context = useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: ComponentProps<"div"> & {
  config: ChartConfig
  children: ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
```

#### `src/components/ui/checkbox.tsx`

Imports: @/lib/utils, @radix-ui/react-checkbox, lucide-react/dist/esm/icons/check, react
Components or functions: Checkbox
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import CheckIcon from 'lucide-react/dist/esm/icons/check';

import { cn } from '@/lib/utils';

function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className='flex items-center justify-center text-current transition-none'
      >
        <CheckIcon className='size-3.5' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
```

#### `src/components/ui/collapsible.tsx`

Imports: @radix-ui/react-collapsible, react
Components or functions: Collapsible, CollapsibleContent, CollapsibleTrigger
Preview:

```tsx
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ComponentProps } from 'react';

function Collapsible({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot='collapsible' {...props} />;
}

function CollapsibleTrigger({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot='collapsible-trigger'
      {...props}
    />
  );
}

function CollapsibleContent({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot='collapsible-content'
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
```

#### `src/components/ui/command.tsx`

Imports: @/lib/utils, cmdk, lucide-react/dist/esm/icons/search, react
Components or functions: Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut
Preview:

```tsx
"use client"

import { ComponentProps } from "react"
import { Command as CommandPrimitive } from "cmdk"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function Command({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  ...props
}: ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
```

#### `src/components/ui/context-menu.tsx`

Imports: @/lib/utils, @radix-ui/react-context-menu, lucide-react/dist/esm/icons/check, lucide-react/dist/esm/icons/chevron-right, lucide-react/dist/esm/icons/circle, react
Components or functions: ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuPortal, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger
Preview:

```tsx
"use client"

import { ComponentProps } from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import CheckIcon from "lucide-react/dist/esm/icons/check";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"

import { cn } from "@/lib/utils"

function ContextMenu({
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  )
}

function ContextMenuGroup({
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuPortal({
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  )
}

function ContextMenuSub({
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
```

#### `src/components/ui/dialog.tsx`

Imports: @/lib/utils, @radix-ui/react-dialog, lucide-react/dist/esm/icons/x, react
Components or functions: Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger
Preview:

```tsx
import { ComponentProps } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import XIcon from "lucide-react/dist/esm/icons/x"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
```

#### `src/components/ui/drawer.tsx`

Imports: @/lib/utils, react, vaul
Components or functions: Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger
Preview:

```tsx
import { ComponentProps } from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
```

#### `src/components/ui/dropdown-menu.tsx`

Imports: @/lib/utils, @radix-ui/react-dropdown-menu, lucide-react/dist/esm/icons/check, lucide-react/dist/esm/icons/chevron-right, lucide-react/dist/esm/icons/circle, react
Components or functions: DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger
Preview:

```tsx
"use client"

import { ComponentProps } from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
```

#### `src/components/ui/form.tsx`

Imports: @/components/ui/label, @/lib/utils, @radix-ui/react-label, @radix-ui/react-slot, react
Components or functions: FormControl, FormDescription, FormItem, FormLabel, FormMessage
Notes: uses React context
Preview:

```tsx
import { ComponentProps, createContext, useContext, useId } from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext)
  const itemContext = useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
```

#### `src/components/ui/hover-card.tsx`

Imports: @/lib/utils, @radix-ui/react-hover-card, react
Components or functions: HoverCard, HoverCardContent, HoverCardTrigger
Preview:

```tsx
import { ComponentProps } from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { cn } from '@/lib/utils';

function HoverCard({
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot='hover-card' {...props} />;
}

function HoverCardTrigger({
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot='hover-card-trigger' {...props} />
  );
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot='hover-card-portal'>
      <HoverCardPrimitive.Content
        data-slot='hover-card-content'
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
```

#### `src/components/ui/input-otp.tsx`

Imports: @/lib/utils, input-otp, lucide-react/dist/esm/icons/minus, react
Components or functions: InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot
Preview:

```tsx
"use client"

import { ComponentProps, useContext } from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import MinusIcon from "lucide-react/dist/esm/icons/minus"

import { cn } from "@/lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
```

#### `src/components/ui/input.tsx`

Imports: @/lib/utils, react
Components or functions: Input
Preview:

```tsx
import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
```

#### `src/components/ui/label.tsx`

Imports: @/lib/utils, @radix-ui/react-label, react
Components or functions: Label
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils';

function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot='label'
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
```

#### `src/components/ui/menubar.tsx`

Imports: @/lib/utils, @radix-ui/react-menubar, lucide-react/dist/esm/icons/check, lucide-react/dist/esm/icons/chevron-right, lucide-react/dist/esm/icons/circle, react
Components or functions: Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarPortal, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger
Preview:

```tsx
import { ComponentProps } from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"

import { cn } from "@/lib/utils"

function Menubar({
  className,
  ...props
}: ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        "bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
        className
      )}
      {...props}
    />
  )
}

function MenubarMenu({
  ...props
}: ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
  ...props
}: ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

function MenubarTrigger({
  className,
  ...props
}: ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
        className
```

#### `src/components/ui/navigation-menu.tsx`

Imports: @/lib/utils, @radix-ui/react-navigation-menu, class-variance-authority, lucide-react/dist/esm/icons/chevron-down, react
Components or functions: NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport
Preview:

```tsx
import { ComponentProps } from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva } from 'class-variance-authority';
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down';

import { cn } from '@/lib/utils';

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot='navigation-menu'
      data-viewport={viewport}
      className={cn(
        'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
        className,
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot='navigation-menu-list'
      className={cn(
        'group flex flex-1 list-none items-center justify-center gap-1',
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot='navigation-menu-item'
      className={cn('relative', className)}
      {...props}
    />
  );
}
```

#### `src/components/ui/pagination.tsx`

Imports: @/components/ui/button, @/lib/utils, lucide-react/dist/esm/icons/chevron-left, lucide-react/dist/esm/icons/chevron-right, lucide-react/dist/esm/icons/more-horizontal, react
Components or functions: Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
Preview:

```tsx
import { ComponentProps } from "react"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import MoreHorizontalIcon from "lucide-react/dist/esm/icons/more-horizontal"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ComponentProps<typeof Button>, "size"> &
  ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
```

#### `src/components/ui/popover.tsx`

Imports: @/lib/utils, @radix-ui/react-popover, react
Components or functions: Popover, PopoverAnchor, PopoverContent, PopoverTrigger
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot='popover' {...props} />;
}

function PopoverTrigger({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot='popover-content'
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot='popover-anchor' {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
```

#### `src/components/ui/progress.tsx`

Imports: @/lib/utils, @radix-ui/react-progress, react
Components or functions: Progress
Preview:

```tsx
import { ComponentProps } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot='progress'
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot='progress-indicator'
        className='bg-primary h-full w-full flex-1 transition-all'
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
```

Implementation guidance for this file:

- Replace local persistence with POST /api/progress/complete and GET /api/courses to fetch percentages.

#### `src/components/ui/radio-group.tsx`

Imports: @/lib/utils, @radix-ui/react-radio-group, lucide-react/dist/esm/icons/circle, react
Components or functions: RadioGroup, RadioGroupItem
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import CircleIcon from 'lucide-react/dist/esm/icons/circle';

import { cn } from '@/lib/utils';

function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot='radio-group'
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot='radio-group-item'
      className={cn(
        'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot='radio-group-indicator'
        className='relative flex items-center justify-center'
      >
        <CircleIcon className='fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2' />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
```

#### `src/components/ui/resizable.tsx`

Imports: @/lib/utils, lucide-react/dist/esm/icons/grip-vertical, react, react-resizable-panels
Components or functions: ResizableHandle, ResizablePanel, ResizablePanelGroup
Preview:

```tsx
import { ComponentProps } from 'react';
import GripVerticalIcon from 'lucide-react/dist/esm/icons/grip-vertical';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

function ResizablePanelGroup({
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot='resizable-panel-group'
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot='resizable-panel' {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot='resizable-handle'
      className={cn(
        'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className='bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border'>
          <GripVerticalIcon className='size-2.5' />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
```

#### `src/components/ui/scroll-area.tsx`

Imports: @/lib/utils, @radix-ui/react-scroll-area, react
Components or functions: ScrollArea, ScrollBar
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@/lib/utils';

function ScrollArea({
  className,
  children,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot='scroll-area'
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot='scroll-area-viewport'
        className='focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1'
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot='scroll-area-scrollbar'
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot='scroll-area-thumb'
        className='bg-border relative flex-1 rounded-full'
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
```

#### `src/components/ui/select.tsx`

Imports: @/lib/utils, @radix-ui/react-select, lucide-react/dist/esm/icons/check, lucide-react/dist/esm/icons/chevron-down, lucide-react/dist/esm/icons/chevron-up, react
Components or functions: Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue
Preview:

```tsx
import { ComponentProps } from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import ChevronUpIcon from "lucide-react/dist/esm/icons/chevron-up"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
```

#### `src/components/ui/separator.tsx`

Imports: @/lib/utils, @radix-ui/react-separator, react
Components or functions: Separator
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from '@/lib/utils';

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot='separator-root'
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
```

#### `src/components/ui/sheet.tsx`

Imports: @/lib/utils, @radix-ui/react-dialog, lucide-react/dist/esm/icons/x, react
Components or functions: Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
Preview:

```tsx
import { ComponentProps } from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import XIcon from "lucide-react/dist/esm/icons/x"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
```

#### `src/components/ui/sidebar.tsx`

Imports: @/components/ui/button, @/components/ui/input, @/components/ui/separator, @/components/ui/skeleton, @/hooks/use-mobile, @/lib/utils, @radix-ui/react-slot, class-variance-authority, lucide-react/dist/esm/icons/panel-left, react
Components or functions: Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar
Notes: uses React context
Preview:

```tsx
"use client"

import { CSSProperties, ComponentProps, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import PanelLeftIcon from "lucide-react/dist/esm/icons/panel-left"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
```

#### `src/components/ui/skeleton.tsx`

Imports: @/lib/utils, react
Components or functions: Skeleton
Preview:

```tsx
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
```

#### `src/components/ui/slider.tsx`

Imports: @/lib/utils, @radix-ui/react-slider, react
Components or functions: Slider
Preview:

```tsx
"use client"

import { ComponentProps, useMemo } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
```

#### `src/components/ui/sonner.tsx`

Imports: next-themes, react, sonner
Preview:

```tsx
import { useTheme } from 'next-themes';
import { CSSProperties } from 'react';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
```

#### `src/components/ui/switch.tsx`

Imports: @/lib/utils, @radix-ui/react-switch, react
Components or functions: Switch
Preview:

```tsx
'use client';

import { ComponentProps } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={cn(
          'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
```

#### `src/components/ui/table.tsx`

Imports: @/lib/utils, react
Components or functions: Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow
Preview:

```tsx
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
```

#### `src/components/ui/tabs.tsx`

Imports: @/lib/utils, @radix-ui/react-tabs, react
Components or functions: Tabs, TabsContent, TabsList, TabsTrigger
Preview:

```tsx
"use client"

import { ComponentProps } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
```

#### `src/components/ui/textarea.tsx`

Imports: @/lib/utils, react
Components or functions: Textarea
Preview:

```tsx
import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
```

#### `src/components/ui/toggle-group.tsx`

Imports: @/components/ui/toggle, @/lib/utils, @radix-ui/react-toggle-group, class-variance-authority, react
Components or functions: ToggleGroup, ToggleGroupItem
Notes: uses React context
Preview:

```tsx
"use client"

import { ComponentProps, createContext, useContext } from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
```

#### `src/components/ui/toggle.tsx`

Imports: @/lib/utils, @radix-ui/react-toggle, class-variance-authority, react
Components or functions: Toggle
Preview:

```tsx
import { ComponentProps } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot='toggle'
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
```

#### `src/components/ui/tooltip.tsx`

Imports: @/lib/utils, @radix-ui/react-tooltip, react
Components or functions: Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
Preview:

```tsx
import { ComponentProps } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot='tooltip-provider'
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot='tooltip' {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot='tooltip-content'
        sideOffset={sideOffset}
        className={cn(
          'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className='bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]' />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

### src/contexts

#### `src/contexts/AccessibilityContext.tsx`

Imports: react
Exports: AccessibilityProvider, useAccessibility
Components or functions: AccessibilityProvider, useAccessibility
Notes: uses localStorage; uses Web Speech API; uses React context
Preview:

```tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface AccessibilityContextType {
  fontSize: 'small' | 'normal' | 'large'
  isDarkMode: boolean
  increaseFontSize: () => void
  decreaseFontSize: () => void
  toggleDarkMode: () => void
  speakText: (text: string) => void
  stopSpeaking: () => void
  isSpeaking: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    // Load saved preferences
    const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'normal' | 'large'
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'

    if (savedFontSize) setFontSize(savedFontSize)
    if (savedDarkMode) setIsDarkMode(savedDarkMode)
  }, [])

  useEffect(() => {
    // Apply font size class to body
    document.body.className = document.body.className.replace(/font-size-\w+/g, '')
    if (fontSize !== 'normal') {
      document.body.classList.add(`font-size-${fontSize}`)
    }
    localStorage.setItem('fontSize', fontSize)
  }, [fontSize])

  useEffect(() => {
    // Apply dark mode class to body
    if (isDarkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
    localStorage.setItem('darkMode', isDarkMode.toString())
  }, [isDarkMode])

  const increaseFontSize = () => {
    setFontSize(current => {
      if (current === 'small') return 'normal'
      if (current === 'normal') return 'large'
      return 'large'
    })
  }

  const decreaseFontSize = () => {
    setFontSize(current => {
      if (current === 'large') return 'normal'
      if (current === 'normal') return 'small'
```

#### `src/contexts/AuthContext.tsx`

Imports: @github/spark/hooks, react
Exports: AuthProvider, User, useAuth
Components or functions: AuthProvider, hashPassword, useAuth, verifyPassword
Notes: uses React context
Preview:

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  validateEmail,
  validatePassword,
  RateLimiter,
  SessionManager,
  SecurityLogger,
  sanitizeInput
} from '@/lib/security'

export interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'advanced' | 'expert'
  verified: boolean
  joinDate: string
  lastLoginAt?: string
  loginAttempts?: number
  isLocked?: boolean
  lockedUntil?: string
}

interface SecurityState {
  rateLimiter: RateLimiter
  remainingAttempts: number
  isLocked: boolean
  lockoutTime?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
  updateTier: (tier: 'free' | 'advanced' | 'expert') => void
  securityState: SecurityState
  extendSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [passwords, setPasswords] = useKV<Record<string, string>>('user-passwords', {})
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimiter] = useState(() => new RateLimiter())
  const [securityState, setSecurityState] = useState<SecurityState>({
    rateLimiter,
    remainingAttempts: 5,
    isLocked: false
  })

  // Check session validity on load
  useEffect(() => {
    const session = SessionManager.getSession()
    if (session && user) {
```

Implementation guidance for this file:

- Wire to backend auth routes. Use cookie sessions. Add loading and error states. Add email verification flows in UI.

### src/hooks

#### `src/hooks/use-mobile.ts`

Imports: react
Exports: useIsMobile
Components or functions: useIsMobile
Preview:

```tsx
import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

#### `src/hooks/useSessionManager.ts`

Imports: @/contexts/AuthContext, @/lib/security, react
Exports: useSessionManager
Components or functions: useSessionManager
Preview:

```tsx
import { useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SessionManager } from '@/lib/security'

/**
 * Hook for automatic session management
 * Handles session extension on user activity and logout on expiration
 */
export function useSessionManager() {
  const { user, logout, extendSession } = useAuth()

  // Track user activity to extend session
  const handleUserActivity = useCallback(() => {
    if (user && SessionManager.isSessionValid()) {
      extendSession()
    }
  }, [user, extendSession])

  // Check session validity periodically
  const checkSession = useCallback(() => {
    if (user && !SessionManager.isSessionValid()) {
      logout()
    }
  }, [user, logout])

  useEffect(() => {
    if (!user) return

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Throttle activity tracking to avoid excessive calls
    let activityTimeout: NodeJS.Timeout | null = null

    const throttledActivity = () => {
      if (activityTimeout) return

      activityTimeout = setTimeout(() => {
        handleUserActivity()
        activityTimeout = null
      }, 30000) // Extend session at most once per 30 seconds
    }

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true })
    })

    // Check session validity every 5 minutes
    const sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000)

    // Cleanup
    return () => {
```

### src/index.css

#### `src/index.css`

Preview:

```tsx
@import 'tailwindcss';
@import "tw-animate-css";

@layer base {
  * {
    @apply border-border;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
}

:root {
  /* Senior-friendly color scheme with high contrast */
  --background: oklch(1 0 0);
  --foreground: oklch(0.25 0.05 240);
  --card: oklch(0.98 0.01 180);
  --card-foreground: oklch(0.25 0.05 240);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.25 0.05 240);
  --primary: oklch(0.25 0.05 240);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.85 0.02 180);
  --secondary-foreground: oklch(0.25 0.05 240);
  --muted: oklch(0.92 0.01 180);
  --muted-foreground: oklch(0.5 0.03 240);
  --accent: oklch(0.65 0.15 60);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.6 0.25 25);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.88 0.02 180);
  --input: oklch(0.88 0.02 180);
  --ring: oklch(0.25 0.05 240);
  --radius: 0.75rem;

  /* Font size variables for accessibility controls */
  --font-size-base: 20px;
  --font-size-sm: 18px;
  --font-size-lg: 24px;
  --font-size-xl: 28px;
  --font-size-2xl: 32px;
}

/* Dark mode colors for accessibility */
.dark {
  --background: oklch(0.15 0.02 240);
  --foreground: oklch(0.95 0.01 60);
  --card: oklch(0.18 0.02 240);
  --card-foreground: oklch(0.95 0.01 60);
  --popover: oklch(0.18 0.02 240);
  --popover-foreground: oklch(0.95 0.01 60);
  --primary: oklch(0.7 0.1 240);
  --primary-foreground: oklch(0.15 0.02 240);
  --secondary: oklch(0.25 0.03 240);
  --secondary-foreground: oklch(0.95 0.01 60);
  --muted: oklch(0.22 0.03 240);
  --muted-foreground: oklch(0.7 0.05 240);
  --accent: oklch(0.75 0.15 60);
  --accent-foreground: oklch(0.15 0.02 240);
```

### src/lib

#### `src/lib/audioNarration.ts`

Imports: react
Exports: AudioNarrationControls, AudioNarrationState, NarrationControlsProps, announceToScreenReader, extractTextFromHTML, formatSpeechTime, getEstimatedSpeechTime, getRecommendedVoices, useAudioNarration, useNarrationPreferences
Components or functions: announceToScreenReader, extractTextFromHTML, formatSpeechTime, getEstimatedSpeechTime, getRecommendedVoices, useAudioNarration, useNarrationPreferences
Notes: uses localStorage; uses Web Speech API
Preview:

```tsx
import { useState, useEffect, useCallback } from 'react'

export interface AudioNarrationState {
  isPlaying: boolean
  isPaused: boolean
  isSupported: boolean
  currentText: string
  position: number
  rate: number
  volume: number
  voice: SpeechSynthesisVoice | null
}

export interface AudioNarrationControls {
  play: () => void
  pause: () => void
  stop: () => void
  resume: () => void
  setRate: (rate: number) => void
  setVolume: (volume: number) => void
  setVoice: (voice: SpeechSynthesisVoice) => void
  getText: () => string
}

export function useAudioNarration(text: string): [AudioNarrationState, AudioNarrationControls] {
  const [state, setState] = useState<AudioNarrationState>({
    isPlaying: false,
    isPaused: false,
    isSupported: 'speechSynthesis' in window,
    currentText: text,
    position: 0,
    rate: 1,
    volume: 1,
    voice: null
  })

  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Load available voices
  useEffect(() => {
    if (!state.isSupported) return

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      setAvailableVoices(voices)

      // Set default voice (prefer female voice for senior-friendly experience)
      if (voices.length > 0 && !state.voice) {
        const preferredVoice = voices.find(voice =>
          voice.lang.startsWith('en') &&
          (voice.name.toLowerCase().includes('female') ||
           voice.name.toLowerCase().includes('zira') ||
           voice.name.toLowerCase().includes('susan'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]

        setState(prev => ({ ...prev, voice: preferredVoice }))
      }
    }

```

#### `src/lib/courseData.ts`

Exports: Course, Module, UserProgress, UserSubscription, calculateCourseProgress, courseData, getAvailableCourses, getCourseById, getModuleById, getNextModule, getPreviousModule, isModuleAccessible
Components or functions: calculateCourseProgress, getAvailableCourses, getCourseById, getModuleById, getNextModule, getPreviousModule, isModuleAccessible
Preview:

```tsx
export interface Module {
  id: string
  title: string
  description: string
  content: string
  estimatedTime: number // in minutes
  order: number
  isCompleted?: boolean
  rating?: number
  videoUrl?: string
  audioUrl?: string
  tags: string[]
}

export interface Course {
  id: string
  title: string
  description: string
  tier: 'free' | 'advanced' | 'expert'
  price: number
  modules: Module[]
  totalModules: number
  completedModules: number
  progressPercentage: number
  estimatedTotalTime: number
  features: string[]
  isLocked: boolean
}

export interface UserProgress {
  courseId: string
  moduleId: string
  completedAt: string
  rating?: number
  timeSpent: number
}

export interface UserSubscription {
  tier: 'free' | 'advanced' | 'expert'
  startDate: string
  endDate?: string
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  paymentMethod?: string
  nextBillingDate?: string
  gracePeriodEnd?: string
}

// Course content data - placeholders for now as requested
export const courseData: Record<string, Course> = {
  'ai-basics': {
    id: 'ai-basics',
    title: 'AI Basics for Everyday Life',
    description: 'Learn the fundamentals of AI technology with practical, real-world examples designed specifically for adults 50+.',
    tier: 'free',
    price: 0,
    totalModules: 4,
    completedModules: 0,
    progressPercentage: 0,
    estimatedTotalTime: 80, // 20 minutes per module
    isLocked: false,
```

Implementation guidance for this file:

- Migrate to MDX. Implement ContentLoader that renders from backend MDX response.

#### `src/lib/progressTracking.ts`

Imports: ./courseData, @github/spark/hooks
Exports: CourseProgress, LearningStats, LearningStreak, ModuleProgress, UserActivity, useProgress
Components or functions: useProgress
Preview:

```tsx
import { useKV } from '@github/spark/hooks'
import { courseData, Course, Module } from './courseData'

export interface ModuleProgress {
  moduleId: string
  courseId: string
  completedAt: string
  timeSpent: number // in minutes
  rating?: number
  attempts: number
  notes?: string
}

export interface CourseProgress {
  courseId: string
  startedAt: string
  lastAccessedAt: string
  completedModules: string[]
  currentModuleId?: string
  totalTimeSpent: number
  completionPercentage: number
  completed: boolean
  completedAt?: string
}

export interface UserActivity {
  id: string
  type: 'module_completed' | 'course_started' | 'course_completed' | 'rating_given'
  title: string
  description: string
  timestamp: string
  courseId?: string
  moduleId?: string
  metadata?: Record<string, any>
}

export interface LearningStreak {
  currentStreak: number
  longestStreak: number
  lastLearningDate: string
  startDate: string
}

export interface LearningStats {
  totalTimeSpent: number // in minutes
  modulesCompleted: number
  coursesCompleted: number
  averageRating: number
  streak: LearningStreak
  favoriteTopics: string[]
  weeklyGoal: number // minutes per week
  weeklyProgress: number // minutes this week
}

// Main progress tracking hook
export function useProgress() {
  const [moduleProgress, setModuleProgress] = useKV<ModuleProgress[]>('user-module-progress', [])
  const [courseProgress, setCourseProgress] = useKV<CourseProgress[]>('user-course-progress', [])
  const [userActivity, setUserActivity] = useKV<UserActivity[]>('user-activity', [])
  const [learningStats, setLearningStats] = useKV<LearningStats>('user-learning-stats', {
```

Implementation guidance for this file:

- Replace local persistence with POST /api/progress/complete and GET /api/courses to fetch percentages.

#### `src/lib/security.ts`

Exports: RateLimiter, SecurityConfig, SecurityLogger, SessionManager, defaultSecurityConfig, generateSessionToken, sanitizeInput, validateEmail, validateFileUpload, validatePassword
Components or functions: generateSessionToken, sanitizeInput, validateEmail, validateFileUpload, validatePassword
Notes: uses localStorage
Preview:

```tsx
/**
 * Security utilities for user authentication and data protection
 * Provides password validation, rate limiting, and input sanitization
 */

export interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number // in minutes
  passwordMinLength: number
  passwordRequireSpecialChar: boolean
  passwordRequireNumber: boolean
  sessionTimeout: number // in minutes
}

export const defaultSecurityConfig: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  sessionTimeout: 60, // 1 hour for people over 50
}

/**
 * Password validation with 50+ friendly requirements
 */
export function validatePassword(password: string, config = defaultSecurityConfig): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []

  if (password.length < config.passwordMinLength) {
    errors.push(`Password must be at least ${config.passwordMinLength} characters long`)
  }

  if (config.passwordRequireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (config.passwordRequireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)')
  }

  // Check for common weak patterns
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common. Please choose a more unique password')
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  let score = 0

  if (password.length >= 12) score += 2
  else if (password.length >= 8) score += 1

  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
```

#### `src/lib/subscription.ts`

Imports: @github/spark/hooks
Exports: Invoice, PaymentMethod, SubscriptionPlan, UserSubscription, formatBillingPeriod, formatPrice, getPlanFeatures, getUpgradeRecommendation, simulatePaymentFlow, subscriptionPlans, useInvoiceHistory, useSubscription
Components or functions: formatBillingPeriod, formatPrice, getPlanFeatures, getUpgradeRecommendation, simulatePaymentFlow, useInvoiceHistory, useSubscription
Preview:

```tsx
import { useKV } from '@github/spark/hooks'

export interface SubscriptionPlan {
  id: 'free' | 'advanced' | 'expert'
  name: string
  price: number
  billingPeriod: 'month' | 'year'
  features: string[]
  description: string
  ctaText: string
  popular?: boolean
}

export interface UserSubscription {
  planId: 'free' | 'advanced' | 'expert'
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'grace_period'
  startDate: string
  endDate?: string
  nextBillingDate?: string
  trialEndDate?: string
  gracePeriodEnd?: string
  paymentMethod?: {
    type: 'card'
    last4: string
    brand: string
  }
  cancelAtPeriodEnd?: boolean
  autoRenew: boolean
}

export interface PaymentMethod {
  id: string
  type: 'card'
  last4: string
  brand: string
  expiry: string
  isDefault: boolean
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Course',
    price: 0,
    billingPeriod: 'month',
    description: 'Perfect for getting started with AI basics',
    ctaText: 'Start Learning Free',
    features: [
      'Complete "AI Basics for Everyday Life" course',
      '4 comprehensive modules',
      'Audio narration for all content',
      'Progress tracking',
      'Community forum access',
      'Email support'
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced Learning',
    price: 1.99,
```

Implementation guidance for this file:

- Call POST /api/subscribe/:tier to get Checkout URL. After return, poll /api/me for tier. Add Manage Billing link.

#### `src/lib/utils.ts`

Imports: clsx, tailwind-merge
Exports: cn
Components or functions: cn
Preview:

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### src/main.css

#### `src/main.css`

Preview:

```tsx
@import 'tailwindcss';

@import './styles/theme.css';
@import './index.css';
@import "tw-animate-css";
/*
  ---break---
*/
@custom-variant dark (&:is(.dark *));

@config '../tailwind.config.js';

/*
  The default border color has changed to `currentColor` in Tailwind CSS v4,
  so we've added these compatibility styles to make sure everything still
  looks the same as it did with Tailwind CSS v3.

  If we ever want to remove these styles, we need to add an explicit border
  color utility to any element that depends on these defaults.
*/
@layer base {

  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}

/*
  ---break---
*/
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
```

### src/main.tsx

#### `src/main.tsx`

Imports: ./App.tsx, ./ErrorFallback.tsx, react-dom/client, react-error-boundary
Preview:

```tsx
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import '@github/spark/spark';

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';

import './main.css';
import './styles/theme.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>,
);
```

### src/prd-complete.md

#### `src/prd-complete.md`

Preview:

```tsx
# DISCOVER 50 AI - Complete Platform PRD

## Core Purpose & Success

**Mission Statement**: Empower adults 50+ to confidently use AI technology through accessible, tiered learning courses that build practical skills step by step.

**Success Indicators**:
- High course completion rates (>60%)
- Positive user feedback on accessibility and clarity
- Successful tier progression (free → paid subscriptions)
- Reduced technology anxiety and increased AI adoption
- Zero security incidents with user data protection

**Experience Qualities**: Trustworthy, Accessible, Empowering

## Project Classification & Approach

**Complexity Level**: Complex Application (multi-tier courses, user accounts, subscription management, progress tracking, full backend integration)

**Primary User Activity**: Learning through guided content consumption, interactive practice, and progressive skill building

## Essential Features

### Authentication & User Management
- Email/password registration with verification simulation
- Role-based access control (free, advanced, expert)
- Session persistence with secure logout and timeout
- Account settings and subscription management
- Password security requirements and validation
- Account recovery simulation with security measures

### Course Structure & Content
- **Free Tier**: "AI Basics for Everyday Life" (4 modules) - accessible after registration
- **Advanced Tier**: "AI as Your Personal Assistant" ($1.99/month, 4 modules)
- **Expert Tier**: "Advanced AI for Active Learners" ($4.99/month, 4 modules)
- Individual module pages with content, progress tracking, accessibility features
- Breadcrumb navigation and course outline sidebar
- Estimated reading time and module progress indicators
- Audio narration using Web Speech API for all content

### Progress Tracking System
- "Mark as Complete" buttons with visual confirmation
- Progress bars showing completion percentage for each course
- "Continue Where You Left Off" functionality on dashboard
- Visual indicators (checkmarks, progress rings) for completed content
- Persistent storage using spark.kv for cross-session data
- Recent activity feed and achievement tracking

### Subscription & Access Control
- Mock payment flow with simulated Stripe integration
- Subscription tier management and upgrades
- Grace period simulation for failed payments
- Content gating based on subscription level
- Account billing and cancellation options
- Free trial periods and promotional offers

### Accessibility Features
- Font size controls (A-/A+ buttons) affecting entire site
- Dark mode toggle with full theme switching
- Audio narration using Web Speech API for all content
```

### src/prd.md

#### `src/prd.md`

Notes: uses localStorage
Preview:

```tsx
# DISCOVER 50 AI - Enhanced Security & Platform Foundation PRD

## Core Purpose & Success

**Mission Statement**: Create a secure, accessible learning platform that teaches adults 50+ how to use AI through tiered online courses with enterprise-grade security measures.

**Success Indicators**:
- Zero security incidents or data breaches
- 99.9% successful authentication attempts (excluding malicious attempts)
- Sub-2-second page load times with security features enabled
- WCAG AA compliance maintained with security enhancements
- 100% user account protection through automated threat detection

**Experience Qualities**: Trustworthy, Secure, Accessible

## Project Classification & Approach

**Complexity Level**: Complex Application (advanced security, role-based access, session management)

**Primary User Activity**: Learning with secure content consumption and protected user data

## Core Problem Analysis

Adults 50+ need to learn AI safely but face multiple security concerns:
- Fear of data theft and privacy violations
- Vulnerable to phishing and social engineering
- Need simple but robust security without technical complexity
- Require transparent security measures that build trust

## Essential Security Features

### 1. Enhanced Authentication System
**Functionality**:
- Multi-factor password validation with senior-friendly requirements
- Rate limiting to prevent brute force attacks (5 attempts, 15-minute lockout)
- Session management with automatic timeout (60 minutes)
- Account lockout protection with progressive delays

**Purpose**: Protect user accounts while maintaining usability for people over 50
**Success Criteria**: <5% failed legitimate login attempts, 100% malicious attempt blocking

### 2. Input Validation & Sanitization
**Functionality**:
- Real-time email validation with security checks
- Password strength meter with clear feedback
- Input sanitization to prevent XSS attacks
- File upload validation (future-proofing)

**Purpose**: Prevent malicious input while providing helpful feedback
**Success Criteria**: Zero successful injection attempts, clear validation messages

### 3. Session Security Management
**Functionality**:
- Automatic session extension on user activity
- Secure session token generation
- Session expiration warnings
- Activity-based session refresh

**Purpose**: Balance security with user convenience
**Success Criteria**: No session hijacking, seamless user experience
```

### src/styles

#### `src/styles/theme.css`

Preview:

```tsx
@import "tailwindcss";

@import '@radix-ui/colors/sage-dark.css' layer(base);
@import '@radix-ui/colors/olive.css' layer(base);
@import '@radix-ui/colors/olive-dark.css' layer(base);
@import '@radix-ui/colors/sand.css' layer(base);
@import '@radix-ui/colors/sand-dark.css' layer(base);
@import '@radix-ui/colors/red.css' layer(base);
@import '@radix-ui/colors/red-dark.css' layer(base);
@import '@radix-ui/colors/ruby.css' layer(base);
@import '@radix-ui/colors/ruby-dark.css' layer(base);
@import '@radix-ui/colors/crimson.css' layer(base);
@import '@radix-ui/colors/crimson-dark.css' layer(base);
@import '@radix-ui/colors/pink.css' layer(base);
@import '@radix-ui/colors/pink-dark.css' layer(base);
@import '@radix-ui/colors/plum.css' layer(base);
@import '@radix-ui/colors/plum-dark.css' layer(base);
@import '@radix-ui/colors/purple.css' layer(base);
@import '@radix-ui/colors/purple-dark.css' layer(base);
@import '@radix-ui/colors/violet.css' layer(base);
@import '@radix-ui/colors/violet-dark.css' layer(base);
@import '@radix-ui/colors/iris.css' layer(base);
@import '@radix-ui/colors/iris-dark.css' layer(base);
@import '@radix-ui/colors/indigo.css' layer(base);
@import '@radix-ui/colors/indigo-dark.css' layer(base);
@import '@radix-ui/colors/blue.css' layer(base);
@import '@radix-ui/colors/blue-dark.css' layer(base);
@import '@radix-ui/colors/cyan.css' layer(base);
@import '@radix-ui/colors/cyan-dark.css' layer(base);
@import '@radix-ui/colors/teal.css' layer(base);
@import '@radix-ui/colors/teal-dark.css' layer(base);
@import '@radix-ui/colors/jade.css' layer(base);
@import '@radix-ui/colors/jade-dark.css' layer(base);
@import '@radix-ui/colors/green.css' layer(base);
@import '@radix-ui/colors/green-dark.css' layer(base);
@import '@radix-ui/colors/grass.css' layer(base);
@import '@radix-ui/colors/grass-dark.css' layer(base);
@import '@radix-ui/colors/bronze.css' layer(base);
@import '@radix-ui/colors/bronze-dark.css' layer(base);
@import '@radix-ui/colors/gold.css' layer(base);
@import '@radix-ui/colors/gold-dark.css' layer(base);
@import '@radix-ui/colors/brown.css' layer(base);
@import '@radix-ui/colors/brown-dark.css' layer(base);
@import '@radix-ui/colors/orange.css' layer(base);
@import '@radix-ui/colors/orange-dark.css' layer(base);
@import '@radix-ui/colors/amber.css' layer(base);
@import '@radix-ui/colors/amber-dark.css' layer(base);
@import '@radix-ui/colors/yellow.css' layer(base);
@import '@radix-ui/colors/yellow-dark.css' layer(base);
@import '@radix-ui/colors/lime.css' layer(base);
@import '@radix-ui/colors/lime-dark.css' layer(base);
@import '@radix-ui/colors/mint.css' layer(base);
@import '@radix-ui/colors/mint-dark.css' layer(base);
@import '@radix-ui/colors/sky.css' layer(base);
@import '@radix-ui/colors/sky-dark.css' layer(base);
@import '@radix-ui/colors/tomato.css' layer(base);
@import '@radix-ui/colors/tomato-dark.css' layer(base);
@import '@radix-ui/colors/gray.css' layer(base);
@import '@radix-ui/colors/gray-dark.css' layer(base);
@import '@radix-ui/colors/mauve.css' layer(base);
```

### src/vite-end.d.ts

#### `src/vite-end.d.ts`

Preview:

```tsx
/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string;
declare const BASE_KV_SERVICE_URL: string;
```

## Detailed Implementation Tasks and Code

### Frontend Auth Client (replace in AuthContext)

```ts
async function apiRegister(body: {
  email: string;
  password: string;
  name?: string;
}) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('register failed');
  return res.json();
}

async function apiLogin(body: { email: string; password: string }) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('login failed');
  return res.json();
}

async function apiMe() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('not auth');
  return res.json();
}
```

Integrate these calls into your context, remove localStorage auth flags, and hydrate on app mount.

### Frontend Progress Client

```ts
export async function markComplete(moduleId: string) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/progress/complete`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId }),
    },
  );
  if (!res.ok) throw new Error('progress failed');
  return res.json();
}
```

Call this from your ModulePage on "Mark as complete" and optimistically update UI.

### Frontend Subscription Client

```ts
export async function startCheckout(tier: 'advanced' | 'expert') {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/subscribe/${tier}`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );
  const data = await res.json();
  window.location.href = data.url;
}
```

On return, fetch `/api/me` to confirm the tier and show success UI.

### Content Pipeline: MDX

- Create `/content/free/module-1.mdx` etc. Frontmatter example:

```mdx
---
title: 'What is AI, Really?'
tier: FREE
estMinutes: 20
videoUrl: 'https://vimeo.com/...'
audioUrl: 'https://cdn.example.com/audio/free-m1.mp3'
updatedAt: '2025-08-01'
---

import {
  ProTip,
  Warning,
  SuccessStory,
} from '../../src/components/mdx/Callouts';

# What is AI, Really?

<Warning>Never share SSN, passwords, or bank details.</Warning>
<ProTip>Try asking: "Explain polymyalgia rheumatica simply."</ProTip>
<SuccessStory>Margaret used this to understand her lab results.</SuccessStory>
```

- Backend reads file and returns MDX text. Frontend renders via `@mdx-js/react` with custom components.

### Accessibility Snippets

Skip link in `Header`:

```tsx
<a href='#main' className='sr-only focus:not-sr-only'>
  Skip to content
</a>
```

High contrast mode CSS:

```css
:root.high-contrast {
  --bg: #000;
  --text: #fff;
  --primary: #0ff;
  --accent: #ff0;
}
```

Print style in `src/styles/print.css`:

```css
@media print {
  nav,
  .sidebar,
  .btn,
  .comments {
    display: none !important;
  }
  main {
    font-size: 16pt;
    color: #000;
  }
}
```

### Example Jest Test

```ts
import { canAccessModule } from '../src/lib/entitlements';

test('free user cannot access expert', () => {
  expect(canAccessModule('FREE', 'EXPERT')).toBe(false);
});
```

### GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test --if-present
```
