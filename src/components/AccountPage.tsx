import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { 
  CreditCard, 
  CheckCircle, 
  User, 
  Mail, 
  Calendar,
  Crown,
  Star
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AccountPageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function AccountPage({ onNavigate, onAuthClick }: AccountPageProps) {
  const { user, updateTier } = useAuth()

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              Please sign in to view your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onAuthClick}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubscriptionChange = (newTier: 'free' | 'advanced' | 'expert') => {
    if (newTier === user.tier) return
    
    // Simulate payment processing
    updateTier(newTier)
    toast.success(`Successfully ${newTier === 'free' ? 'cancelled subscription' : `subscribed to ${newTier} plan`}!`)
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