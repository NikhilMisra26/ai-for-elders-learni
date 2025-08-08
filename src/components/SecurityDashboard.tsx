import { useState, useEffect } from 'react';
import { Shield, Warning, Info, ArrowClockwise } from '@phosphor-icons/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecurityLogger } from '@/lib/security';

interface SecurityDashboardProps {
  onClose: () => void;
}

export function SecurityDashboard({ onClose }: SecurityDashboardProps) {
  const [logs, setLogs] = useState<ReturnType<typeof SecurityLogger.getLogs>>(
    [],
  );
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>(
    'all',
  );

  const loadLogs = () => {
    const allLogs = SecurityLogger.getLogs(
      filter === 'all' ? undefined : filter,
    );
    setLogs(allLogs.slice(-50).reverse()); // Show last 50 logs, newest first
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Warning className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <Warning className='h-4 w-4 text-yellow-500' />;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default',
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventDescription = (event: string, details: any) => {
    switch (event) {
      case 'user_registered':
        return `New user registration: ${details.email}`;
      case 'user_login':
        return `User login: ${details.email}`;
      case 'user_logout':
        return `User logout: ${details.userId}`;
      case 'login_failed':
        return `Failed login attempt: ${details.email} (${details.reason})`;
      case 'login_blocked':
        return `Login blocked: ${details.email || details.userId} (${details.reason})`;
      case 'registration_failed':
        return `Registration failed: ${details.email} (${details.reason})`;
      case 'tier_updated':
        return `Tier change: ${details.oldTier} → ${details.newTier}`;
      case 'session_extended':
        return `Session extended for user: ${details.userId}`;
      case 'session_expired':
        return `Session expired for user: ${details.userId}`;
      default:
        return event.replace(/_/g, ' ').toUpperCase();
    }
  };

  const stats = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <Card className='w-full max-w-4xl max-h-[90vh] overflow-hidden m-4'>
        <CardHeader className='border-b'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Shield className='h-6 w-6 text-primary' />
              <CardTitle>Security Dashboard</CardTitle>
            </div>
            <Button variant='ghost' onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Stats */}
          <div className='flex gap-4 mt-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.info || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Info</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {stats.warning || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Warnings</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {stats.error || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Errors</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {/* Filter Controls */}
          <div className='p-4 border-b bg-muted/50'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>Filter:</span>
              {(['all', 'info', 'warning', 'error'] as const).map(
                (filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setFilter(filterOption)}
                  >
                    {filterOption.charAt(0).toUpperCase() +
                      filterOption.slice(1)}
                  </Button>
                ),
              )}
              <Button
                variant='ghost'
                size='sm'
                onClick={loadLogs}
                className='ml-auto'
              >
                <ArrowClockwise className='h-4 w-4 mr-1' />
                Refresh
              </Button>
            </div>
          </div>

          {/* Logs List */}
          <div className='max-h-96 overflow-y-auto'>
            {logs.length === 0 ? (
              <div className='p-8 text-center text-muted-foreground'>
                No security events found
              </div>
            ) : (
              <div className='space-y-1'>
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className='p-3 border-b hover:bg-muted/50 transition-colors'
                  >
                    <div className='flex items-start gap-3'>
                      {getSeverityIcon(log.severity)}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          {getSeverityBadge(log.severity)}
                          <span className='text-sm text-muted-foreground'>
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <div className='font-medium'>
                          {getEventDescription(log.event, log.details)}
                        </div>
                        {Object.keys(log.details).length > 0 && (
                          <details className='mt-2'>
                            <summary className='text-sm text-muted-foreground cursor-pointer'>
                              View details
                            </summary>
                            <pre className='text-xs bg-muted p-2 rounded mt-1 overflow-x-auto'>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className='p-4 border-t bg-muted/50'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Showing {logs.length} recent events
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  SecurityLogger.clearLogs();
                  loadLogs();
                }}
              >
                Clear Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
