import { Warning, ArrowsClockwise } from '@phosphor-icons/react';
import type { FallbackProps } from 'react-error-boundary';
import type { ReactElement } from 'react';

import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps): ReactElement => {
  // In development mode, log extensive error details for debugging
  if (import.meta.env.DEV) {
    console.group('🔥 ErrorFallback - Development Mode Error Details');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    console.error('Component stack (if available):', error.componentStack);
    console.groupEnd();
  }

  const isDev = import.meta.env.DEV;

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className={`w-full ${isDev ? 'max-w-4xl' : 'max-w-md'}`}>
        <Alert variant='destructive' className='mb-6'>
          <Warning className='h-4 w-4' />
          <AlertTitle>
            {isDev ? 'Development Error' : 'This spark has encountered a runtime error'}
          </AlertTitle>
          <AlertDescription>
            {isDev 
              ? 'An error occurred during development. Check the console and error details below for debugging information.'
              : 'Something unexpected happened while running the application. The error details are shown below. Contact the spark author and let them know about this issue.'
            }
          </AlertDescription>
        </Alert>

        <div className='bg-card border rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-sm text-muted-foreground mb-2'>
            Error Details:
          </h3>
          <pre className={`text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto ${isDev ? 'max-h-96' : 'max-h-32'}`}>
            {isDev 
              ? `Error: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack trace available'}`
              : String((error as { message?: unknown }).message ?? '')
            }
          </pre>
          
          {isDev && error.componentStack && (
            <div className='mt-4'>
              <h4 className='font-semibold text-sm text-muted-foreground mb-2'>
                Component Stack:
              </h4>
              <pre className='text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-48'>
                {error.componentStack}
              </pre>
            </div>
          )}
        </div>

        <Button
          onClick={() => resetErrorBoundary()}
          className='w-full'
          variant='outline'
        >
          <ArrowsClockwise className='h-4 w-4 mr-2' />
          Try Again
        </Button>
      </div>
    </div>
  );
};
