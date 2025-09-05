import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User,
  EnvelopeSimple,
  Star,
  Download,
  ChartBar,
  Trophy,
  Fire,
  Clock,
  Lightning,
  Medal,
  Brain,
  Heart,
} from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import { EmailSupportDialog } from './EmailSupportDialog';
import { PasswordChangeDialog } from './PasswordChangeDialog';

import { BrandName } from '@/components/BrandName';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useSubscription, formatPrice, useInvoiceHistory } from '@/lib/subscription';
import { useProgress } from '@/lib/progressTracking';
// Guest progress functions - kept imports for future use
// import { getOrCreateGuestId, clearGuestId } from '@/lib/guestId';
// import { exportGuestProgress, importGuestProgress, resetGuestProgress } from '@/lib/guestProgress';

function AccountPageComponent(): ReactElement {
  const { subscription, getCurrentPlan, cancelSubscription, reactivateSubscription } =
    useSubscription();
  const { learningStats } = useProgress();
  const { invoices } = useInvoiceHistory();

  // Added for subscription removal - keeping state variables but unused
  const [_showUpgradeDialog] = useState(false);
  const [_selectedPlan] = useState<'advanced' | 'expert'>('advanced');
  const [_isProcessingPayment] = useState(false);
  const [_showCancelDialog, setShowCancelDialog] = useState(false);

  // Email support dialog state
  const [showEmailSupportDialog, setShowEmailSupportDialog] = useState(false);

  // Password change dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Guest mode backup/restore handlers - kept for future use
  /*
  const handleExportProgress = (): void => {
    try {
      const guestId = getOrCreateGuestId();
      const exportData = exportGuestProgress(guestId);

      // Copy to clipboard
      navigator.clipboard
        .writeText(exportData)
        .then(() => {
          toast.success('Progress data copied to clipboard!');
        })
        .catch(() => {
          // Fallback: download as file
          const blob = new Blob([exportData], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'progress-backup.txt';
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Progress data downloaded!');
        });
    } catch {
      toast.error('Failed to export progress');
    }
  };

  const handleImportProgress = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e): void => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event): void => {
        try {
          const base64Data = event.target?.result as string;
          const guestId = getOrCreateGuestId();
          importGuestProgress(guestId, base64Data);
          toast.success('Progress imported successfully! Refreshing...');
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast.error('Failed to import progress: Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleResetProgress = (): void => {
    if (
      window.confirm(
        'Are you sure you want to reset all progress on this device? This cannot be undone.',
      )
    ) {
      const guestId = getOrCreateGuestId();
      resetGuestProgress(guestId);
      clearGuestId();
      toast.success('Progress reset! Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };
  */

  // @ts-expect-error - Plan data may be used for display in the future
  const _currentPlan = getCurrentPlan();

  // Added for subscription removal - placeholder function
  // @ts-expect-error - Handlers may be used when subscriptions are re-enabled
  const _handleUpgrade = async (_planId: 'advanced' | 'expert'): Promise<void> => {
    toast.info('Coming Soon', {
      description: 'Premium subscriptions will be available in the future',
    });
  };

  // @ts-expect-error - Handlers may be used when subscriptions are re-enabled
  const _handleCancelSubscription = (): void => {
    if (subscription.planId === 'free') return;

    cancelSubscription();
    toast.success('Subscription cancelled', {
      description: 'You will retain access until your current billing period ends',
    });
    setShowCancelDialog(false);
  };

  // @ts-expect-error - Handlers may be used when subscriptions are re-enabled
  const _handleReactivate = (): void => {
    reactivateSubscription();
    toast.success('Subscription reactivated!', {
      description: 'Your subscription will continue as normal',
    });
  };

  const navigate = useNavigate();

  // Track member since date
  useEffect(() => {
    const MEMBER_SINCE_KEY = 'member_since_date';
    if (!localStorage.getItem(MEMBER_SINCE_KEY)) {
      localStorage.setItem(MEMBER_SINCE_KEY, new Date().toISOString());
    }
  }, []);

  const getMemberSinceDate = (): string => {
    const stored = localStorage.getItem('member_since_date');
    if (stored) {
      return new Date(stored).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleNavigation = (page: string): void => {
    void navigate(`/${page}`);
  };

  // Get personalized greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className='min-h-screen'>
      {/* Hero Section with Gradient */}
      <section className='relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 px-4 sm:px-6 lg:px-8'>
        {/* Animated Background Elements */}
        <div className='absolute inset-0 opacity-40 pointer-events-none'>
          <div className='absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-full blur-2xl animate-pulse will-change-transform' />
          <div className='absolute top-40 right-40 w-40 h-40 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-2xl animate-pulse delay-1000 will-change-transform' />
          <div className='absolute bottom-20 left-1/3 w-36 h-36 bg-gradient-to-br from-pink-300 to-indigo-300 rounded-full blur-2xl animate-pulse delay-2000 will-change-transform' />
        </div>

        <div className='relative max-w-7xl mx-auto'>
          <div className='text-center'>
            <h1 className='text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
              {getGreeting()}!
            </h1>
            <p className='text-2xl text-gray-700 font-medium mb-2'>
              Manage Your <BrandName variant='short' /> Account
            </p>
            <p className='text-lg text-gray-600'>
              View your profile, track achievements, and customize your learning experience
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto p-6'>
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Profile Information - Enhanced */}
            <Card className='border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50'>
              <CardHeader className='bg-gradient-to-r from-indigo-50 to-purple-50'>
                <CardTitle className='flex items-center gap-2 text-xl'>
                  <User className='w-6 h-6 text-indigo-600' />
                  Profile Information
                </CardTitle>
                <CardDescription>Your personal account details</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6 pt-6'>
                <div className='p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg'>
                  <Label className='text-sm font-semibold text-gray-600'>Member Since</Label>
                  <p className='text-lg font-medium text-gray-800 mt-1'>{getMemberSinceDate()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Statistics - Enhanced */}
            <Card className='border-0 shadow-xl overflow-hidden'>
              <div className='bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-1'>
                <CardHeader className='bg-white'>
                  <CardTitle className='flex items-center gap-2 text-xl'>
                    <ChartBar className='w-6 h-6 text-orange-600' />
                    Your Learning Journey
                  </CardTitle>
                  <CardDescription>Track your progress and achievements</CardDescription>
                </CardHeader>
              </div>
              <CardContent className='pt-8'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
                  <div className='relative group'>
                    <div className='absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50' />
                    <div className='relative text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300'>
                      <Trophy className='w-10 h-10 mx-auto mb-3 text-yellow-600' />
                      <div className='text-3xl font-bold text-gray-800'>
                        {learningStats.modulesCompleted}
                      </div>
                      <div className='text-sm font-medium text-gray-600'>Modules Completed</div>
                    </div>
                  </div>

                  <div className='relative group'>
                    <div className='absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50' />
                    <div className='relative text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300'>
                      <Clock className='w-10 h-10 mx-auto mb-3 text-blue-600' />
                      <div className='text-3xl font-bold text-gray-800'>
                        {Math.round(learningStats.totalTimeSpent / 60)}h
                      </div>
                      <div className='text-sm font-medium text-gray-600'>Hours Learned</div>
                    </div>
                  </div>

                  <div className='relative group'>
                    <div className='absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50' />
                    <div className='relative text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300'>
                      <Fire className='w-10 h-10 mx-auto mb-3 text-orange-600' />
                      <div className='text-3xl font-bold text-gray-800'>
                        {learningStats.streak.currentStreak}
                      </div>
                      <div className='text-sm font-medium text-gray-600'>Day Streak</div>
                    </div>
                  </div>

                  <div className='relative group'>
                    <div className='absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50' />
                    <div className='relative text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300'>
                      <Star className='w-10 h-10 mx-auto mb-3 text-purple-600' />
                      <div className='text-3xl font-bold text-gray-800'>
                        {learningStats.averageRating.toFixed(1)}
                      </div>
                      <div className='text-sm font-medium text-gray-600'>Avg Rating</div>
                    </div>
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className='mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl'>
                  <h3 className='font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                    <Medal className='w-5 h-5 text-purple-600' />
                    Recent Achievements
                  </h3>
                  <div className='flex flex-wrap gap-3'>
                    <Badge className='px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200'>
                      🏆 First Module Complete
                    </Badge>
                    <Badge className='px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 border-purple-200'>
                      ⚡ Quick Learner
                    </Badge>
                    <Badge className='px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 text-teal-800 border-teal-200'>
                      🔥 7-Day Streak
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing History - Enhanced */}
            {invoices.length > 0 && (
              <Card className='border-0 shadow-xl'>
                <CardHeader className='bg-gradient-to-r from-green-50 to-teal-50'>
                  <CardTitle className='flex items-center gap-2 text-xl'>
                    <Download className='w-6 h-6 text-teal-600' />
                    Billing History
                  </CardTitle>
                  <CardDescription>Download your past invoices and receipts</CardDescription>
                </CardHeader>
                <CardContent className='pt-6'>
                  <div className='space-y-3'>
                    {invoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className='flex items-center justify-between p-4 bg-gradient-to-r from-white to-green-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200'
                      >
                        <div>
                          <p className='font-semibold text-gray-800'>{invoice.planName}</p>
                          <p className='text-sm text-gray-600'>
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Badge
                            variant='secondary'
                            className={
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {invoice.status}
                          </Badge>
                          <span className='font-bold text-gray-800'>
                            {formatPrice(invoice.amount)}
                          </span>
                          <Button size='sm' variant='outline' className='hover:bg-teal-50'>
                            <Download className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Enhanced */}
          <div className='space-y-6'>
            {/* Quick Actions - Enhanced */}
            <Card className='border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Lightning className='w-5 h-5 text-purple-600' />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='default'
                  className='w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                  onClick={() => handleNavigation('dashboard')}
                >
                  <ChartBar className='w-4 h-4 mr-2' />
                  View Dashboard
                </Button>
                <Button
                  variant='default'
                  className='w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                  onClick={() => handleNavigation('courses')}
                >
                  <Brain className='w-4 h-4 mr-2' />
                  Browse Courses
                </Button>
              </CardContent>
            </Card>

            {/* Support - Enhanced */}
            <Card className='border-0 shadow-xl bg-gradient-to-br from-teal-50 to-cyan-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Heart className='w-5 h-5 text-teal-600' />
                  Support & Help
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='p-4 bg-white/80 backdrop-blur-sm rounded-lg'>
                  <p className='text-sm text-gray-700 mb-3'>
                    Need assistance? Enter your email and our support team will reach out to help
                    you.
                  </p>
                  <div className='space-y-2 mt-4'>
                    <Label htmlFor='support-email' className='text-sm font-semibold text-gray-700'>
                      Your Email
                    </Label>
                    <input
                      id='support-email'
                      type='email'
                      placeholder='your@email.com'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
                      onKeyDown={(e): void => {
                        if (e.key === 'Enter') {
                          const email = (e.target as HTMLInputElement).value;
                          if (email && email.includes('@') && email.includes('.')) {
                            toast.success("Support request sent! We'll contact you at " + email);
                            (e.target as HTMLInputElement).value = '';
                          } else {
                            toast.error('Please enter a valid email address');
                          }
                        }
                      }}
                    />
                    <Button
                      variant='default'
                      onClick={(): void => {
                        const input = document.getElementById('support-email') as HTMLInputElement;
                        if (input) {
                          const email = input.value;
                          if (email && email.includes('@') && email.includes('.')) {
                            toast.success("Support request sent! We'll contact you at " + email);
                            input.value = '';
                          } else {
                            toast.error('Please enter a valid email address');
                          }
                        }
                      }}
                      className='w-full mt-3 justify-center bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white'
                    >
                      <EnvelopeSimple className='w-4 h-4 mr-2' />
                      Send Support Request
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Support Dialog */}
        <EmailSupportDialog
          open={showEmailSupportDialog}
          onOpenChange={setShowEmailSupportDialog}
        />

        {/* Password Change Dialog */}
        <PasswordChangeDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
      </div>
    </div>
  );
}

// Memoized export for performance optimization
export const AccountPage = React.memo(AccountPageComponent);
