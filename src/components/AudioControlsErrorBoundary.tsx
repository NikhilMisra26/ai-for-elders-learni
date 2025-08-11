import React, { Component, type ReactNode } from 'react';
import { Warning, X } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AudioControlsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Audio controls error:', error, errorInfo);
    this.props.onError?.();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Alert variant='destructive' className='mx-4 my-2'>
          <Warning className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between'>
            <span>Audio controls encountered an error</span>
            <div className='flex gap-2 ml-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
                className='h-7 px-2 text-xs'
              >
                Retry
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  this.props.onError?.();
                  this.setState({ hasError: false, error: undefined });
                }}
                className='h-7 px-2 text-xs'
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
