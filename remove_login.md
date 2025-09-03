# Remove Login Requirement — Keep Infra and Progress Tracking

## Goal

- **Remove login requirements as gatekeepers** - Users should be able to access ALL pages (home, courses, modules, dashboard, account) without signing in.
- **CRITICAL: PRESERVE ALL LOGIN INFRASTRUCTURE** - Keep 100% of authentication/subscription code intact (Supabase schema, auth flows, AuthContext, AuthForm, login/register components, database tables, RLS policies). This infrastructure WILL be re-enabled in the future, just not used as a gatekeeper right now.
- **Maintain progress tracking** - Use localStorage for device-bound progress tracking without requiring logins, maintaining strict security (no weakening of database RLS, no anonymous writes to user tables).
- **Senior-friendly experience** - No passwords required to start learning; clear "keep my progress" language with simple export/import functionality for backup.

## Summary Of Current State

- **Framework**: Vite + React + TypeScript; routing in `src/App.tsx` with `react-router-dom`.
- **Auth**: `src/contexts/AuthContext.tsx` uses Supabase Auth; `ProtectedRoute` component gates most pages requiring authentication; `AuthForm` handles login/register/OTP flows.
- **Progress Tracking**: `src/lib/progressTracking.ts` uses the `useProgress` hook which reads/writes progress to Supabase when `user` exists. Without a user, progress only lives in React state memory and is lost on reload.
- **Database**: Supabase tables (profiles/subscriptions/course_progress/module_progress/user_activity) with strict RLS that requires `role = authenticated` and `auth.uid()` row ownership.
- **Security**: Strong posture with no public writes allowed; RLS requires authenticated users. This must remain intact.

## Non‑Goals

- **Do NOT delete or remove ANY authentication code** - No deletion of Supabase tables, RLS policies, AuthContext, AuthForm, or any auth-related files. We are only disabling enforcement at the UI/router layer.
- **Do NOT modify authentication logic** - The actual authentication code should work exactly the same when re-enabled in the future.
- **Do NOT relax security** - Keep RLS strict, no anonymous writes to user tables.
- **Do NOT use tracking** - No IP address tracking or device fingerprinting.
- **Do NOT break future login capability** - Everything should be ready to re-enable login with minimal changes later.

## Implementation Approach

**Single Master Plan**: Implement local-only persistence using localStorage with a generated guest ID. This provides device-bound progress tracking without any server changes, maintaining full security while enabling login-free access.

---

## Complete Implementation Instructions

**IMPORTANT**: Follow these instructions exactly in order. Each step builds on the previous one. Test thoroughly after each major step.

### Step 1: Create Guest Identity & Storage System

**Create new file `src/lib/guestId.ts`:**
```typescript
// Manages guest identity for local progress tracking
export function getOrCreateGuestId(): string {
  const STORAGE_KEY = 'guest_id';
  let guestId = localStorage.getItem(STORAGE_KEY);
  
  if (!guestId) {
    // Generate cryptographically secure UUID v4
    guestId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, guestId);
  }
  
  return guestId;
}

export function clearGuestId(): void {
  localStorage.removeItem('guest_id');
  // Clear all guest-prefixed keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('guest:')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
```

**Create new file `src/lib/guestStorage.ts`:**
```typescript
// Safe localStorage wrapper with JSON handling
export function getGuestStorageKey(guestId: string, key: string): string {
  return `guest:${guestId}:${key}`;
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export function getFromGuestStorage<T>(guestId: string, key: string, fallback: T): T {
  const storageKey = getGuestStorageKey(guestId, key);
  const value = localStorage.getItem(storageKey);
  return safeJsonParse(value, fallback);
}

export function setToGuestStorage(guestId: string, key: string, value: unknown): void {
  const storageKey = getGuestStorageKey(guestId, key);
  localStorage.setItem(storageKey, safeJsonStringify(value));
}

export function removeFromGuestStorage(guestId: string, key: string): void {
  const storageKey = getGuestStorageKey(guestId, key);
  localStorage.removeItem(storageKey);
}
```

