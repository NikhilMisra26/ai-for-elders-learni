import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { EnvelopeSimple, ChatCircleText, CheckCircle } from '@phosphor-icons/react';
import type { ReactElement, KeyboardEvent, ChangeEvent } from 'react';

import { normalizeError, formatErrorMessage } from '@/lib/errorNormalization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface EmailSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSupportDialog({ open, onOpenChange }: EmailSupportDialogProps): ReactElement {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Message constraints
  const MIN_MESSAGE_LENGTH = 10;
  const MAX_MESSAGE_LENGTH = 2000;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setMessage('');
      setMessageSent(false);
      // Focus textarea when dialog opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const validateMessage = (text: string): string | null => {
    const trimmedMessage = text.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      return `Message must be at least ${MIN_MESSAGE_LENGTH} characters`;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return `Message must be less than ${MAX_MESSAGE_LENGTH} characters`;
    }

    // Basic XSS prevention - check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<embed/i,
      /<object/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedMessage)) {
        return 'Message contains invalid content';
      }
    }

    return null;
  };

  const sanitizeMessage = (text: string): string => {
    // Remove any HTML tags and trim whitespace
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  };

  const handleSendMessage = async (): Promise<void> => {
    const validationError = validateMessage(message);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedMessage = sanitizeMessage(message);

      // Get current user details
      const userEmail = user?.email ?? 'anonymous@discover50ai.com';
      // Get the auth user for metadata access
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      const userName =
        (authUser?.user_metadata?.full_name as string | undefined) ??
        (authUser?.user_metadata?.name as string | undefined) ??
        user?.name ??
        null;

      // Get user tier from profile if available
      let userTier = 'free';
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single();

        if (profile?.tier) {
          userTier = profile.tier as string;
        }
      }

      // Insert into support_tickets table
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id ?? '00000000-0000-0000-0000-000000000000', // Anonymous UUID if not logged in
          message: sanitizedMessage,
          user_email: userEmail,
          user_name: userName,
          user_tier: userTier,
          category: 'general',
          priority: 'normal',
        })
        .select()
        .single();

      if (error) {
        // Handle rate limiting or other database errors
        if (error.code === '23505') {
          throw new Error('Too many support requests. Please wait before sending another message.');
        }
        throw error;
      }

      setMessageSent(true);
      toast.success('Support message sent successfully');

      // Auto-close dialog after showing success
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      const normalized = normalizeError(error, 'support_message_send');
      toast.error('Failed to send support message', {
        description: formatErrorMessage(normalized),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setMessage('');
      setMessageSent(false);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Allow Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      void handleSendMessage();
    }
    // Escape key closes dialog
    if (e.key === 'Escape' && !isLoading) {
      handleClose();
    }
  };

  const characterCount = message.length;
  const isMessageValid =
    message.trim().length >= MIN_MESSAGE_LENGTH && message.trim().length <= MAX_MESSAGE_LENGTH;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !isLoading) {
          handleClose();
        }
      }}
    >
      <DialogContent className='sm:max-w-[500px]' aria-describedby='support-dialog-description'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-lg'>
            <ChatCircleText className='w-5 h-5' />
            Contact Support
          </DialogTitle>
          <DialogDescription id='support-dialog-description'>
            Send a message to the DISCOVER 50 AI support team
          </DialogDescription>
        </DialogHeader>

        {!messageSent ? (
          <>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='support-message' className='text-base'>
                  Your Message
                </Label>
                <Textarea
                  ref={textareaRef}
                  id='support-message'
                  value={message}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>): void =>
                    setMessage(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder='What would you like the DISCOVER 50 AI team to know?'
                  disabled={isLoading}
                  className='min-h-[150px] text-base resize-none'
                  aria-label='Support message'
                  aria-describedby='character-count'
                  aria-invalid={characterCount > MAX_MESSAGE_LENGTH}
                  maxLength={MAX_MESSAGE_LENGTH + 100} // Allow typing over to show error
                />
                <div id='character-count' className='flex justify-between items-center text-sm'>
                  <p className='text-muted-foreground'>Press Ctrl+Enter to send</p>
                  <p
                    className={
                      characterCount > MAX_MESSAGE_LENGTH
                        ? 'text-destructive font-medium'
                        : characterCount > MAX_MESSAGE_LENGTH * 0.9
                          ? 'text-yellow-600 dark:text-yellow-500'
                          : 'text-muted-foreground'
                    }
                    aria-live='polite'
                  >
                    {characterCount} / {MAX_MESSAGE_LENGTH}
                  </p>
                </div>
                {characterCount < MIN_MESSAGE_LENGTH && characterCount > 0 && (
                  <p className='text-sm text-muted-foreground'>
                    Minimum {MIN_MESSAGE_LENGTH} characters required
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className='gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
                className='min-w-[100px]'
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={(): void => void handleSendMessage()}
                disabled={isLoading || !isMessageValid}
                className={`min-w-[120px] ${
                  isMessageValid && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                aria-label={isLoading ? 'Sending message' : 'Send support message'}
              >
                {isLoading ? (
                  <>
                    <span className='animate-pulse'>Sending...</span>
                  </>
                ) : (
                  <>
                    <EnvelopeSimple className='w-4 h-4' />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className='py-8 text-center' role='status' aria-live='polite'>
              <div
                className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'
                aria-hidden='true'
              >
                <CheckCircle className='h-8 w-8 text-green-600 dark:text-green-500' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>Message Sent!</h3>
              <p className='text-base text-muted-foreground mb-4'>Thank you for contacting us!</p>
              <p className='text-base font-medium text-foreground mb-2'>
                Look in your email inbox for a response
              </p>
              <p className='text-sm text-muted-foreground mt-4'>
                Our support team typically responds within 24-48 hours.
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                Please check your spam folder if you don&apos;t see our response.
              </p>
            </div>

            <DialogFooter>
              <Button
                type='button'
                className='w-full min-h-[44px] text-base'
                onClick={handleClose}
                autoFocus
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
