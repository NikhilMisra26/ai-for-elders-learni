import React, { useState, useEffect } from 'react';
import { CircleNotch, PaperPlaneTilt, CheckCircle, Warning, Clock } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendSupportEmail, checkSupportEmailRateLimit } from '@/lib/supportEmail';
import type { SendSupportEmailResponse } from '@/lib/supportEmail';

export function SupportEmailForm(): React.ReactElement {
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [response, setResponse] = useState<SendSupportEmailResponse | null>(null);
  const [canSend, setCanSend] = useState<boolean>(true);
  const [minutesUntilNextAllowed, setMinutesUntilNextAllowed] = useState<number>(0);

  // Check rate limit on mount and after submission
  const checkRateLimit = async (): Promise<void> => {
    const result = await checkSupportEmailRateLimit();
    setCanSend(result.canSend);
    setMinutesUntilNextAllowed(result.minutesUntilNextAllowed);
  };

  useEffect(() => {
    void checkRateLimit();
  }, []);

  // Update rate limit countdown every minute
  useEffect((): (() => void) | undefined => {
    if (minutesUntilNextAllowed > 0) {
      const timer = setTimeout(() => {
        setMinutesUntilNextAllowed((prev) => {
          const newValue = Math.max(0, prev - 1);
          // Re-check server rate limit when countdown reaches zero
          if (newValue === 0) {
            void checkRateLimit();
          }
          return newValue;
        });
      }, 60000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [minutesUntilNextAllowed]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!message.trim() || !canSend) {
      return;
    }

    setIsSubmitting(true);
    setResponse(null);

    try {
      const result = await sendSupportEmail({ message });
      setResponse(result);

      if (result.success) {
        setMessage('');
        // Re-check rate limit after successful submission
        await checkRateLimit();
      }
    } catch {
      setResponse({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCount = (): string => {
    const count = message.length;
    if (count === 0) return '0 / 5000';
    if (count < 10) return `${count} / 5000 (minimum 10)`;
    if (count > 4900) return `${count} / 5000`;
    return `${count} / 5000`;
  };

  const getCharacterCountColor = (): string => {
    const count = message.length;
    if (count < 10 && count > 0) return 'text-orange-600';
    if (count > 4900) return 'text-red-600';
    if (count > 4500) return 'text-orange-600';
    return 'text-gray-500';
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          Send us a message and we&apos;ll get back to you as soon as possible. Our support team
          typically responds within 24-48 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className='space-y-4'>
          {/* Rate limit warning */}
          {!canSend && minutesUntilNextAllowed > 0 && (
            <Alert className='border-orange-200 bg-orange-50'>
              <Clock className='h-4 w-4 text-orange-600' />
              <AlertTitle className='text-orange-800'>Rate Limit</AlertTitle>
              <AlertDescription className='text-orange-700'>
                You&apos;ve reached the maximum number of support requests for this hour. You can
                send another message in {minutesUntilNextAllowed} minute
                {minutesUntilNextAllowed !== 1 ? 's' : ''}.
              </AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {response?.success && (
            <Alert className='border-green-200 bg-green-50'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <AlertTitle className='text-green-800'>Message Sent Successfully</AlertTitle>
              <AlertDescription className='text-green-700'>
                Your support request has been received. Ticket ID: {response.ticketId}
                <br />
                We&apos;ll respond to your registered email address within 24-48 hours.
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {response && !response.success && (
            <Alert className='border-red-200 bg-red-50'>
              <Warning className='h-4 w-4 text-red-600' />
              <AlertTitle className='text-red-800'>Failed to Send Message</AlertTitle>
              <AlertDescription className='text-red-700'>{response.error}</AlertDescription>
            </Alert>
          )}

          {/* Message textarea */}
          <div className='space-y-2'>
            <label htmlFor='support-message' className='text-sm font-medium'>
              Your Message
            </label>
            <Textarea
              id='support-message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Please describe your issue or question in detail...'
              className='min-h-[150px] resize-y'
              disabled={isSubmitting || !canSend}
              maxLength={5000}
              required
              aria-describedby='character-count'
            />
            <div id='character-count' className={`text-sm ${getCharacterCountColor()}`}>
              {getCharacterCount()}
            </div>
          </div>

          {/* Submit button */}
          <Button
            type='submit'
            disabled={
              isSubmitting || !canSend || message.trim().length < 10 || message.length > 5000
            }
            className='w-full sm:w-auto'
          >
            {isSubmitting ? (
              <>
                <CircleNotch className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <PaperPlaneTilt className='mr-2 h-4 w-4' />
                Send Message
              </>
            )}
          </Button>

          {/* Help text */}
          <p className='text-sm text-gray-500'>
            Please do not include sensitive information like passwords or payment details in your
            message. Our support team will never ask for your password.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
