import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Brain, 
  Shield, 
  Heart, 
  Users, 
  Star, 
  CheckCircle,
  ArrowRight,
  Play
} from '@phosphor-icons/react'

interface HomePageProps {
  onNavigate: (page: string) => void
  onAuthClick: () => void
}

export function HomePage({ onNavigate, onAuthClick }: HomePageProps) {
  const { user } = useAuth()

  const features = [
    {
      icon: <Brain weight="regular" className="text-primary" />,
      title: "Senior-Friendly Learning",
      description: "Large fonts, clear navigation, and audio narration make learning AI accessible for everyone."
    },
    {
      icon: <Shield weight="regular" className="text-primary" />,
      title: "Safety First Approach",
      description: "Learn to use AI tools safely with emphasis on privacy, security, and avoiding common pitfalls."
    },
    {
      icon: <Heart weight="regular" className="text-primary" />,
      title: "Practical Applications",
      description: "Focus on real-world uses like health management, family communication, and daily organization."
    },
    {
      icon: <Users weight="regular" className="text-primary" />,
      title: "Community Support",
      description: "Join a community of learners sharing experiences and supporting each other's AI journey."
    }
  ]

  const testimonials = [
    {
      name: "Margaret Thompson, 67",
      content: "I never thought I could understand AI, but this course made it so simple. Now I use AI to help write emails to my grandchildren!",
      rating: 5
    },
    {
      name: "Robert Chen, 72",
      content: "The audio narration feature is wonderful. I can listen while I follow along. It's like having a patient teacher right beside me.",
      rating: 5
    },
    {
      name: "Dorothy Williams, 61",
      content: "The health applications module helped me organize my medical questions before doctor visits. My physician was impressed!",
      rating: 5
    }
  ]

  const courses = [
    {
      title: "AI Basics for Beginners",
      description: "Learn AI fundamentals and safety in 4 easy modules",
      price: "Free",
      features: ["AI basics & safety", "First conversations", "Practical applications", "Privacy protection"],
      tier: "free" as const
    },
    {
      title: "AI Tools Mastery",
      description: "Master prompt engineering and specialized applications",
      price: "$1.99/month",
      features: ["Advanced prompting", "Health AI tools", "Financial applications", "Monthly updates"],
      tier: "advanced" as const,
      popular: true
    },
    {
      title: "Advanced AI Mastery",
      description: "Explore cutting-edge AI systems and custom assistants",
      price: "$4.99/month",
      features: ["Autonomous AI", "Custom assistants", "Latest developments", "Expert community"],
      tier: "expert" as const
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Skip Navigation */}
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h1 id="main-content" className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Master AI at Your Own Pace
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Learn to use artificial intelligence safely and confidently with courses designed specifically for adults 50+. 
            No technical experience required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button 
                size="lg" 
                onClick={() => onNavigate('dashboard')}
                className="text-lg px-8 py-6 h-auto"
              >
                Continue Learning
                <ArrowRight weight="regular" className="ml-2" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={onAuthClick}
                  className="text-lg px-8 py-6 h-auto"
                >
                  Start Free Course
                  <Play weight="regular" className="ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => onNavigate('courses')}
                  className="text-lg px-8 py-6 h-auto"
                >
                  View All Courses
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose AI for Elders?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Learning Path</h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Start free and upgrade when you're ready for more advanced topics
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <Card key={index} className={`relative ${course.popular ? 'border-primary shadow-lg' : ''}`}>
                {course.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="text-base">
                    {course.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">{course.price}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {course.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full h-12"
                    variant={course.popular ? 'default' : 'outline'}
                    onClick={() => user ? onNavigate('courses') : onAuthClick}
                  >
                    {course.tier === 'free' ? 'Start Free' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Students Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} weight="fill" className="text-yellow-500" />
                    ))}
                  </div>
                  <CardDescription className="text-base leading-relaxed italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your AI Journey?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of adults who are already using AI to enhance their daily lives. 
            Start with our free course today.
          </p>
          <Button 
            size="lg" 
            onClick={user ? () => onNavigate('courses') : onAuthClick}
            className="text-lg px-8 py-6 h-auto"
          >
            {user ? 'View Courses' : 'Get Started Free'}
            <ArrowRight weight="regular" className="ml-2" />
          </Button>
        </div>
      </section>
    </div>
  )
}