**Create new file `src/lib/guestProgress.ts`:**
```typescript
import type { ModuleProgress, CourseProgress, UserActivity, LearningStats } from './progressTracking';
import { getFromGuestStorage, setToGuestStorage, removeFromGuestStorage } from './guestStorage';

export interface GuestProgressSnapshot {
  version: number;
  moduleProgress: ModuleProgress[];
  courseProgress: CourseProgress[];
  userActivity: UserActivity[];
  learningStats: LearningStats;
  lastUpdated: string;
}

const PROGRESS_KEY = 'progress';
const CURRENT_VERSION = 1;

function getDefaultSnapshot(): GuestProgressSnapshot {
  return {
    version: CURRENT_VERSION,
    moduleProgress: [],
    courseProgress: [],
    userActivity: [],
    learningStats: {
      totalTimeSpent: 0,
      modulesCompleted: 0,
      coursesCompleted: 0,
      averageRating: 0,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastLearningDate: '',
        startDate: new Date().toISOString(),
      },
      favoriteTopics: [],
      weeklyGoal: 120,
      weeklyProgress: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function loadGuestProgress(guestId: string): GuestProgressSnapshot {
  const snapshot = getFromGuestStorage<GuestProgressSnapshot>(
    guestId,
    PROGRESS_KEY,
    getDefaultSnapshot()
  );
  
  // Handle version migration if needed
  if (snapshot.version !== CURRENT_VERSION) {
    // Future migration logic here
    snapshot.version = CURRENT_VERSION;
  }
  
  return snapshot;
}

export function saveGuestProgress(guestId: string, snapshot: GuestProgressSnapshot): void {
  snapshot.lastUpdated = new Date().toISOString();
  snapshot.version = CURRENT_VERSION;
  setToGuestStorage(guestId, PROGRESS_KEY, snapshot);
}

export function exportGuestProgress(guestId: string): string {
  const snapshot = loadGuestProgress(guestId);
  const json = JSON.stringify(snapshot);
  return btoa(json); // Base64 encode
}

export function importGuestProgress(guestId: string, base64Json: string): void {
  try {
    const json = atob(base64Json); // Base64 decode
    const snapshot = JSON.parse(json) as GuestProgressSnapshot;
    
    // Validate structure
    if (!snapshot.version || !Array.isArray(snapshot.moduleProgress)) {
      throw new Error('Invalid progress data structure');
    }
    
    saveGuestProgress(guestId, snapshot);
  } catch (error) {
    throw new Error('Failed to import progress: Invalid data format');
  }
}

export function resetGuestProgress(guestId: string): void {
  removeFromGuestStorage(guestId, PROGRESS_KEY);
}
```

### Step 2: Modify Progress Tracking for Guest Mode

**Edit `src/lib/progressTracking.ts`:**

At the top of the file, add these imports:
```typescript
import { getOrCreateGuestId } from './guestId';
import { loadGuestProgress, saveGuestProgress, type GuestProgressSnapshot } from './guestProgress';
```

Inside the `useProgress` function, after the state declarations and before the `useEffect` that hydrates from Supabase, add:

```typescript
// Guest mode support
const guestIdRef = useRef<string | null>(null);
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Function to create snapshot from current state
const createSnapshot = useCallback((): GuestProgressSnapshot => {
  return {
    version: 1,
    moduleProgress,
    courseProgress,
    userActivity,
    learningStats,
    lastUpdated: new Date().toISOString(),
  };
}, [moduleProgress, courseProgress, userActivity, learningStats]);

// Debounced save for guest progress
const debouncedSaveGuestProgress = useCallback(() => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  
  saveTimeoutRef.current = setTimeout(() => {
    if (guestIdRef.current && !user) {
      const snapshot = createSnapshot();
      saveGuestProgress(guestIdRef.current, snapshot);
    }
  }, 1000); // Save after 1 second of inactivity
}, [createSnapshot, user]);
```

Modify the existing `useEffect` that hydrates from Supabase (around line 129):
```typescript
// Hydrate progress data from Supabase when user is logged in, or from localStorage in guest mode
useEffect(() => {
  if (!user) {
    // Guest mode: load from localStorage
    const guestId = getOrCreateGuestId();
    guestIdRef.current = guestId;
    
    const snapshot = loadGuestProgress(guestId);
    setModuleProgress(snapshot.moduleProgress);
    setCourseProgress(snapshot.courseProgress);
    setUserActivity(snapshot.userActivity);
    setLearningStats(snapshot.learningStats);
    return;
  }
  
  // Original Supabase hydration code continues here...
  void (async (): Promise<void> => {
    // ... existing Supabase code ...
  })();
}, [user]);
```

Add a new `useEffect` to save guest progress when state changes:
```typescript
// Auto-save guest progress when state changes
useEffect(() => {
  if (!user && guestIdRef.current) {
    debouncedSaveGuestProgress();
  }
  
  // Cleanup on unmount
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [moduleProgress, courseProgress, userActivity, learningStats, user, debouncedSaveGuestProgress]);
```

