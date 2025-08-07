import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription, subscriptionPlans, formatPrice, simulatePaymentFlow, useInvoiceHistory } from '@/lib/subscription'
import { useProgress } from '@/lib/progressTracking'
import { AuthForm } from './AuthForm'
import { toast } from 'sonner'
import { 
  CreditCard, 
  CheckCircle, 
  User, 
  Mail, 
  Calendar,
  Crown,
  Star,
  Settings,
  Download,
  AlertTriangle,
  Shield,
  X,
  ChartBar,
  Trophy,
  Fire,
  Gift,
  Clock,
  ArrowRight,
  Phone
} from '@phosphor-icons/react'

interface AccountPageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function AccountPage({ onNavigate, onAuthClick }: AccountPageProps) {
  const { user } = useAuth()
  const { 
    subscription, 
    getCurrentPlan, 
    startTrial,
    upgradeToPaid,
    cancelSubscription,
    reactivateSubscription
  } = useSubscription()
  const { learningStats } = useProgress()
  const { invoices } = useInvoiceHistory()
  
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'advanced' | 'expert'>('advanced')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm onClose={() => onNavigate('home')} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPlan = getCurrentPlan()

  const handleUpgrade = async (planId: 'advanced' | 'expert') => {
    setIsProcessingPayment(true)
    
    try {
      if (subscription.status === 'trial' || subscription.planId === 'free') {
        startTrial(planId)
        toast.success(`🎉 ${planId === 'advanced' ? '7' : '14'}-day free trial started!`, {
          description: 'You now have access to all premium content'
        })
      } else {
        const result = await simulatePaymentFlow(planId)
        
        if (result.success && result.paymentMethod) {
          upgradeToPaid(planId, result.paymentMethod)
          toast.success('Subscription upgraded successfully!', {
            description: 'You now have access to all premium content'
          })
        } else {
          toast.error('Payment failed', {
            description: result.error || 'Please try again'
          })
        }
      }
    } catch (error) {
      toast.error('Upgrade failed', {
        description: 'Please try again or contact support'
      })
    } finally {
      setIsProcessingPayment(false)
      setShowUpgradeDialog(false)
    }
  }

  const handleCancelSubscription = () => {
    if (subscription.planId === 'free') return
    
    cancelSubscription()
    toast.success('Subscription cancelled', {
      description: 'You will retain access until your current billing period ends'
    })
    setShowCancelDialog(false)
  }

