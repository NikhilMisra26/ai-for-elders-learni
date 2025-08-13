import type { ReactElement } from 'react';
import {
  Brain,
  Shield,
  Heart,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  SpeakerHigh,
  Eye,
  Sparkle,
  Trophy,
  BookOpen,
  Clock,
  Phone,
  CreditCard,
  Globe,
  ChartBar,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { BrandName } from '@/components/BrandName';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionPlans, formatPrice } from '@/lib/subscription';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onAuthClick: () => void;
}

export function HomePage({
  onNavigate,
  onAuthClick,
}: HomePageProps): ReactElement {
  const { user } = useAuth();

  const heroFeatures = [
    {
      icon: <SpeakerHigh className='w-5 h-5' />,
      text: 'Audio narration for all content',
    },
    {
      icon: <Eye className='w-5 h-5' />,
      text: 'Large fonts & high contrast design',
    },
    {
      icon: <Shield className='w-5 h-5' />,
      text: 'Privacy-focused learning',
    },
    {
      icon: <Clock className='w-5 h-5' />,
      text: 'Learn at your own pace',
    },
  ];

  const features = [
    {
      icon: <Brain className='w-8 h-8 text-primary' />,
      title: 'Senior-Friendly Design',
      description:
        'Large fonts, clear navigation, and audio narration make learning AI accessible and enjoyable for everyone.',
    },
    {
      icon: <Shield className='w-8 h-8 text-primary' />,
      title: 'Safety-First Approach',
      description:
        'Learn to use AI tools safely with comprehensive guidance on privacy, security, and avoiding common pitfalls.',
    },
    {
      icon: <Heart className='w-8 h-8 text-primary' />,
      title: 'Practical Applications',
      description:
        'Focus on real-world uses like health management, family communication, financial planning, and daily organization.',
    },
    {
      icon: <Users className='w-8 h-8 text-primary' />,
      title: 'Supportive Community',
      description:
        "Join a community of learners sharing experiences, tips, and supporting each other's AI learning journey.",
    },
    {
      icon: <Sparkle className='w-8 h-8 text-primary' />,
      title: 'Expert-Designed Content',
      description:
        'Courses created by AI experts specifically for adults 50+, with clear explanations and practical examples.',
    },
    {
      icon: <Trophy className='w-8 h-8 text-primary' />,
      title: 'Progress Tracking',
      description:
        'Visual progress indicators, achievement badges, and personalized learning paths keep you motivated.',
    },
  ];

  const testimonials = [
    {
      name: 'Margaret Thompson, 67',
      location: 'Phoenix, AZ',
      content:
        'I never thought I could understand AI, but this course made it so simple and clear. Now I use AI to help write emails to my grandchildren and organize my medical appointments!',
      rating: 5,
      course: 'Advanced Course',
    },
    {
      name: 'Robert Chen, 72',
      location: 'Seattle, WA',
      content:
        "The audio narration feature is wonderful. I can listen while I follow along. It's like having a patient, knowledgeable teacher right beside me every step of the way.",
      rating: 5,
      course: 'Free Course',
    },
    {
      name: 'Dorothy Williams, 61',
      location: 'Orlando, FL',
      content:
        'The health applications module helped me organize my medical questions before doctor visits. My physician was so impressed with how prepared I was!',
      rating: 5,
      course: 'Advanced Course',
    },
  ];

  const stats = [
    { number: '15,000+', label: 'Happy Learners' },
    { number: '4.9/5', label: 'Average Rating' },
    { number: '92%', label: 'Course Completion' },
    { number: '50+', label: 'Countries Reached' },
  ];

  const trustIndicators = [
    {
      icon: <Shield className='w-5 h-5' />,
      text: 'No credit card required for free course',
    },
    {
      icon: <CreditCard className='w-5 h-5' />,
      text: 'Cancel anytime, no hidden fees',
    },
    {
      icon: <Phone className='w-5 h-5' />,
      text: 'Email & phone support available',
    },
    {
      icon: <Globe className='w-5 h-5' />,
      text: 'Trusted by learners worldwide',
    },
  ];

  return (
    <div className='min-h-screen'>
      {/* Skip Navigation */}
      <a href='#main-content' className='skip-nav'>
        Skip to main content
      </a>

      {/* Hero Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-accent/5'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center max-w-4xl mx-auto'>
            <h1
              id='main-content'
              className='text-5xl sm:text-6xl font-bold text-foreground mb-6'
            >
              Master AI Technology
            </h1>
            <p className='text-2xl font-semibold text-primary mb-4'>
              Designed for Adults 50+
            </p>
            <p className='text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed'>
              Learn to use artificial intelligence safely and confidently with
              courses designed specifically for your needs. No technical
              experience required – just curiosity and a willingness to learn.
            </p>

            {/* Hero Features */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto'>
              {heroFeatures.map((feature) => (
                <div
                  key={feature.text}
                  className='flex items-center gap-2 text-sm text-muted-foreground'
                >
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
              {user ? (
                <Button
                  size='lg'
                  onClick={() => onNavigate('dashboard')}
                  className='text-lg px-8 py-6 h-auto'
                >
                  Continue Learning
                  <ArrowRight className='ml-2' />
                </Button>
              ) : (
                <>
                  <Button
                    size='lg'
                    onClick={onAuthClick}
                    className='text-lg px-8 py-6 h-auto'
                  >
                    Start Free Course
                    <Play className='ml-2' />
                  </Button>
                  <Button
                    size='lg'
                    variant='outline'
                    onClick={() => onNavigate('courses')}
                    className='text-lg px-8 py-6 h-auto'
                  >
                    View All Courses
                    <BookOpen className='ml-2' />
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto'>
              {trustIndicators.map((indicator) => (
                <div
                  key={indicator.text}
                  className='flex items-center gap-2 text-sm text-muted-foreground justify-center'
                >
                  {indicator.icon}
                  <span>{indicator.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-muted/30'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className='text-3xl font-bold text-primary mb-2'>
                  {stat.number}
                </div>
                <div className='text-muted-foreground'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4'>
              Why Choose <BrandName variant='short' />?
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              We understand the unique needs of adult learners and have designed
              every aspect of our platform with accessibility, safety, and
              practical application in mind.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map((feature) => (
              <Card key={feature.title} className='text-center h-full'>
                <CardHeader>
                  <div className='w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full'>
                    {feature.icon}
                  </div>
                  <CardTitle className='text-xl'>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground leading-relaxed'>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-muted/20'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4'>
              Choose Your Learning Path
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              Start with our free course and upgrade anytime to access advanced
              content. All plans include our senior-friendly design and
              dedicated support.
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {subscriptionPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                    Most Popular
                  </Badge>
                )}
                <CardHeader className='text-center'>
                  <CardTitle className='text-2xl'>{plan.name}</CardTitle>
                  <div className='text-4xl font-bold text-primary'>
                    {formatPrice(plan.price)}
                    {plan.price > 0 && (
                      <span className='text-lg text-muted-foreground'>
                        /month
                      </span>
                    )}
                  </div>
                  <CardDescription className='text-base'>
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-3 mb-6'>
                    {plan.features.map((feature) => (
                      <li key={feature} className='flex items-start gap-3'>
                        <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
                        <span className='text-sm'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className='w-full'
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={
                      user ? (): void => onNavigate('account') : onAuthClick
                    }
                  >
                    {plan.ctaText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4'>What Our Learners Say</h2>
            <p className='text-xl text-muted-foreground'>
              Join thousands of adults who are successfully learning AI with our
              courses
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {testimonials.map((testimonial) => (
              <Card
                key={`${testimonial.name}-${testimonial.location}`}
                className='h-full'
              >
                <CardHeader>
                  <div className='flex items-center gap-1 mb-2'>
                    {Array.from(
                      { length: testimonial.rating },
                      (_, i) => i + 1,
                    ).map((starNumber) => (
                      <Star
                        key={`${testimonial.name.replace(/\s+/g, '')}-star${starNumber}`}
                        className='w-5 h-5 text-yellow-500'
                        weight='fill'
                      />
                    ))}
                  </div>
                  <div>
                    <CardTitle className='text-lg'>
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription>{testimonial.location}</CardDescription>
                    <Badge variant='secondary' className='mt-2'>
                      {testimonial.course}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground italic leading-relaxed'>
                    &quot;{testimonial.content}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-accent/10'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-4xl font-bold mb-4'>
            Ready to Start Your AI Journey?
          </h2>
          <p className='text-xl text-muted-foreground mb-8'>
            Join our community of lifelong learners and discover how AI can
            enhance your daily life. Start with our free course today – no
            technical experience required.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            {user ? (
              <>
                <Button
                  size='lg'
                  onClick={() => onNavigate('dashboard')}
                  className='text-lg px-8 py-6 h-auto'
                >
                  Go to Dashboard
                  <ChartBar className='ml-2' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  onClick={() => onNavigate('courses')}
                  className='text-lg px-8 py-6 h-auto'
                >
                  Browse Courses
                  <BookOpen className='ml-2' />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size='lg'
                  onClick={onAuthClick}
                  className='text-lg px-8 py-6 h-auto'
                >
                  Start Learning Free
                  <ArrowRight className='ml-2' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  onClick={() => onNavigate('courses')}
                  className='text-lg px-8 py-6 h-auto'
                >
                  Explore Courses
                  <BookOpen className='ml-2' />
                </Button>
              </>
            )}
          </div>

          <div className='mt-8 flex justify-center items-center gap-6 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Shield className='w-4 h-4' />
              <span>Secure & Private</span>
            </div>
            <Separator orientation='vertical' className='h-4' />
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-4 h-4' />
              <span>No Credit Card Required</span>
            </div>
            <Separator orientation='vertical' className='h-4' />
            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              <span>Learn at Your Pace</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