In each function that modifies state (completeModule, startCourse, addActivity, etc.), ensure the state updates work without a user. For example, in `completeModule` function, wrap the Supabase calls in an `if (user)` check:

```typescript
// Persist module progress (only if user is authenticated)
if (user) {
  // ... existing Supabase upsert code ...
}
```

Do the same for all other Supabase database calls throughout the file - wrap them in `if (user) { }` blocks.

### Step 3: Remove Login Gating From Routes

**Edit `src/App.tsx`:**

Find all routes that use `<ProtectedRoute>` and replace them with direct component rendering. Here are the specific changes:

1. **Replace protected course routes** (around lines 227-255):
```typescript
// OLD:
<Route
  path='/courses/basic'
  element={
    <ProtectedRoute onAuthRequired={handleAuthClick}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ModulePage courseType='basic' />
      </ErrorBoundary>
    </ProtectedRoute>
  }
/>

// NEW:
<Route
  path='/courses/basic'
  element={
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ModulePage courseType='basic' />
    </ErrorBoundary>
  }
/>
```

Do the same for `/courses/advanced` and `/courses/expert` routes.

2. **Replace module routes** (around lines 258-279):
```typescript
// OLD:
<Route
  path='/courses/:courseType/module/:moduleId'
  element={
    <ProtectedRoute onAuthRequired={handleAuthClick}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ModulePage />
      </ErrorBoundary>
    </ProtectedRoute>
  }
/>

// NEW:
<Route
  path='/courses/:courseType/module/:moduleId'
  element={
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ModulePage />
    </ErrorBoundary>
  }
/>
```

3. **Replace dashboard route** (around lines 282-291):
```typescript
// OLD:
<Route
  path='/dashboard'
  element={
    <ProtectedRoute onAuthRequired={handleAuthClick}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardPage />
      </ErrorBoundary>
    </ProtectedRoute>
  }
/>

// NEW:
<Route
  path='/dashboard'
  element={
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <DashboardPage />
    </ErrorBoundary>
  }
/>
```

4. **Replace account and reviews routes** similarly - remove the `ProtectedRoute` wrapper.

5. **Keep the admin Security Dashboard check intact** (lines 119-149) - this should remain protected.

6. **Remove automatic auth dialog opening** - The `handleAuthClick` function can remain but should not be called automatically anymore.

### Step 4: Allow Starting/Continuing Courses Without Login

**Edit `src/components/CoursesPage.tsx`:**

Find the `handleStartCourse` function and modify it:
```typescript
// OLD:
const handleStartCourse = (courseId: string): void => {
  if (!user) {
    onAuthClick();
    return;
  }
  // ... rest of function
}

// NEW:
const handleStartCourse = (courseId: string): void => {
  // Remove the user check - allow everyone to start courses
  startCourse(courseId);
  navigate(`/courses/${courseId}/module/${firstModule.id}`);
}
```

Keep the "Coming Soon" UI for advanced/expert tiers as is - no changes needed there.

**Verify `src/components/ModulePage.tsx`:**
- The module completion should work automatically since it uses `useProgress` which now supports guest mode
- No changes should be needed if it's using the `completeModule` function from `useProgress`

### Step 5: Update Dashboard and Account Pages for Guest Mode

**Edit `src/components/DashboardPage.tsx`:**

Add a guest mode indicator near the top of the component's return statement:
```typescript
{!user && (
  <div className="text-sm text-muted-foreground mb-4">
    <span className="inline-flex items-center gap-2">
      <svg className="w-4 h-4" /* add appropriate icon */></svg>
      Progress saved on this device only
    </span>
  </div>
)}
```

**Edit `src/components/AccountPage-enhanced.tsx` or `AccountPage.tsx`:**

