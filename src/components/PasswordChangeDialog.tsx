import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeSlash, Warning } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import { normalizeError } from '@/lib/errorNormalization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { checkPasswordWithWarning } from '@/lib/breachDetection';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangeDialog({
  open,
  onOpenChange,
}: PasswordChangeDialogProps): ReactElement {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [breachWarning, setBreachWarning] = useState('');
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

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
          normalizeError(error, 'password_breach_check_change');
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
    if (!currentPassword) return 'Current password is required';
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    if (newPassword === currentPassword)
      return 'New password must be different';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handlePasswordChange = async (): Promise<void> => {
    if (!user?.email) {
      toast.error('User session not found');
      return;
    }

    const validationError = validatePasswords();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify current password by attempting sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        toast.error('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      // Step 2: Update password securely via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error('Failed to update password', {
          description: 'Please try again or contact support',
        });
        setIsLoading(false);
        return;
      }

      // Success - password changed
      toast.success('Password changed successfully', {
        description: 'Your password has been updated securely',
      });

      // Clear form and close dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (error) {
      normalizeError(error, 'password_change');
      toast.error('An unexpected error occurred', {
        description: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (!password) return '';
    if (password.length < 8) return 'Weak';
    if (password.length < 12) return 'Fair';
    if (
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        password,
      )
    ) {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-orange-600'>
            <Lock className='w-5 h-5 text-orange-600' />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new secure password
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='current-password' className='text-orange-600'>
              Current Password
            </Label>
            <div className='relative'>
              <Input
                id='current-password'
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e): void => setCurrentPassword(e.target.value)}
                placeholder='Enter current password'
                disabled={isLoading}
                className='pr-10'
                autoComplete='current-password'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-black'
                onClick={(): void =>
                  setShowCurrentPassword(!showCurrentPassword)
                }
                disabled={isLoading}
                aria-label={
                  showCurrentPassword ? 'Hide password' : 'Show password'
                }
              >
                {showCurrentPassword ? (
                  <EyeSlash className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          <div className='space-y-2 text-orange-600'>
            <Label htmlFor='new-password' className='text-orange-600'>
              New Password
            </Label>
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
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-black'
                onClick={(): void => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeSlash className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
            {newPassword && (
              <p className={`text-sm ${strengthColor}`}>
                Password strength: {strength}
              </p>
            )}

            {/* Password breach warning */}
            {breachWarning && (
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-3'>
                <div className='flex items-start gap-2'>
                  <Warning className='h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0' />
                  <div className='flex-1'>
                    <p className='text-sm text-orange-800 font-medium'>
                      Security Warning
                    </p>
                    <p className='text-sm text-orange-700 mt-1'>
                      {breachWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isCheckingBreach && (
              <p className='text-sm text-muted-foreground'>
                Checking password security...
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirm-password' className='text-orange-600'>
              Confirm New Password
            </Label>
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
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-black'
                onClick={(): void =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                disabled={isLoading}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
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
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={(): void => void handlePasswordChange()}
            disabled={isLoading}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
