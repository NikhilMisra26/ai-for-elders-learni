import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

import { useKV } from '@/lib/kv';
import { supabase } from '@/lib/supabaseClient';
import { upsertProfile, getProfile, updateProfile } from '@/lib/db';
import {
  validateEmail,
  validatePassword,
  RateLimiter,
  SessionManager,
  SecurityLogger,
  sanitizeInput,
} from '@/lib/security';

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
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifySignupOtp: (
    email: string,
    token: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resendSignupOtp: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  updateTier: (tier: 'free' | 'advanced' | 'expert') => void;
  securityState: SecurityState;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useKV<User | null>('current-user', null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimiter] = useState(() => new RateLimiter());
  const [securityState, setSecurityState] = useState<SecurityState>({
    rateLimiter,
    remainingAttempts: 5,
    isLocked: false,
  });

  // Initialize Supabase auth listener and hydrate user profile
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data.session?.user;
      if (authUser) {
        try {
          const profile = await getProfile(authUser.id);
          const mapped: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name || authUser.email || 'User',
            tier: (profile.tier as User['tier']) || 'free',
            verified: profile.verified,
            joinDate: profile.join_date,
            lastLoginAt: profile.last_login_at || undefined,
            loginAttempts: profile.login_attempts,
            isLocked: profile.is_locked,
            lockedUntil: profile.locked_until || undefined,
          };
          setUser(mapped);
        } catch (e) {
          // First-time user: create profile
          const email = authUser.email || 'unknown@example.com';
          const newProfile = await upsertProfile({
            id: authUser.id,
            email,
            name: authUser.user_metadata?.name || '',
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
            name: newProfile.name || email,
            tier: 'free',
            verified: newProfile.verified,
            joinDate: newProfile.join_date,
          });
        }
      } else {
        setUser(null);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      init();
    });
    init();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setUser]);

  const register = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; error?: string }> => {
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
        return { success: false, error: emailValidation.errors[0] };
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
        return { success: false, error: passwordValidation.errors[0] };
      }

      // Register user with Supabase auth
      const { data: authRes, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: { name: sanitizedName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error || !authRes.user) {
        setIsLoading(false);
        return { success: false, error: error?.message || 'Registration failed' };
      }

      // If a session exists (email confirmations disabled), profile will be created by init()
      // If no session (email confirmations enabled), skip profile creation now and let init() handle it after verification.
      const hasSession = !!authRes.session;
      if (hasSession) {
        // Trigger init flow by setting user state via auth listener
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // init() effect will map and upsert as needed; nothing else to do here
        }
      }

      SecurityLogger.log('user_registered', {
        userId: authRes.user.id,
        email: sanitizedEmail,
        tier: 'free',
      });

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      SecurityLogger.log(
        'registration_error',
        { email, error: error instanceof Error ? error.message : 'unknown' },
        'error',
      );
      setIsLoading(false);
      return {
        success: false,
        error:
          error instanceof Error && error.message
            ? error.message
            : 'Registration failed. Please try again.',
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
      } as any);

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
    } catch (e) {
      setIsLoading(false);
      return {
        success: false,
        error: e instanceof Error && e.message ? e.message : 'Failed to verify code',
      };
    }
  };

  // Resend signup OTP email
  const resendSignupOtp = async (
    email: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sanitizedEmail,
      } as any);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error && e.message ? e.message : 'Failed to resend code',
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
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

      if (signInError || !signInData.user) {
        rateLimiter.recordFailedAttempt(sanitizedEmail);
        updateSecurityState(sanitizedEmail);
        SecurityLogger.log(
          'login_failed',
          { email: sanitizedEmail, reason: signInError?.message || 'auth_failed' },
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
        } as any);
      } catch (err) {
        SecurityLogger.log(
          'profile_update_failed',
          { userId: signInData.user.id, error: err instanceof Error ? err.message : String(err) },
          'error',
        );
      }

      const profile = await getProfile(signInData.user.id);
      const mapped: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name || signInData.user.email || 'User',
        tier: (profile.tier as User['tier']) || 'free',
        verified: profile.verified,
        joinDate: profile.join_date,
        lastLoginAt: profile.last_login_at || undefined,
        loginAttempts: profile.login_attempts,
        isLocked: profile.is_locked,
        lockedUntil: profile.locked_until || undefined,
      };

      setUser(mapped);

      SecurityLogger.log('user_login', {
  userId: mapped.id,
        email: sanitizedEmail,
      });

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      SecurityLogger.log(
        'login_error',
        { email, error: error instanceof Error ? error.message : 'unknown' },
        'error',
      );
      setIsLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    if (user) {
      SecurityLogger.log('user_logout', { userId: user.id });
    }
    await supabase.auth.signOut();
    SessionManager.clearSession();
    setUser(null);
    setSecurityState((prev) => ({
      ...prev,
      remainingAttempts: 5,
      isLocked: false,
      lockoutTime: undefined,
    }));
  };

  const updateTier = (tier: 'free' | 'advanced' | 'expert') => {
    if (user) {
      const updatedUser = { ...user, tier };
      setUser(updatedUser);
      // Persist to profile
      updateProfile(user.id, { tier } as any).catch(() => {});
      SecurityLogger.log('tier_updated', {
        userId: user.id,
        oldTier: user.tier,
        newTier: tier,
      });
    }
  };

  const extendSession = () => {
    SessionManager.extendSession();
    if (user) {
      SecurityLogger.log('session_extended', { userId: user.id });
    }
  };

  const updateSecurityState = (email: string) => {
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

// Simple password hashing for demo (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt-for-demo');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
