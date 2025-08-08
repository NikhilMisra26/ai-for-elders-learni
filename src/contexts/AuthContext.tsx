import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';

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
  logout: () => void;
  isLoading: boolean;
  updateTier: (tier: 'free' | 'advanced' | 'expert') => void;
  securityState: SecurityState;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useKV<User | null>('current-user', null);
  const [users, setUsers] = useKV<User[]>('users', []);
  const [passwords, setPasswords] = useKV<Record<string, string>>(
    'user-passwords',
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimiter] = useState(() => new RateLimiter());
  const [securityState, setSecurityState] = useState<SecurityState>({
    rateLimiter,
    remainingAttempts: 5,
    isLocked: false,
  });

  // Check session validity on load
  useEffect(() => {
    const session = SessionManager.getSession();
    if (session && user) {
      // Session is valid, extend it
      SessionManager.extendSession();
      SecurityLogger.log('session_extended', { userId: user.id });
    } else if (user && !session) {
      // User data exists but no valid session, log out
      logout();
      SecurityLogger.log('session_expired', { userId: user.id }, 'warning');
    }
  }, [user]);

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

      // Check if user already exists
      const existingUser = users.find((u) => u.email === sanitizedEmail);
      if (existingUser) {
        SecurityLogger.log(
          'registration_failed',
          { email: sanitizedEmail, reason: 'email_exists' },
          'warning',
        );
        setIsLoading(false);
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: sanitizedEmail,
        name: sanitizedName,
        tier: 'free',
        verified: true, // Simulated email verification
        joinDate: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginAttempts: 0,
        isLocked: false,
      };

      // Store password securely (in real app, this would be hashed)
      const hashedPassword = await hashPassword(password);

      setUsers((currentUsers) => [...currentUsers, newUser]);
      setPasswords((currentPasswords) => ({
        ...currentPasswords,
        [newUser.id]: hashedPassword,
      }));

      setUser(newUser);

      // Create session
      SessionManager.createSession(newUser.id);

      SecurityLogger.log('user_registered', {
        userId: newUser.id,
        email: sanitizedEmail,
        tier: newUser.tier,
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
        error: 'Registration failed. Please try again.',
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

      // Find user
      const foundUser = users.find((u) => u.email === sanitizedEmail);
      if (!foundUser) {
        rateLimiter.recordFailedAttempt(sanitizedEmail);
        updateSecurityState(sanitizedEmail);
        SecurityLogger.log(
          'login_failed',
          { email: sanitizedEmail, reason: 'user_not_found' },
          'warning',
        );
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if user account is locked
      if (foundUser.isLocked && foundUser.lockedUntil) {
        const lockUntil = new Date(foundUser.lockedUntil);
        if (new Date() < lockUntil) {
          SecurityLogger.log(
            'login_blocked',
            { userId: foundUser.id, reason: 'account_locked' },
            'warning',
          );
          setIsLoading(false);
          return {
            success: false,
            error: 'Account is temporarily locked. Please try again later.',
          };
        } else {
          // Unlock account if lockout period expired
          const updatedUser = {
            ...foundUser,
            isLocked: false,
            lockedUntil: undefined,
            loginAttempts: 0,
          };
          setUsers((currentUsers) =>
            currentUsers.map((u) => (u.id === foundUser.id ? updatedUser : u)),
          );
        }
      }

      // Verify password
      const storedPassword = passwords[foundUser.id];
      if (
        !storedPassword ||
        !(await verifyPassword(password, storedPassword))
      ) {
        rateLimiter.recordFailedAttempt(sanitizedEmail);
        updateSecurityState(sanitizedEmail);

        // Update user login attempts
        const attempts = (foundUser.loginAttempts || 0) + 1;
        const shouldLock = attempts >= 5;
        const updatedUser = {
          ...foundUser,
          loginAttempts: attempts,
          isLocked: shouldLock,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : undefined,
        };

        setUsers((currentUsers) =>
          currentUsers.map((u) => (u.id === foundUser.id ? updatedUser : u)),
        );

        SecurityLogger.log(
          'login_failed',
          {
            userId: foundUser.id,
            attempts,
            locked: shouldLock,
            reason: 'invalid_password',
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

      // Update user last login and reset attempts
      const updatedUser = {
        ...foundUser,
        lastLoginAt: new Date().toISOString(),
        loginAttempts: 0,
        isLocked: false,
        lockedUntil: undefined,
      };

      setUsers((currentUsers) =>
        currentUsers.map((u) => (u.id === foundUser.id ? updatedUser : u)),
      );

      setUser(updatedUser);

      // Create session
      SessionManager.createSession(updatedUser.id);

      SecurityLogger.log('user_login', {
        userId: updatedUser.id,
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

  const logout = () => {
    if (user) {
      SecurityLogger.log('user_logout', { userId: user.id });
    }

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
      setUsers((currentUsers) =>
        currentUsers.map((u) => (u.id === user.id ? updatedUser : u)),
      );

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
