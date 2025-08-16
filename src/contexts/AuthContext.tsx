import type { ReactNode, ReactElement } from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { VerifyOtpParams } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';
import { upsertProfile, getProfile, updateProfile } from '@/lib/db';
import {
  validateEmail,
  validatePassword,
  RateLimiter,
  SecurityLogger,
  sanitizeInput,
} from '@/lib/security';
import { normalizeError, formatErrorMessage } from '@/lib/errorNormalization';

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'advanced' | 'expert';
  verified: boolean;
  joinDate: string;
  lastLoginAt?: string;
  loginAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: string;
}

interface SecurityState {
  rateLimiter: RateLimiter;
  remainingAttempts: number;
  isLocked: boolean;
  lockoutTime?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string; isDuplicate?: boolean }>;
  verifySignupOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resendSignupOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  // Removed for subscription removal: updateTier: (tier: 'free' | 'advanced' | 'expert') => void;
  updateTier: (tier: 'free' | 'advanced' | 'expert') => void; // Added for subscription removal: kept for compatibility
  securityState: SecurityState;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimiter] = useState(() => new RateLimiter());
  const [securityState, setSecurityState] = useState<SecurityState>({
    rateLimiter,
    remainingAttempts: 5,
    isLocked: false,
  });

  // Track profile creation to prevent race conditions
  const profileCreationInProgress = useRef<Set<string>>(new Set());

  // Initialize Supabase auth listener and hydrate user profile
  useEffect(() => {
    // Clean up any sensitive data from localStorage on mount
    if (typeof window !== 'undefined' && window.localStorage) {
      // Remove any legacy sensitive data keys
      const sensitiveKeys = [
        'current-user',
        'user-subscription',
        'user-invoices',
        'user-module-progress',
        'user-course-progress',
        'user-activity',
        'user-learning-stats',
      ];
      sensitiveKeys.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore errors during cleanup
        }
      });
    }

    const init = async (): Promise<void> => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      // If there's an invalid/stale refresh token in storage, clear local session to stop 400 spam
      if (sessionError && typeof sessionError.message === 'string') {
        const msg = sessionError.message.toLowerCase();
        if (msg.includes('invalid refresh token') || msg.includes('refresh token not found')) {
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
          return;
        }
      }
      const authUser = data.session?.user;
      if (authUser) {
        // Check if profile creation is already in progress for this user
        if (profileCreationInProgress.current.has(authUser.id)) {
          return; // Skip to prevent duplicate profile creation
        }

        try {
          const profile = await getProfile(authUser.id);
          const mapped: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name ?? authUser.email ?? 'User',
            tier: (profile.tier as User['tier']) ?? 'free',
            verified: profile.verified,
            joinDate: profile.join_date,
            lastLoginAt: profile.last_login_at ?? undefined,
            loginAttempts: profile.login_attempts,
            isLocked: profile.is_locked,
            lockedUntil: profile.locked_until ?? undefined,
          };
          setUser(mapped);
        } catch {
          // First-time user: create profile with race condition protection
          profileCreationInProgress.current.add(authUser.id);

          try {
            const email = authUser.email ?? 'unknown@example.com';
            const newProfile = await upsertProfile({
              id: authUser.id,
              email,
              name: (authUser.user_metadata?.name as string) ?? '',
              tier: 'free',
              verified: !!authUser.email_confirmed_at,
              join_date: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
              login_attempts: 0,
              is_locked: false,
              locked_until: null,
            });
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name ?? email,
              tier: 'free',
              verified: newProfile.verified,
              joinDate: newProfile.join_date,
            });
          } catch (upsertError) {
            // If upsert fails, it might be a duplicate - try to fetch again
            try {
              const profile = await getProfile(authUser.id);
              setUser({
                id: profile.id,
                email: profile.email,
                name: profile.name ?? authUser.email ?? 'User',
                tier: (profile.tier as User['tier']) ?? 'free',
                verified: profile.verified,
                joinDate: profile.join_date,
                lastLoginAt: profile.last_login_at ?? undefined,
                loginAttempts: profile.login_attempts,
                isLocked: profile.is_locked,
                lockedUntil: profile.locked_until ?? undefined,
              });
            } catch {
              // Unable to create or fetch profile
              SecurityLogger.log(
                'profile_creation_failed',
                { userId: authUser.id, error: upsertError },
                'error',
              );
            }
          } finally {
            profileCreationInProgress.current.delete(authUser.id);
          }
        }
      } else {
        setUser(null);
      }
    };

    // Only call init once initially
    void init();

    // Set up auth state change listener
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // Only re-init on actual auth state changes, not on token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void init();
      }
    });

    return (): void => {
      listener.subscription.unsubscribe();
    };
  }, [setUser]);

  const register = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; error?: string; isDuplicate?: boolean }> => {
    setIsLoading(true);

    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedName = sanitizeInput(name);

      // Validate email
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        SecurityLogger.log(
          'registration_failed',
          { email: sanitizedEmail, reason: 'invalid_email' },
          'warning',
        );
        setIsLoading(false);
        return {
          success: false,
          error: emailValidation.errors[0],
          isDuplicate: false,
        };
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        SecurityLogger.log(
          'registration_failed',
          { email: sanitizedEmail, reason: 'weak_password' },
          'warning',
        );
        setIsLoading(false);
        return {
          success: false,
          error: passwordValidation.errors[0],
          isDuplicate: false,
        };
      }

      // Register user with Supabase auth
      const { data: authRes, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: { name: sanitizedName },
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      // Check for duplicate email indicators
      // Supabase doesn't return an error for duplicate emails (security feature)
      // But we can detect it through certain response patterns
      const isDuplicateEmail =
        authRes?.user &&
        (!authRes.user.identities || authRes.user.identities.length === 0) &&
        !authRes.session; // Duplicate emails won't create a session

      if (error || !authRes.user) {
        setIsLoading(false);
        return {
          success: false,
          error: error?.message ?? 'Registration failed',
          isDuplicate: false,
        };
      }

      // If we detected a duplicate email, return a specific response
      if (isDuplicateEmail) {
        SecurityLogger.log('registration_duplicate_detected', { email: sanitizedEmail }, 'info');
        setIsLoading(false);
        return {
          success: false,
          error:
            'An account with this email may already exist. Please try logging in or use a different email.',
          isDuplicate: true,
        };
      }

      // If a session exists (email confirmations disabled), profile will be created by init()
      // If no session (email confirmations enabled), skip profile creation now and let init() handle it after verification.
      const hasSession = !!authRes.session;
      if (hasSession) {
        // Trigger init flow by setting user state via auth listener
        const { data, error: getSessionError } = await supabase.auth.getSession();
        if (getSessionError) {
          // If session retrieval failed due to a token issue, clear it locally
          const m = getSessionError.message?.toLowerCase?.() ?? '';
          if (m.includes('invalid refresh token') || m.includes('refresh token not found')) {
            await supabase.auth.signOut({ scope: 'local' });
          }
        } else if (data.session) {
          // init() effect will map and upsert as needed; nothing else to do here
        }
      }

      SecurityLogger.log('user_registered', {
        userId: authRes.user.id,
        email: sanitizedEmail,
        tier: 'free',
      });

      setIsLoading(false);
      return { success: true, isDuplicate: false };
    } catch (error) {
      const normalized = normalizeError(error, 'user_registration');
      SecurityLogger.log(
        'registration_error',
        { email, errorCode: normalized.code, requestId: normalized.requestId },
        'error',
      );
      setIsLoading(false);
      return {
        success: false,
        error: formatErrorMessage(normalized),
        isDuplicate: false,
      };
    }
  };

  // Verify signup OTP that was emailed to the user (when Email OTP is enabled in Supabase)
  const verifySignupOtp = async (
    email: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const { data, error } = await supabase.auth.verifyOtp({
        email: sanitizedEmail,
        token,
        type: 'email',
      } as VerifyOtpParams);

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // If a session is returned, the auth listener/init flow will load profile
      if (data?.session?.user) {
        SecurityLogger.log('email_verified_via_otp', {
          userId: data.session.user.id,
          email: sanitizedEmail,
        });
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      const normalized = normalizeError(error, 'verify_signup_otp');
      setIsLoading(false);
      return {
        success: false,
        error: formatErrorMessage(normalized),
      };
    }
  };

  // Resend signup OTP email
  const resendSignupOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sanitizedEmail,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      const normalized = normalizeError(error, 'resend_signup_otp');
      return {
        success: false,
        error: formatErrorMessage(normalized),
      };
    }
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());

      // Added: client-side validation guard to prevent unnecessary auth calls (which produced 400 errors in console)
      const emailCheck = validateEmail(sanitizedEmail);
      if (!emailCheck.isValid) {
        setIsLoading(false);
        return { success: false, error: emailCheck.errors[0] };
      }
      if (!password || password.length === 0) {
        // Do not treat as a failed attempt for rate limiting – just return a validation error
        setIsLoading(false);
        return { success: false, error: 'Please enter your password.' };
      }

      // Check rate limiting
      const rateLimitCheck = rateLimiter.isRateLimited(sanitizedEmail);
      if (rateLimitCheck.isLimited) {
        SecurityLogger.log(
          'login_blocked',
          { email: sanitizedEmail, reason: 'rate_limited' },
          'warning',
        );
        setSecurityState((prev) => ({
          ...prev,
          isLocked: true,
          lockoutTime: rateLimitCheck.remainingTime,
        }));
        setIsLoading(false);
        return {
          success: false,
          error: `Too many failed attempts. Please try again in ${rateLimitCheck.remainingTime} minutes.`,
        };
      }

      // Attempt Supabase sign-in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (signInError || !signInData.user) {
        rateLimiter.recordFailedAttempt(sanitizedEmail);
        updateSecurityState(sanitizedEmail);
        SecurityLogger.log(
          'login_failed',
          {
            email: sanitizedEmail,
            reason: signInError?.message ?? 'auth_failed',
          },
          'warning',
        );
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password' };
      }
      // Successful login
      rateLimiter.recordSuccessfulLogin(sanitizedEmail);
      setSecurityState((prev) => ({
        ...prev,
        remainingAttempts: 5,
        isLocked: false,
        lockoutTime: undefined,
      }));
      // Update profile last login, reset attempts
      try {
        await updateProfile(signInData.user.id, {
          last_login_at: new Date().toISOString(),
          login_attempts: 0,
          is_locked: false,
          locked_until: null,
        });
      } catch (err) {
        const normalized = normalizeError(err, 'profile_update_login');
        SecurityLogger.log(
          'profile_update_failed',
          {
            userId: signInData.user.id,
            errorCode: normalized.code,
            requestId: normalized.requestId,
          },
          'error',
        );
      }

      const profile = await getProfile(signInData.user.id);
      const mapped: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name ?? signInData.user.email ?? 'User',
        tier: (profile.tier as User['tier']) ?? 'free',
        verified: profile.verified,
        joinDate: profile.join_date,
        lastLoginAt: profile.last_login_at ?? undefined,
        loginAttempts: profile.login_attempts,
        isLocked: profile.is_locked,
        lockedUntil: profile.locked_until ?? undefined,
      };

      setUser(mapped);

      SecurityLogger.log('user_login', {
        userId: mapped.id,
        email: sanitizedEmail,
      });

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      const normalized = normalizeError(error, 'user_login');
      SecurityLogger.log(
        'login_error',
        { email, errorCode: normalized.code, requestId: normalized.requestId },
        'error',
      );
      setIsLoading(false);
      return { success: false, error: formatErrorMessage(normalized) };
    }
  };

  const logout = async (): Promise<void> => {
    if (user) {
      SecurityLogger.log('user_logout', { userId: user.id });
    }
    await supabase.auth.signOut();
    // Session is cleared by Supabase signOut
    setUser(null);
    setSecurityState((prev) => ({
      ...prev,
      remainingAttempts: 5,
      isLocked: false,
      lockoutTime: undefined,
    }));
  };

  // Start of removed/added code for subscription removal
  // Removed for subscription removal: updateTier function implementation
  const updateTier = (tier: 'free' | 'advanced' | 'expert'): void => {
    /*
    if (user) {
      const updatedUser = { ...user, tier };
      setUser(updatedUser);
      // Persist to profile
      updateProfile(user.id, { tier }).catch((error) => {
        SecurityLogger.log(
          'update_profile_error',
          {
            userId: user.id,
            attemptedTier: tier,
            error: error instanceof Error ? error.message : String(error),
          },
          'error',
        );
      });
      SecurityLogger.log('tier_updated', {
        userId: user.id,
        oldTier: user.tier,
        newTier: tier,
      });
    }
    */
    // Added for subscription removal: only allow free tier
    if (user && tier === 'free') {
      const updatedUser: User = { ...user, tier: 'free' as const };
      setUser(updatedUser);
      // Persist to profile
      updateProfile(user.id, { tier: 'free' }).catch((error) => {
        SecurityLogger.log(
          'update_profile_error',
          {
            userId: user.id,
            attemptedTier: 'free',
            error: error instanceof Error ? error.message : String(error),
          },
          'error',
        );
      });
      SecurityLogger.log('tier_updated', {
        userId: user.id,
        oldTier: user.tier,
        newTier: 'free',
      });
    } else if (user && tier !== 'free') {
      // Log attempt to set non-free tier
      SecurityLogger.log('tier_change_attempt', { userId: user.id, attemptedTier: tier }, 'info');
    }
  };
  // End of removed/added code for subscription removal

  const extendSession = (): void => {
    // Session extension is handled automatically by Supabase with autoRefreshToken: true
    if (user) {
      SecurityLogger.log('session_extended', { userId: user.id });
    }
  };

  const updateSecurityState = (email: string): void => {
    const remaining = rateLimiter.getRemainingAttempts(email);
    setSecurityState((prev) => ({
      ...prev,
      remainingAttempts: remaining,
      isLocked: remaining <= 0,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        verifySignupOtp,
        resendSignupOtp,
        logout,
        isLoading,
        updateTier,
        securityState,
        extendSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