Add a new Backup/Restore section. Add this as a new card in the component:
```typescript
import { getOrCreateGuestId, clearGuestId } from '@/lib/guestId';
import { exportGuestProgress, importGuestProgress, resetGuestProgress } from '@/lib/guestProgress';
import { toast } from 'sonner';

// Inside the component, add these handlers:
const handleExportProgress = (): void => {
  try {
    const guestId = getOrCreateGuestId();
    const exportData = exportGuestProgress(guestId);
    
    // Copy to clipboard
    navigator.clipboard.writeText(exportData).then(() => {
      toast.success('Progress data copied to clipboard!');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([exportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'progress-backup.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Progress data downloaded!');
    });
  } catch (error) {
    toast.error('Failed to export progress');
  }
};

const handleImportProgress = (): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';
  input.onchange = (e): void => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event): void => {
      try {
        const base64Data = event.target?.result as string;
        const guestId = getOrCreateGuestId();
        importGuestProgress(guestId, base64Data);
        toast.success('Progress imported successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Failed to import progress: Invalid file format');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

const handleResetProgress = (): void => {
  if (confirm('Are you sure you want to reset all progress on this device? This cannot be undone.')) {
    const guestId = getOrCreateGuestId();
    resetGuestProgress(guestId);
    clearGuestId();
    toast.success('Progress reset! Refreshing...');
    setTimeout(() => window.location.reload(), 1000);
  }
};

// Add this card to the JSX:
<Card>
  <CardHeader>
    <CardTitle>Backup & Restore Progress</CardTitle>
    <CardDescription>
      Save your learning progress or transfer it to another device
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex flex-col gap-3">
      <Button onClick={handleExportProgress} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export Progress
      </Button>
      <Button onClick={handleImportProgress} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        Import Progress
      </Button>
      <Button onClick={handleResetProgress} variant="outline" className="text-destructive">
        <Trash className="mr-2 h-4 w-4" />
        Reset Device Progress
      </Button>
    </div>
    <p className="text-xs text-muted-foreground">
      Your progress is saved locally on this device. Use export/import to backup or transfer your progress.
    </p>
  </CardContent>
</Card>
```

### Step 6: Update Header for Guest Access

**Edit `src/components/Header.tsx`:**

Find the authentication-related UI and modify it:
```typescript
// Look for any "Sign In" button and conditionally hide it:
{false && ( // Temporarily disable sign-in button
  <Button onClick={onAuthClick}>Sign In</Button>
)}

// Keep the Sign Out button only when user exists:
{user && (
  <Button onClick={handleSignOut} variant="ghost">
    Sign Out
  </Button>
)}

// Ensure navigation links (Dashboard, Account, etc.) are always visible, not conditional on user
```

### Step 7: Final Cleanup and Validation

1. **Add missing imports**: Ensure all files have necessary imports:
   - Add `import { useRef, useCallback } from 'react';` to progressTracking.ts if not present
   - Add icon imports (`Download`, `Upload`, `Trash`) to AccountPage

2. **Run validation commands**:
   ```bash
   pnpm run typecheck
   pnpm run lint:fix
   pnpm run build
   ```

3. **Fix any TypeScript errors** that arise from the changes

4. **Test the implementation**:
   - Open the app in an incognito/private browser window
   - Navigate to all pages - no login prompts should appear
   - Start a course and complete a module
   - Refresh the page - progress should persist
   - Go to Account page and test export/import/reset functions
   - Close and reopen browser - progress should still be there

### Important Notes for Implementation

1. **PRESERVE ALL AUTH CODE** - Do NOT delete AuthContext.tsx, AuthForm.tsx, ProtectedRoute.tsx, or any authentication-related files. They must remain intact and functional for future re-enablement.

2. **KEEP SUPABASE INTACT** - All Supabase configuration, database connections, and table operations should remain unchanged. We're just adding guest mode alongside it.

3. **MAINTAIN SECURITY** - All RLS policies and database schema remain unchanged. No weakening of security.

4. **AUTH STILL WORKS** - The login system should still be fully functional if someone were to manually navigate to it or if you re-enable it later.

5. **TEST PROPERLY** - Use an incognito window to ensure no existing auth cookies interfere with testing.

6. **ADMIN STAYS PROTECTED** - Security Dashboard and admin features must still require authentication.

### Troubleshooting Common Issues

**Issue: TypeScript errors about missing user**
- Solution: Wrap Supabase calls in `if (user) { }` blocks

**Issue: Progress not persisting**
- Check browser console for localStorage errors
- Verify guest ID is being created and stored
- Check that debounced save is being called

**Issue: Import/Export not working**
- Ensure base64 encoding/decoding is working correctly
- Check browser console for any errors during file operations

**Issue: Routes still showing login prompts**
- Ensure all ProtectedRoute wrappers are removed from non-admin routes
- Check that onAuthClick is not being called anywhere automatically

### Summary

This implementation:
- ✅ Removes login requirements for all learning pages
- ✅ Preserves all authentication infrastructure for future use
- ✅ Stores progress locally using localStorage with a guest ID
- ✅ Provides export/import functionality for backup
- ✅ Maintains security - no database writes without authentication
- ✅ Keeps admin features protected
- ✅ Is senior-friendly with no passwords required


