import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeSlash, Shield, AlertTriangle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { validatePassword, validateEmail } from '@/lib/security'

interface AuthFormProps {
  onClose: () => void
}

export function AuthForm({ onClose }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, register, isLoading, securityState } = useAuth()

  // Real-time password validation for registration
  const passwordValidation = isLogin ? null : validatePassword(password)
  const emailValidation = email ? validateEmail(email) : null

  const getPasswordStrengthColor = () => {
    if (!passwordValidation) return ''
    switch (passwordValidation.strength) {
      case 'strong': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'weak': return 'text-red-600'
      default: return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all fields')
      return
    }

    // Email validation
    if (emailValidation && !emailValidation.isValid) {
      toast.error(emailValidation.errors[0])
      return
    }

    // Password validation for registration
    if (!isLogin && passwordValidation && !passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0])
      return
    }

    // Check rate limiting
    if (securityState.isLocked) {
      toast.error(`Account temporarily locked. Try again in ${securityState.lockoutTime} minutes.`)
      return
    }

    try {
      if (isLogin) {
        const result = await login(email, password)
        if (result.success) {
          toast.success('Welcome back!')
          onClose()
        } else {
          toast.error(result.error || 'Login failed')
        }
      } else {
        const result = await register(email, password, name)
        if (result.success) {
          toast.success('Account created successfully! Welcome to AI for Elders!')
          onClose()
        } else {
          toast.error(result.error || 'Registration failed')
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
        </div>
        <CardDescription>
          {isLogin 
            ? 'Sign in to continue your AI learning journey' 
            : 'Join thousands of adults learning AI safely'
          }
        </CardDescription>
        
        {/* Security status indicator */}
        {securityState.isLocked && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Account temporarily locked ({securityState.lockoutTime}m remaining)
              </span>
            </div>
          </div>
        )}
        
        {isLogin && securityState.remainingAttempts < 5 && !securityState.isLocked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {securityState.remainingAttempts} login attempts remaining
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required={!isLogin}
                className="h-12 text-base"
                maxLength={100}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className={`h-12 text-base ${
                emailValidation && !emailValidation.isValid ? 'border-red-300' : ''
              }`}
              maxLength={254}
            />
            {emailValidation && !emailValidation.isValid && (
              <p className="text-sm text-red-600">
                {emailValidation.errors[0]}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                required
                className={`h-12 text-base pr-12 ${
                  !isLogin && passwordValidation && !passwordValidation.isValid ? 'border-red-300' : ''
                }`}
                maxLength={128}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlash weight="regular" /> : <Eye weight="regular" />}
              </Button>
            </div>
            
            {!isLogin && password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Password strength:</span>
                  <span className={`text-sm font-medium ${getPasswordStrengthColor()}`}>
                    {passwordValidation?.strength.charAt(0).toUpperCase() + passwordValidation?.strength.slice(1)}
                  </span>
                </div>
                
                {passwordValidation && !passwordValidation.isValid && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="text-sm text-red-700 space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {isLogin && (
              <p className="text-sm text-muted-foreground">
                Password must be at least 8 characters
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium"
            disabled={isLoading || securityState.isLocked || 
              (!isLogin && passwordValidation && !passwordValidation.isValid) ||
              (emailValidation && !emailValidation.isValid)
            }
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In Securely' : 'Create Secure Account')}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Button
            variant="ghost"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary/80"
            disabled={isLoading}
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </Button>
        </div>
        
        {/* Security notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your security matters</p>
              <p>We protect your information with industry-standard security measures.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}