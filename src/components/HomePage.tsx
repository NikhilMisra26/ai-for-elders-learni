import React, { useState, useCallback, useMemo, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Shield,
  Heart,
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
  ChartBar,
  PencilSimple,
} from '@phosphor-icons/react';

import { ReviewForm } from './ReviewForm';
import { BrandName } from './BrandName';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionPlans } from '@/lib/subscription';
import { useMetrics } from '@/hooks/useMetrics';

interface HomePageProps {
  onAuthClick: () => void;
}

function HomePageComponent({ onAuthClick }: HomePageProps): ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, testimonials, isLoading } = useMetrics();
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Memoized navigation handlers
  const handleNavigateToDashboard = useCallback(() => {
    void navigate('/dashboard');
  }, [navigate]);

  const handleNavigateToCourses = useCallback(() => {
    void navigate('/courses');
  }, [navigate]);

  // These features are now shown as trust indicators at the bottom of hero
  const trustFeatures = useMemo(
    () => [
      {
        icon: <SpeakerHigh className='w-5 h-5 text-white' />,
        text: 'Audio narration for all content',
        gradient: 'from-blue-400 to-purple-600',
        shadowColor: 'shadow-blue-200',
      },
      {
        icon: <Eye className='w-5 h-5 text-white' />,
        text: 'Large fonts & high contrast design',
        gradient: 'from-green-400 to-teal-600',
        shadowColor: 'shadow-green-200',
      },
      {
        icon: <Shield className='w-5 h-5 text-white' />,
        text: 'Privacy-focused learning',
        gradient: 'from-orange-400 to-pink-600',
        shadowColor: 'shadow-orange-200',
      },
      {
        icon: <Clock className='w-5 h-5 text-white' />,
        text: 'Learn at your own pace',
        gradient: 'from-purple-400 to-indigo-600',
        shadowColor: 'shadow-purple-200',
      },
    ],
    [],
  );

  // Backward-compat: some older references may still expect `heroFeatures`

  const heroFeatures = trustFeatures;

  const features = useMemo(
    () => [
      {
        icon: <Brain className='w-10 h-10 text-orange-500' />,
        title: 'Senior-Friendly Design',
        description:
          'Large fonts, clear navigation, and audio narration make learning AI accessible and enjoyable for everyone.',
        gradient: 'from-orange-50 to-orange-100',
      },
      {
        icon: <Shield className='w-10 h-10 text-green-500' />,
        title: 'Safety-First Approach',
        description:
          'Learn to use AI tools safely with comprehensive guidance on privacy, security, and avoiding common pitfalls.',
        gradient: 'from-green-50 to-green-100',
      },
      {
        icon: <Heart className='w-10 h-10 text-purple-500' />,
        title: 'Practical Applications',
        description:
          'Focus on real-world uses like health management, family communication, financial planning, and daily organization.',
        gradient: 'from-purple-50 to-purple-100',
      },
      {
        icon: <Sparkle className='w-10 h-10 text-yellow-500' />,
        title: 'Expert-Designed Content',
        description:
          'Courses created by AI experts specifically for adults 50+, with clear explanations and practical examples.',
        gradient: 'from-yellow-50 to-yellow-100',
      },
      {
        icon: <Trophy className='w-10 h-10 text-blue-500' />,
        title: 'Progress Tracking',
        description:
          'Visual progress indicators, achievement badges, and personalized learning paths keep you motivated.',
        gradient: 'from-blue-50 to-blue-100',
      },
      {
        icon: <Phone className='w-10 h-10 text-teal-500' />,
        title: 'Dedicated Support',
        description:
          'Get help when you need it with our email support team ready to assist with your learning journey.',
        gradient: 'from-teal-50 to-cyan-100',
      },
    ],
    [],
  );

  // Format course tier for display
  const formatCourseTier = (tier: string): string => {
    switch (tier) {
      case 'free':
        return 'Basic Course';
      case 'advanced':
        return 'Advanced Course';
      case 'expert':
        return 'Expert Course';
      default:
        return 'Course';
    }
  };

  // Removed old trustIndicators - replaced with trustFeatures

  return (
    <div className='min-h-screen'>
      {/* Skip Navigation */}
      <a href='#main-content' className='skip-nav'>
        Skip to main content
      </a>

      {/* Hero Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-yellow-50 to-purple-50 relative overflow-hidden'>
        {/* Background decorative elements */}
        <div className='absolute inset-0 opacity-30 pointer-events-none'>
          <div className='absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full blur-xl' />
          <div className='absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full blur-xl' />
          <div className='absolute bottom-20 left-1/3 w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full blur-xl' />
        </div>
        <div className='max-w-6xl mx-auto'>
          <div className='grid md:grid-cols-2 gap-8 items-center'>
            {/* Left side - Brand name in blue box */}
            <div>
              <h1 id='main-content'>
                <BrandName variant='hero' />
              </h1>
            </div>

            {/* Right side - Content */}
            <div>
              <p className='text-2xl font-semibold text-orange-600 mb-4 tracking-wide'>
                Designed for Adults 50+
              </p>
              <p className='text-xl text-gray-700 mb-8 leading-relaxed font-medium'>
                Learn to use artificial intelligence safely and confidently with courses designed
                specifically for your needs. No technical experience required – just curiosity and a
                willingness to learn.
              </p>

              {/* Call to Action - moved up */}
              <div className='flex flex-col sm:flex-row gap-4 mt-8'>
                {user ? (
                  <Button
                    size='lg'
                    onClick={handleNavigateToCourses}
                    className='text-lg px-8 py-6 h-auto bg-[#0B1E3D] hover:bg-[#0A1A33] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                  >
                    Continue Learning
                    <ArrowRight className='ml-2' />
                  </Button>
                ) : (
                  <>
                    <Button
                      size='lg'
                      onClick={onAuthClick}
                      className='text-lg px-8 py-6 h-auto bg-[#0B1E3D] hover:bg-[#0A1A33] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                    >
                      Start Basic Course
                      <Play className='ml-2' />
                    </Button>
                    <Button
                      size='lg'
                      variant='outline'
                      onClick={handleNavigateToCourses}
                      className='text-lg px-8 py-6 h-auto'
                    >
                      View All Courses
                      <BookOpen className='ml-2' />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Trust Features - enhanced visual prominence with unique gradients */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-12'>
            {heroFeatures.map((feature) => (
              <div
                key={feature.text}
                className={`relative flex items-center gap-3 text-sm justify-center p-4 rounded-xl transition-all duration-300 hover:scale-105 group ${
                  feature.shadowColor
                }`}
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                }}
              >
                {/* Animated gradient border */}
                <div
                  className='absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                  style={{
                    background: `linear-gradient(45deg, transparent, rgba(255,255,255,0.5), transparent)`,
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 3s ease-in-out infinite',
                  }}
                />
                <div
                  className={`p-2.5 bg-gradient-to-br ${feature.gradient} rounded-full shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  {feature.icon}
                </div>
                <span className='font-semibold text-gray-800'>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Only show if we have impressive metrics */}
      {(stats.length > 0 || isLoading) && (
        <section className='py-16 px-4 sm:px-6 lg:px-8 bg-muted/30'>
          <div className='max-w-6xl mx-auto'>
            {isLoading ? (
              // Loading skeleton
              <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <Skeleton className='h-10 w-24 mx-auto mb-2' />
                    <Skeleton className='h-4 w-20 mx-auto' />
                  </div>
                ))}
              </div>
            ) : (
              // Dynamic grid that adjusts based on number of stats
              <div
                className={`grid gap-8 text-center ${
                  stats.length === 1
                    ? 'grid-cols-1 max-w-xs mx-auto'
                    : stats.length === 2
                      ? 'grid-cols-2 max-w-md mx-auto'
                      : stats.length === 3
                        ? 'grid-cols-3 max-w-2xl mx-auto'
                        : 'grid-cols-2 md:grid-cols-4'
                }`}
              >
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className='text-3xl font-bold text-primary mb-2'>{stat.number}</div>
                    <div className='text-muted-foreground'>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4 relative inline-flex items-baseline'>
              <span className='text-black'>Why Choose&nbsp;</span>
              <BrandName variant='short' className='font-bold leading-none mx-1' />
              <span className='text-black'>?</span>
              <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full' />
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              We understand the unique needs of adult learners and have designed every aspect of our
              platform with accessibility, safety, and practical application in mind.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map((feature) => (
              <Card
                key={feature.title}
                className='text-center h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden'
              >
                <CardHeader className={`bg-gradient-to-br ${feature.gradient} pb-8`}>
                  <div className='w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg'>
                    {feature.icon}
                  </div>
                  <CardTitle className='text-xl font-bold text-gray-800 tracking-wide'>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-6'>
                  <p className='text-muted-foreground leading-relaxed'>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-warmGray-50 to-orange-50/30 shadow-inner'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold mb-4 relative inline-block'>
              Choose Your Learning Path
              <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full' />
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
              Start with our free course and upgrade anytime to access advanced content. All plans
              include our senior-friendly design and dedicated support.
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {subscriptionPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  /* <Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                    Most Popular
                  </Badge> */
                  <Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2' />
                )}
                <CardHeader className='text-center'>
                  <CardTitle className='text-2xl'>{plan.name}</CardTitle>
                  {/* Start of removed code for subscription removal */}
                  {/* <div className='text-4xl font-bold text-primary'>
                    {formatPrice(plan.price)}
                    {plan.price > 0 && (
                      <span className='text-lg text-muted-foreground'>
                        /month
                      </span>
                    )}
                  </div> */}
                  {/* End of removed code for subscription removal */}
                  {/* Start of added code for subscription removal */}
                  <div className='text-4xl font-bold text-primary'>
                    {plan.id === 'free' ? 'Free' : 'Coming Soon'}
                  </div>
                  {/* End of added code for subscription removal */}
                  <CardDescription className='text-base'>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Start of removed/added code for subscription removal */}
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
                    variant={plan.id === 'free' ? 'default' : 'secondary'}
                    disabled={plan.id !== 'free'}
                    onClick={
                      plan.id === 'free'
                        ? user
                          ? (): void => void navigate('/account')
                          : onAuthClick
                        : undefined
                    }
                  >
                    {plan.ctaText}
                  </Button>
                  {/* End of removed/added code for subscription removal */}
                  {/* Removed for subscription removal - original features list and button
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
                      user ? (): void => void navigate('/account') : onAuthClick
                    }
                  >
                    {plan.ctaText}
                  </Button>
                  */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Show reviews or call to action */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          {isLoading ? (
            // Loading skeleton
            <div>
              <div className='text-center mb-16'>
                <Skeleton className='h-10 w-80 mx-auto mb-4' />
                <Skeleton className='h-6 w-96 mx-auto' />
              </div>
              <div className='grid md:grid-cols-3 gap-8'>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className='h-full'>
                    <CardHeader>
                      <Skeleton className='h-6 w-24 mb-2' />
                      <Skeleton className='h-5 w-32' />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className='h-20 w-full' />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : testimonials.length > 0 ? (
            // Show real testimonials
            <>
              <div className='text-center mb-16'>
                <h2 className='text-4xl font-bold mb-4'>What Our Learners Say</h2>
                <p className='text-xl text-muted-foreground'>
                  Real feedback from our community of learners
                </p>
              </div>

              <div
                className={`grid gap-8 ${
                  testimonials.length === 1
                    ? 'max-w-2xl mx-auto'
                    : testimonials.length === 2
                      ? 'md:grid-cols-2 max-w-4xl mx-auto'
                      : 'md:grid-cols-3'
                }`}
              >
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className='h-full'>
                    <CardHeader>
                      <div className='flex items-center gap-1 mb-2'>
                        {Array.from({ length: testimonial.rating }, (_, i) => (
                          <Star
                            key={`star-${testimonial.id}-${i}`}
                            className='w-5 h-5 text-yellow-500'
                            weight='fill'
                          />
                        ))}
                      </div>
                      <div>
                        <CardTitle className='text-lg'>{testimonial.userName}</CardTitle>
                        {testimonial.userLocation && (
                          <CardDescription>{testimonial.userLocation}</CardDescription>
                        )}
                        <Badge variant='secondary' className='mt-2'>
                          {formatCourseTier(testimonial.courseTier)}
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

              {/* Add review button for authenticated users */}
              {user && (
                <div className='text-center mt-12'>
                  <Button variant='default' size='lg' onClick={() => setShowReviewForm(true)}>
                    <PencilSimple className='mr-2' />
                    Share Your Experience
                  </Button>
                </div>
              )}
            </>
          ) : (
            // No testimonials yet - show call to action
            <div className='text-center'>
              <div className='max-w-2xl mx-auto'>
                <h2 className='text-4xl font-bold mb-4'>Be the First to Review</h2>
                <p className='text-xl text-muted-foreground mb-8'>
                  We&apos;re just getting started! Be among the first to share your learning
                  experience and help others discover the benefits of AI education.
                </p>

                {user ? (
                  <Button size='lg' onClick={() => setShowReviewForm(true)}>
                    <Star className='mr-2' />
                    Write the First Review
                  </Button>
                ) : (
                  <div>
                    <p className='text-muted-foreground mb-4'>
                      Start your learning journey to share your experience
                    </p>
                    <Button size='lg' onClick={onAuthClick}>
                      <Play className='mr-2' />
                      Start Basic Course
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Share Your Experience</DialogTitle>
          </DialogHeader>
          <ReviewForm
            onSuccess={() => {
              setShowReviewForm(false);
              // Optionally refresh testimonials
              window.location.reload();
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Final CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-100 via-yellow-50 to-purple-100 relative overflow-hidden'>
        {/* Background decorative elements */}
        <div className='absolute inset-0 opacity-20 pointer-events-none'>
          <div className='absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full blur-2xl' />
          <div className='absolute bottom-10 left-10 w-28 h-28 bg-gradient-to-br from-purple-300 to-orange-300 rounded-full blur-xl' />
        </div>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-4xl font-bold mb-4 relative inline-block'>
            Ready to Start Your AI Journey?
            <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full' />
          </h2>
          <p className='text-xl text-muted-foreground mb-8'>
            Join our community of lifelong learners and discover how AI can enhance your daily life.
            Start with our free course today – no technical experience required.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            {user ? (
              <>
                <Button
                  size='lg'
                  onClick={handleNavigateToDashboard}
                  className='text-lg px-8 py-6 h-auto'
                >
                  Go to Dashboard
                  <ChartBar className='ml-2' />
                </Button>
                <Button
                  size='lg'
                  variant='default'
                  onClick={handleNavigateToCourses}
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
                  className='text-lg px-8 py-6 h-auto bg-[#0B1E3D] hover:bg-[#0A1A33] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
                >
                  Start Learning Free
                  <ArrowRight className='ml-2' />
                </Button>
                <Button
                  size='lg'
                  variant='default'
                  onClick={handleNavigateToCourses}
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

// Memoized export for performance optimization
export const HomePage = React.memo(HomePageComponent);
