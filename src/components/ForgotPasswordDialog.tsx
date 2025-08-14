import React, { useState } from 'react';
import { toast } from 'sonner';
import { EnvelopeSimple, Key } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

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

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: ForgotPasswordDialogProps): ReactElement {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handlePasswordReset = async (): Promise<void> => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Use Supabase Auth to send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Don't expose whether email exists for security
        toast.error('Failed to send reset email', {
          description:
            'If an account exists with this email, you will receive a reset link',
        });
      } else {
        setEmailSent(true);
        toast.success('Password reset email sent!', {
          description: 'Please check your email for the reset link',
        });

        // Close dialog after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred', {
        description: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setEmail('');
      setEmailSent(false);
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !isLoading) {
      void handlePasswordReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Key className='w-5 h-5' />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </DialogDescription>
        </DialogHeader>

        {!emailSent ? (
          <>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='reset-email'>Email Address</Label>
                <div className='relative'>
                  <Input
                    id='reset-email'
                    type='email'
                    value={email}
                    onChange={(e): void => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder='Enter your email address'
                    disabled={isLoading}
                    className='pl-10'
                    autoComplete='email'
                    autoFocus
                  />
                  <EnvelopeSimple className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                </div>
                <p className='text-sm text-muted-foreground'>
                  We&apos;ll send a password reset link to this email address
                </p>
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
                onClick={(): void => void handlePasswordReset()}
                disabled={isLoading || !email}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className='py-8 text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
                <EnvelopeSimple className='h-6 w-6 text-green-600' />
              </div>
              <h3 className='text-lg font-medium mb-2'>Email Sent!</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                We&apos;ve sent a password reset link to:
              </p>
              <p className='font-medium'>{email}</p>
              <p className='text-sm text-muted-foreground mt-4'>
                Please check your email and follow the instructions to reset
                your password.
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                Didn&apos;t receive the email? Check your spam folder.
              </p>
            </div>

            <DialogFooter>
              <Button type='button' className='w-full' onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
