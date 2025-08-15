import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeSlash, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { normalizeError, formatErrorMessage } from '@/lib/errorNormalization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { checkPasswordWithWarning } from '@/lib/breachDetection';

export function ResetPasswordPage(): ReactElement {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [breachWarning, setBreachWarning] = useState('');
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async (): Promise<void> => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setIsValidToken(false);
        toast.error('Invalid or expired reset link', {
          description: 'Please request a new password reset',
        });
      }
    };

    void checkSession();
  }, []);

  // Check for password breaches when new password changes
  useEffect(() => {
    if (newPassword && newPassword.length >= 8) {
      const checkBreach = async (): Promise<void> => {
        setIsCheckingBreach(true);
        try {
          const { warning } = await checkPasswordWithWarning(newPassword);
          setBreachWarning(warning);
        } catch (error) {
          // Silently fail breach check - don't expose error to user
          normalizeError(error, 'password_breach_check_reset');
          setBreachWarning('');
        } finally {
          setIsCheckingBreach(false);
        }
      };

      // Debounce the breach check
      const timer = setTimeout(() => {
        void checkBreach();
      }, 500);

      return (): void => {
        clearTimeout(timer);
      };
    }

    setBreachWarning('');
    return undefined;
  }, [newPassword]);

  const validatePasswords = (): string | null => {
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handlePasswordReset = async (): Promise<void> => {
    const validationError = validatePasswords();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        const normalized = normalizeError(error, 'password_reset');
        toast.error('Failed to reset password', {
          description: formatErrorMessage(normalized),
        });
        setIsLoading(false);
        return;
      }

      // Success
      toast.success('Password reset successfully!', {
        description: 'You can now sign in with your new password',
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        void navigate('/');
      }, 2000);
    } catch (error) {
      const normalized = normalizeError(error, 'password_reset_confirm');
      toast.error('Password reset failed', {
        description: formatErrorMessage(normalized),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (!password) return '';
    if (password.length < 8) return 'Weak';
    if (password.length < 12) return 'Fair';
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      return 'Strong';
    }
    return 'Good';
  };

  const strength = getPasswordStrength(newPassword);
  const strengthColor =
    strength === 'Strong'
      ? 'text-green-600'
      : strength === 'Good'
        ? 'text-blue-600'
        : strength === 'Fair'
          ? 'text-yellow-600'
          : 'text-red-600';

  if (!isValidToken) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
              <XCircle className='h-6 w-6 text-red-600' />
            </div>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription className='mt-2'>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className='w-full'
              onClick={() => {
                void navigate('/');
              }}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Lock className='h-6 w-6 text-primary' />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Choose a new secure password for your account</CardDescription>
        </CardHeader>

        <CardContent>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='new-password'>New Password</Label>
              <div className='relative'>
                <Input
                  id='new-password'
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e): void => setNewPassword(e.target.value)}
                  placeholder='Enter new password (min 8 characters)'
                  disabled={isLoading}
                  className='pr-10'
                  autoComplete='new-password'
                  autoFocus
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={(): void => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeSlash className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
              </div>
              {newPassword && (
                <p className={`text-sm ${strengthColor}`}>Password strength: {strength}</p>
              )}

              {/* Password breach warning */}
              {breachWarning && (
                <div className='bg-orange-50 border border-orange-200 rounded-lg p-3'>
                  <div className='flex items-start gap-2'>
                    <Warning className='h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0' />
                    <div className='flex-1'>
                      <p className='text-sm text-orange-800 font-medium'>Security Warning</p>
                      <p className='text-sm text-orange-700 mt-1'>{breachWarning}</p>
                    </div>
                  </div>
                </div>
              )}

              {isCheckingBreach && (
                <p className='text-sm text-muted-foreground'>Checking password security...</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Confirm New Password</Label>
              <div className='relative'>
                <Input
                  id='confirm-password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e): void => setConfirmPassword(e.target.value)}
                  placeholder='Confirm your new password'
                  disabled={isLoading}
                  className='pr-10'
                  autoComplete='new-password'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={(): void => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeSlash className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className='text-sm text-red-600'>Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && (
                <p className='text-sm text-green-600 flex items-center gap-1'>
                  <CheckCircle className='w-4 h-4' />
                  Passwords match
                </p>
              )}
            </div>

            <Button
              className='w-full'
              onClick={(): void => void handlePasswordReset()}
              disabled={
                isLoading || !newPassword || !confirmPassword || isCheckingBreach || !!breachWarning
              }
            >
              {isLoading
                ? 'Resetting...'
                : isCheckingBreach
                  ? 'Checking security...'
                  : breachWarning
                    ? 'Choose a different password'
                    : 'Reset Password'}
            </Button>

            <div className='text-center'>
              <Button
                variant='link'
                onClick={() => {
                  void navigate('/');
                }}
                disabled={isLoading}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
