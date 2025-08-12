import { Warning, ArrowsClockwise, House } from '@phosphor-icons/react';
import type { FallbackProps } from 'react-error-boundary';
import type { ReactElement } from 'react';

import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps): ReactElement => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;

  const handleGoHome = (): void => {
    window.location.href = '/home';
  };

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-2xl'>
        <Card className='text-center'>
          <CardHeader className='pb-4'>
            <div className='mx-auto mb-4 w-16 h-16 bg-muted rounded-full flex items-center justify-center'>
              <Warning className='w-8 h-8 text-destructive' />
            </div>
            <CardTitle className='text-2xl font-semibold text-foreground mb-2'>
              Something Went Wrong
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed'>
              <p className='mb-4'>
                We&apos;re sorry, but something unexpected happened while
                loading this page.
              </p>
              <p>
                This is usually a temporary issue. Please try refreshing the
                page or going back to the home page.
              </p>
            </div>

            {/* Only show error details in development or if error is user-friendly */}
            {import.meta.env.DEV && (
              <div className='bg-card border rounded-lg p-4 text-left'>
                <h3 className='font-semibold text-sm text-muted-foreground mb-2'>
                  Error Details (Development Mode):
                </h3>
                <pre className='text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32'>
                  {String((error as { message?: unknown }).message ?? '')}
                </pre>
              </div>
            )}

            <div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
              <Button
                onClick={() => resetErrorBoundary()}
                size='lg'
                className='min-h-[48px] text-base font-medium'
                aria-label='Try to reload this page'
              >
                <ArrowsClockwise className='w-5 h-5 mr-2' />
                Try Again
              </Button>

              <Button
                onClick={handleGoHome}
                variant='outline'
                size='lg'
                className='min-h-[48px] text-base font-medium'
                aria-label='Go back to home page'
              >
                <House className='w-5 h-5 mr-2' />
                Go to Home
              </Button>
            </div>

            <div className='pt-4 border-t border-border'>
              <p className='text-sm text-muted-foreground'>
                If this problem continues, please contact our support team for
                assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
