import React, { useState, useEffect, type ReactElement, type FormEvent } from 'react';
import { Eye, EyeSlash, Shield, Warning, Key, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { normalizeError } from '@/lib/errorNormalization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { validatePassword, validateEmail } from '@/lib/security';
import { errorHandler } from '@/lib/errorHandler';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';
import { EmailAlreadyExistsDialog } from '@/components/EmailAlreadyExistsDialog';
import { checkPasswordWithWarning } from '@/lib/breachDetection';

interface AuthFormProps {
  onClose: () => void;
}

function AuthFormComponent({ onClose }: AuthFormProps): ReactElement {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showDuplicateEmailDialog, setShowDuplicateEmailDialog] = useState(false);
  const [breachWarning, setBreachWarning] = useState('');
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const { login, register, verifySignupOtp, resendSignupOtp, isLoading, securityState } = useAuth();

  // Real-time password validation for registration
  const passwordValidation = isLogin ? null : validatePassword(password);
  const emailValidation = email ? validateEmail(email) : null;

  // Check for password breaches when password changes (registration only)
  useEffect(() => {
    if (!isLogin && password && password.length >= 8) {
      const checkBreach = async (): Promise<void> => {
        setIsCheckingBreach(true);
        try {
          const { warning } = await checkPasswordWithWarning(password);
          setBreachWarning(warning);
        } catch (error) {
          // Silently fail breach check - don't expose error to user
          normalizeError(error, 'password_breach_check');
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
  }, [password, isLogin]);

  const getPasswordStrengthColor = (): string => {
    if (!passwordValidation) return '';
    switch (passwordValidation.strength) {
      case 'strong':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'weak':
        return 'text-red-600';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    // Basic validation
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    if (emailValidation && !emailValidation.isValid) {
      toast.error(emailValidation.errors[0]);
      return;
    }

    // Password validation for registration
    if (!isLogin && passwordValidation && !passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]);
      return;
    }

    // Check rate limiting
    if (securityState.isLocked) {
      toast.error(`Account temporarily locked. Try again in ${securityState.lockoutTime} minutes.`);
      return;
    }

    try {
      if (isLogin) {
        const result = await login(email, password);
        // Clear password immediately after use for security
        setPassword('');

        if (result.success) {
          toast.success('Welcome back!');
          onClose();
        } else {
          toast.error(result.error ?? 'Login failed');
        }
      } else {
        const result = await register(email, password, name);

        // Clear password immediately after use for security
        setPassword('');

        if (result.success) {
          setShowOtpStep(true);
          setOtp('');
          setResendCooldown(30);
          toast.success('We sent a 6‑digit code to your email. Enter it below to verify.');
          // start cooldown timer
          const interval = setInterval(() => {
            setResendCooldown((s) => {
              if (s <= 1) {
                clearInterval(interval);
                return 0;
              }
              return s - 1;
            });
          }, 1000);
        } else if (result.isDuplicate) {
          // Handle duplicate email case
          setShowDuplicateEmailDialog(true);
          // Clear sensitive data but keep email for convenience
          setName('');
          // Keep email for user convenience when switching to sign in
        } else {
          toast.error(result.error ?? 'Registration failed');
        }
      }
    } catch (error) {
      // Log the actual error for debugging while showing user-friendly message
      const errorId = errorHandler.handleAuthError(
        isLogin ? 'login' : 'register',
        error instanceof Error ? error : new Error(String(error)),
        {
          metadata: {
            email,
            hasName: !!name,
            emailValid: emailValidation?.isValid ?? false,
            passwordValid: !isLogin ? (passwordValidation?.isValid ?? false) : true,
          },
        },
      );

      const userMessage = errorHandler.getUserFriendlyMessage(
        errorId,
        'Something went wrong. Please try again in a moment.',
      );
      toast.error(userMessage);
    }
  };

  const handleVerifyOtp = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || otp.length < 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    const res = await verifySignupOtp(email, otp);
    if (res.success) {
      toast.success('Email verified! You are now signed in.');
      onClose();
    } else {
      toast.error(res.error ?? 'Invalid or expired code');
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!email || resendCooldown > 0) return;
    const res = await resendSignupOtp(email);
    if (res.success) {
      toast.success('Code resent. Check your inbox.');
      setResendCooldown(30);
      const interval = window.setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            window.clearInterval(interval);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      toast.error(res.error ?? 'Could not resend code');
    }
  };

  const handleDuplicateEmailForgotPassword = (): void => {
    setShowDuplicateEmailDialog(false);
    setShowForgotPassword(true);
  };

  const handleDuplicateEmailReturnToSignIn = (): void => {
    setShowDuplicateEmailDialog(false);
    setIsLogin(true);
    // Reset form but keep email for user convenience
    setName('');
    setPassword('');
    setOtp('');
    setShowOtpStep(false);
    setBreachWarning('');
    setIsCheckingBreach(false);
  };

  return (
    <Card className='w-full max-w-md mx-auto relative'>
      {/* Close button */}
      <Button
        variant='ghost'
        size='sm'
        className='absolute top-4 right-4 h-8 w-8 p-0'
        onClick={onClose}
        disabled={isLoading}
        aria-label='Close dialog'
      >
        <X className='h-4 w-4' />
      </Button>
      <CardHeader className='text-center'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <Shield className='h-6 w-6 text-primary' />
          <CardTitle className='text-2xl'>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
        </div>
        <CardDescription>
          {showOtpStep
            ? `Enter the code we emailed to ${email ?? 'your inbox'}`
            : isLogin
              ? 'Sign in to continue your AI learning journey'
              : 'Join thousands of adults learning AI safely'}
        </CardDescription>

        {/* Security status indicator */}
        {securityState.isLocked && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 mt-3'>
            <div className='flex items-center gap-2 text-red-700'>
              <Warning className='h-4 w-4' />
              <span className='text-sm font-medium'>
                Account temporarily locked ({securityState.lockoutTime}m remaining)
              </span>
            </div>
          </div>
        )}

        {isLogin && securityState.remainingAttempts < 5 && !securityState.isLocked && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3'>
            <div className='flex items-center gap-2 text-yellow-700'>
              <Warning className='h-4 w-4' />
              <span className='text-sm'>
                {securityState.remainingAttempts} login attempts remaining
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {showOtpStep ? (
          <form onSubmit={(e) => void handleVerifyOtp(e)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='otp'>Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName='justify-center'
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={`otp-${String(i)}`} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className='text-sm text-muted-foreground'>This code expires shortly.</p>
            </div>
            <Button
              type='submit'
              className='w-full h-12 text-base font-medium'
              disabled={isLoading || otp.length < 6}
            >
              Verify and Continue
            </Button>
            <div className='text-center'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => void handleResend()}
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </Button>
            </div>
            <div className='text-center'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowOtpStep(false)}
                disabled={isLoading}
              >
                Edit email
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className='space-y-4'>
            {!isLogin && (
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <Input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Enter your full name'
                  required={!isLogin}
                  className='h-12 text-base'
                  maxLength={100}
                />
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                required
                className={`h-12 text-base ${
                  emailValidation && !emailValidation.isValid ? 'border-red-300' : ''
                }`}
                maxLength={254}
                aria-describedby={
                  emailValidation && !emailValidation.isValid ? 'email-error' : undefined
                }
                aria-invalid={emailValidation && !emailValidation.isValid ? true : undefined}
              />
              {emailValidation && !emailValidation.isValid && (
                <p id='email-error' className='text-sm text-red-600'>
                  {emailValidation.errors[0]}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                  required
                  className={`h-12 text-base pr-12 ${
                    !isLogin && passwordValidation && !passwordValidation.isValid
                      ? 'border-red-300'
                      : ''
                  }`}
                  maxLength={128}
                  aria-describedby={
                    !isLogin && passwordValidation && !passwordValidation.isValid
                      ? 'password-error'
                      : undefined
                  }
                  aria-invalid={
                    !isLogin && passwordValidation && !passwordValidation.isValid ? true : undefined
                  }
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash weight='regular' /> : <Eye weight='regular' />}
                </Button>
              </div>

              {!isLogin && password && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>Password strength:</span>
                    <span className={`text-sm font-medium ${getPasswordStrengthColor()}`}>
                      {passwordValidation?.strength
                        ? passwordValidation.strength.charAt(0).toUpperCase() +
                          passwordValidation.strength.slice(1)
                        : ''}
                    </span>
                  </div>

                  {passwordValidation && !passwordValidation.isValid && (
                    <div
                      id='password-error'
                      className='bg-red-50 border border-red-200 rounded-lg p-3'
                    >
                      <ul className='text-sm text-red-700 space-y-1'>
                        {passwordValidation.errors.map((error) => (
                          <li key={error} className='flex items-start gap-1'>
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Password breach warning */}
                  {breachWarning && (
                    <div className='bg-orange-50 border border-orange-200 rounded-lg p-3'>
                      <div className='flex items-start gap-2'>
                        <Warning className='h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0' />
                        <div className='flex-1'>
                          <p className='text-sm text-orange-800 font-medium'>Security Warning</p>
                          <p className='text-sm text-orange-700 mt-1'>{breachWarning}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCheckingBreach && (
                    <p className='text-sm text-muted-foreground'>Checking password security...</p>
                  )}
                </div>
              )}

              {isLogin && (
                <div className='text-right'>
                  <Button
                    type='button'
                    variant='link'
                    size='sm'
                    className='text-primary hover:text-primary/80 p-0 h-auto font-normal'
                    onClick={(): void => setShowForgotPassword(true)}
                  >
                    <Key className='w-3 h-3 mr-1' />
                    Forgot password?
                  </Button>
                </div>
              )}
            </div>

            <Button
              type='submit'
              className='w-full h-12 text-base font-medium'
              disabled={((): boolean => {
                if (isLoading) return true;
                if (securityState.isLocked) return true;
                if (!isLogin && passwordValidation && passwordValidation.isValid === false)
                  return true;
                if (emailValidation?.isValid === false) return true;
                return false;
              })()}
            >
              {isLoading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign In Securely'
                  : 'Create Secure Account'}
            </Button>
          </form>
        )}

        {!showOtpStep && (
          <div className='mt-6 text-center'>
            <p className='text-sm text-muted-foreground mb-2'>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <Button
              variant='ghost'
              onClick={() => setIsLogin(!isLogin)}
              className='text-primary hover:text-primary/80'
              disabled={isLoading}
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </Button>
          </div>
        )}

        {/* Security notice */}
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-start gap-2'>
            <Shield className='h-4 w-4 text-blue-600 mt-0.5' />
            <div className='text-sm text-blue-800'>
              <p className='font-medium mb-1'>Your security matters</p>
              <p>We protect your information with industry-standard security measures.</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />

      {/* Email Already Exists Dialog */}
      <EmailAlreadyExistsDialog
        open={showDuplicateEmailDialog}
        onOpenChange={setShowDuplicateEmailDialog}
        onForgotPassword={handleDuplicateEmailForgotPassword}
        onReturnToSignIn={handleDuplicateEmailReturnToSignIn}
      />
    </Card>
  );
}

// Memoized export for performance optimization
export const AuthForm = React.memo(AuthFormComponent);
