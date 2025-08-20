import React from 'react';
import { UserCircle, Key, ArrowLeft } from '@phosphor-icons/react';
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

interface EmailAlreadyExistsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForgotPassword: () => void;
  onReturnToSignIn: () => void;
}

export function EmailAlreadyExistsDialog({
  open,
  onOpenChange,
  onForgotPassword,
  onReturnToSignIn,
}: EmailAlreadyExistsDialogProps): ReactElement {
  const handleForgotPassword = (): void => {
    onOpenChange(false);
    onForgotPassword();
  };

  const handleReturnToSignIn = (): void => {
    onOpenChange(false);
    onReturnToSignIn();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    // Handle Escape key to close dialog
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[475px]' onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-black'>
            <UserCircle className='w-5 h-5 text-orange-600' weight='duotone' />
            Account May Already Exist
          </DialogTitle>
          <DialogDescription className='text-base'>
            This email address might already be associated with an account. If you already have an
            account, you can sign in or reset your password.
          </DialogDescription>
        </DialogHeader>

        <div className='py-6 space-y-4'>
          <div className='bg-muted/50 rounded-lg p-4 space-y-3'>
            <h3 className='font-medium text-sm text-orange-600'>What would you like to do?</h3>

            <div className='space-y-2 text-sm text-muted-foreground'>
              <p className='flex items-start gap-2'>
                <span className='font-medium text-foreground'>•</span>
                If you forgot your password, we can send you a reset link
              </p>
              <p className='flex items-start gap-2'>
                <span className='font-medium text-foreground'>•</span>
                If you remember your password, return to sign in
              </p>
              <p className='flex items-start gap-2'>
                <span className='font-medium text-foreground'>•</span>
                If you&apos;re sure you don&apos;t have an account, try a different email
              </p>
            </div>
          </div>

          <div className='bg-blue-50  border border-blue-200  rounded-lg p-3'>
            <p className='text-sm text-blue-700 '>
              <strong>Tip:</strong> Check if you might have signed up with a different email
              address, such as a work or personal email.
            </p>
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-col gap-2 sm:space-x-0'>
          <Button
            type='button'
            onClick={handleForgotPassword}
            className='w-full h-11 text-base'
            size='lg'
            aria-label='Reset password for existing account'
          >
            <Key className='w-4 h-4 mr-2' />
            Forgot Password?
          </Button>

          <Button
            type='button'
            variant='outline'
            onClick={handleReturnToSignIn}
            className='w-full h-11 text-base'
            size='lg'
            aria-label='Return to sign in form'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Return to Sign In
          </Button>

          <Button
            type='button'
            variant='ghost'
            onClick={(): void => onOpenChange(false)}
            className='w-full h-10 text-sm text-muted-foreground hover:text-foreground'
            aria-label='Close dialog and try different email'
          >
            Try Different Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