  const handleReactivate = () => {
    reactivateSubscription()
    toast.success('Subscription reactivated!', {
      description: 'Your subscription will continue as normal'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
          <p className="text-xl text-muted-foreground">
            Manage your profile, subscription, and learning preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-lg">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="text-lg">{new Date(user.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Manage your learning plan and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Current Plan */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
                      <p className="text-muted-foreground">{currentPlan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(currentPlan.price)}
                        {currentPlan.price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                      </div>
                      <Badge variant={subscription.planId === 'free' ? 'secondary' : 'default'}>
                        {subscription.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Trial Information */}
                  {subscription.status === 'trial' && subscription.trialEndDate && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Gift className="w-4 h-4" />
                        <span className="font-medium">Free Trial Active</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Your trial ends on {new Date(subscription.trialEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Notice */}
                  {subscription.cancelAtPeriodEnd && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Subscription Cancelled</span>
                      </div>
                      <p className="text-sm text-yellow-600 mt-1">
                        Your subscription will end on {subscription.endDate && new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={handleReactivate}
                      >
                        Reactivate Subscription
                      </Button>
                    </div>
                  )}

                  {/* Plan Features */}
                  <div>
                    <h4 className="font-medium mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {currentPlan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    {subscription.planId === 'free' ? (
                      <Button onClick={() => setShowUpgradeDialog(true)}>
                        Upgrade Plan
                        <Crown className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <>
                        {subscription.planId === 'advanced' && (
                          <Button 
                            onClick={() => {
                              setSelectedPlan('expert')
                              setShowUpgradeDialog(true)
                            }}
                          >
                            Upgrade to Expert
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                        {!subscription.cancelAtPeriodEnd && (
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCancelDialog(true)}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Next Billing */}
                {subscription.nextBillingDate && subscription.status === 'active' && (
                  <div className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Next Billing Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(subscription.nextBillingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(currentPlan.price)}</p>
                        {subscription.paymentMethod && (
                          <p className="text-sm text-muted-foreground">
                            •••• {subscription.paymentMethod.last4}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="w-5 h-5" />
                  Learning Statistics
                </CardTitle>
                <CardDescription>
                  Your learning progress and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{learningStats.modulesCompleted}</div>
                    <div className="text-sm text-muted-foreground">Modules Completed</div>
                  </div>
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{Math.round(learningStats.totalTimeSpent / 60)}h</div>
                    <div className="text-sm text-muted-foreground">Hours Learned</div>
                  </div>
                  <div className="text-center">
                    <Fire className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{learningStats.streak.currentStreak}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <Star className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{learningStats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('dashboard')}
                >
                  <ChartBar className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('courses')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Browse Courses
                </Button>
                {subscription.planId === 'free' && (
                  <Button 
                    className="w-full justify-start"
                    onClick={() => setShowUpgradeDialog(true)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Support & Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Need help with your account or have questions about our courses?
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                  {subscription.planId === 'expert' && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone Support
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upgrade Your Learning Experience</DialogTitle>
              <DialogDescription>
                Choose a plan that fits your learning goals and unlock premium content
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid md:grid-cols-2 gap-4">
              {subscriptionPlans.filter(plan => plan.id !== 'free').map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                  } ${plan.popular ? 'border-primary' : ''}`}
                  onClick={() => setSelectedPlan(plan.id as 'advanced' | 'expert')}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(plan.price)}<span className="text-lg text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Processing...' : 'Start Free Trial'}
                <Crown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your subscription? You'll lose access to premium content at the end of your billing period.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Subscription
              </Button>
              <Button variant="destructive" onClick={handleCancelSubscription}>
                <X className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

  const subscriptions = [
    {
      tier: 'free' as const,
      title: 'Free Plan',
      description: 'Access to AI Basics course with 4 fundamental modules',
      price: 'Free',
      features: [
        'AI Basics for Beginners course',
        'Audio narration',
        'Progress tracking',
        'Community access'
      ],
      current: user.tier === 'free'
    },
    {
      tier: 'advanced' as const,
      title: 'Advanced Plan',
      description: 'Master AI tools with specialized applications',
      price: '$1.99/month',
      features: [
        'Everything in Free plan',
        'AI Tools Mastery course',
        'Prompt engineering training',
        'Health & finance AI applications',
        'Monthly updates'
      ],
      current: user.tier === 'advanced',
      popular: true
    },
    {
      tier: 'expert' as const,
      title: 'Expert Plan',
      description: 'Cutting-edge AI systems and custom assistants',
      price: '$4.99/month',
      features: [
        'Everything in Advanced plan',
        'Advanced AI Mastery course',
        'Autonomous AI systems',
        'Custom AI assistants',
        'Cutting-edge developments',
        'Expert community'
      ],
      current: user.tier === 'expert'
    }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your account and subscription preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Account Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User weight="regular" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-base">{user.name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail weight="regular" className="text-muted-foreground" />
                  <p className="text-base">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar weight="regular" className="text-muted-foreground" />
                  <p className="text-base">{new Date(user.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={user.tier === 'free' ? 'secondary' : 'default'}
                    className="text-sm"
                  >
                    {user.tier === 'expert' && <Crown weight="fill" className="mr-1" />}
                    {user.tier === 'advanced' && <Star weight="fill" className="mr-1" />}
                    {user.tier.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onNavigate('dashboard')}
                >
                  View Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard weight="regular" />
                Subscription Plans
              </CardTitle>
              <CardDescription>
                Choose the plan that best fits your learning goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {subscriptions.map((plan) => (
                  <div
                    key={plan.tier}
                    className={`relative border rounded-lg p-6 transition-colors ${
                      plan.current ? 'border-primary bg-primary/5' : 'border-border'
                    } ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{plan.title}</h3>
                        <p className="text-muted-foreground mb-2">{plan.description}</p>
                        <div className="text-2xl font-bold text-primary">{plan.price}</div>
                      </div>
                      
                      {plan.current && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle weight="fill" />
                          Current Plan
                        </Badge>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2">
                      {!plan.current ? (
                        <Button
                          onClick={() => handleSubscriptionChange(plan.tier)}
                          className="flex-1"
                          variant={plan.popular ? 'default' : 'outline'}
                        >
                          {plan.tier === 'free' ? 'Downgrade' : 'Upgrade'} to {plan.title}
                        </Button>
                      ) : (
                        <Button variant="outline" className="flex-1" disabled>
                          Current Plan
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Subscription Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Subscriptions can be cancelled at any time</li>
                  <li>• You'll retain access until the end of your billing period</li>
                  <li>• All courses include lifetime access to completed modules</li>
                  <li>• Payment processing is simulated for this demo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common account management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                onClick={() => onNavigate('courses')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <User weight="regular" />
                View Courses
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => onNavigate('dashboard')}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <CheckCircle weight="regular" />
                Track Progress
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => toast.info('Contact support feature coming soon!')}
              >
                <Mail weight="regular" />
                Contact Support
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => toast.info('Download certificates feature coming soon!')}
              >
                <Star weight="regular" />
                Certificates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}