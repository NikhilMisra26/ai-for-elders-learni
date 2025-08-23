import React, { useState, useMemo, useCallback, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Lock,
  Play,
  ArrowRight,
  Shield,
  Star,
  Users,
  Medal,
  MagnifyingGlass,
  ChartBar,
  Trophy,
  Sparkle,
  Lightning,
  Fire,
  Certificate,
} from '@phosphor-icons/react';

import { BrandName } from '@/components/BrandName';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TierBadge } from '@/components/ui/tier-badge';
import { ProgressRingMini } from '@/components/ui/progress-ring';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import type { Course } from '@/lib/courseData';
import { courseData } from '@/lib/courseData';

interface CoursesPageProps {
  onAuthClick: () => void;
}

function CoursesPageComponent({ onAuthClick }: CoursesPageProps): ReactElement {
  const { user } = useAuth();
  const { subscription, canAccessTier } = useSubscription();
  const { getCourseProgress, startCourse, getDashboardSummary } = useProgress();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'advanced' | 'expert'>('all');

  const dashboardSummary = getDashboardSummary();
  // const availableCourses = getAvailableCourses(subscription.planId);

  // Filter courses based on search and filter
  const filteredCourses = useMemo(
    () =>
      Object.values(courseData).filter((course) => {
        const matchesSearch =
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterTier === 'all' || course.tier === filterTier;
        return matchesSearch && matchesFilter;
      }),
    [searchQuery, filterTier],
  );

  const handleStartCourse = useCallback(
    (courseId: string, course: Course): void => {
      if (!user) {
        onAuthClick();
        return;
      }

      if (!canAccessTier(course.tier)) {
        toast.error('Subscription required', {
          description: `This course requires a ${course.tier} subscription.`,
        });
        return;
      }

      startCourse(courseId);

      // Navigate to the appropriate course route based on tier
      let routePath = '/courses';
      switch (course.tier) {
        case 'free':
          routePath = '/courses/basic';
          break;
        case 'advanced':
          routePath = '/courses/advanced';
          break;
        case 'expert':
          routePath = '/courses/expert';
          break;
        default:
          routePath = '/courses/basic';
      }

      void navigate(routePath);
    },
    [user, onAuthClick, canAccessTier, startCourse, navigate],
  );

  const getCourseCompletionData = (
    course: Course,
  ): {
    completedModules: number;
    totalModules: number;
    percentage: number;
    isStarted: boolean;
    isCompleted: boolean;
  } => {
    const progress = getCourseProgress(course.id);
    const completedModules = progress?.completedModules.length ?? 0;
    const totalModules = course.totalModules;
    const percentage = Math.round((completedModules / totalModules) * 100);

    return {
      completedModules,
      totalModules,
      percentage,
      isStarted: progress !== null,
      isCompleted: percentage >= 100,
    };
  };


  const getContinueCourse = (): Course | undefined => {
    // Find a course that's in progress
    const inProgress = Object.values(courseData).find((course) => {
      const progress = getCourseProgress(course.id);
      return progress && !progress.completed;
    });
    return inProgress;
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Enhanced Header with More Visual Pop */}
        <div className='text-center mb-10 relative'>
          <div className='absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 animate-pulse' />
          <div className='relative'>
            <div className='flex justify-center items-center gap-4 mb-6'>
              <Sparkle className='w-12 h-12 text-purple-500 animate-spin-slow' weight='fill' />
              <h1 className='text-6xl md:text-7xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight tracking-tight animate-fade-in'>
                AI Learning Courses
              </h1>
              <Sparkle
                className='w-12 h-12 text-pink-500 animate-spin-slow-reverse'
                weight='fill'
              />
            </div>
            <p className='text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4'>
              Master AI technology at your own pace with courses designed specifically for adults
              50+
            </p>
            <div className='flex justify-center gap-3 flex-wrap'>
              <Badge className='bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-1.5 text-sm shadow-lg'>
                <Fire className='w-4 h-4 mr-1.5' weight='fill' />
                Interactive Learning
              </Badge>
              <Badge className='bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-4 py-1.5 text-sm shadow-lg'>
                <Lightning className='w-4 h-4 mr-1.5' weight='fill' />
                Expert Guidance
              </Badge>
              <Badge className='bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1.5 text-sm shadow-lg'>
                <Certificate className='w-4 h-4 mr-1.5' weight='fill' />
                Progress Tracking
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats for Logged In Users */}
        {user && (
          <div className='grid md:grid-cols-4 gap-4 mb-8'>
            <Card className='bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-50   border-2 border-amber-200  hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-md ring-1 ring-amber-100/50'>
              <CardContent className='p-4 text-center relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full blur-xl' />
                <Trophy className='w-8 h-8 mx-auto mb-2 text-yellow-600 animate-bounce' />
                <div className='text-2xl font-bold text-foreground animate-fade-in'>
                  {dashboardSummary.completedModules}
                </div>
                <div className='text-sm text-muted-foreground'>Modules Completed</div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-br from-blue-100 via-cyan-50 to-sky-50   border-2 border-blue-200  hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-md ring-1 ring-blue-100/50'>
              <CardContent className='p-4 text-center relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-xl' />
                <BookOpen className='w-8 h-8 mx-auto mb-2 text-blue-600 hover:rotate-6 transition-transform' />
                <div className='text-2xl font-bold text-foreground animate-fade-in'>
                  {dashboardSummary.startedCourses}
                </div>
                <div className='text-sm text-muted-foreground'>Courses Started</div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50   border-2 border-green-200  hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-md ring-1 ring-green-100/50'>
              <CardContent className='p-4 text-center relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-xl' />
                <ChartBar className='w-8 h-8 mx-auto mb-2 text-green-600 hover:scale-110 transition-transform' />
                <div className='text-2xl font-bold text-foreground animate-fade-in'>
                  {dashboardSummary.currentStreak}
                </div>
                <div className='text-sm text-muted-foreground'>Day Streak</div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-br from-purple-100 via-indigo-50 to-violet-50   border-2 border-purple-200  hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-md ring-1 ring-purple-100/50'>
              <CardContent className='p-4 text-center relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-xl' />
                <Medal className='w-8 h-8 mx-auto mb-2 text-purple-600 animate-pulse' />
                <div className='text-2xl font-bold text-foreground animate-fade-in'>
                  {Math.round(dashboardSummary.weeklyProgress / 60)}h
                </div>
                <div className='text-sm text-muted-foreground'>This Week</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions for Logged In Users */}
        {user && (
          <div className='grid md:grid-cols-2 gap-6 mb-8'>
            {/* Continue Learning */}
            {getContinueCourse() && (
              <Card
                className='border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-primary/20'
                role='article'
                aria-label='Continue your current course'
              >
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Play className='w-5 h-5' />
                    Continue Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {((): ReactElement | null => {
                    const course = getContinueCourse();
                    if (!course) return null;
                    const completion = getCourseCompletionData(course);
                    return (
                      <>
                        <h3 className='font-semibold mb-2'>{course.title}</h3>
                        <div className='flex items-center justify-between mb-3'>
                          <span className='text-sm text-muted-foreground'>
                            {completion.completedModules} of {completion.totalModules} modules
                          </span>
                          <span className='text-sm font-medium'>{completion.percentage}%</span>
                        </div>
                        <Progress
                          value={completion.percentage}
                          className='mb-4'
                          aria-label={`Course progress: ${completion.percentage}% complete`}
                        />
                        <Button
                          onClick={() => handleStartCourse(course.id, course)}
                          className='w-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-semibold'
                        >
                          Continue Course
                          <ArrowRight className='w-4 h-4 ml-2' />
                        </Button>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            
          </div>
        )}

        {/* Search and Filter */}
        <div className='flex gap-4 mb-6'>
          <div className='flex-1 relative'>
            <MagnifyingGlass className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10' />
            <Input
              placeholder='🔍 Find your perfect AI course...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 border-2 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10 transition-all duration-200 bg-gradient-to-r from-white to-gray-50/50   text-lg'
            />
          </div>
          <div className='flex gap-2'>
            {(['all', 'free', 'advanced', 'expert'] as const).map((tier) => {
              const labels = {
                all: 'All',
                free: 'Basic',
                advanced: 'Advanced',
                expert: 'Expert',
              } as const;
              const icons = {
                all: '✨',
                free: '🆓',
                advanced: '⭐',
                expert: '👑',
              };
              return (
                <Button
                  key={tier}
                  variant={filterTier === tier ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilterTier(tier)}
                  className={`capitalize transition-all duration-200 hover:scale-105 ${
                    filterTier === tier
                      ? 'shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
                      : 'hover:bg-primary/10 hover:shadow-md'
                  }`}
                >
                  <span className='mr-1'>{icons[tier]}</span>
                  {labels[tier]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Course List */}
        <div className='space-y-8'>
          {filteredCourses.map((course) => {
            const completion = getCourseCompletionData(course);
            const hasAccess = canAccessTier(course.tier);
            const isRecommended =
              course.tier === 'free' ||
              (course.tier === 'advanced' && subscription.planId === 'free');

            const tierColors = {
              free: 'from-gray-900/95 via-black/85 to-gray-800/90',
              advanced: 'from-gray-900/95 via-slate-900/85 to-gray-800/90',
              expert: 'from-gray-900/95 via-zinc-900/85 to-gray-800/90',
            };

            return (
              <Card
                key={course.id}
                className={`overflow-hidden bg-gradient-to-br ${tierColors[course.tier]} border border-white/20 transition-all duration-500 hover:shadow-[0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-3 hover:scale-[1.02] shadow-2xl backdrop-blur-lg ${isRecommended ? 'ring-2 ring-blue-400/60 scale-[1.02] animate-pulse-slow border-blue-400/30' : ''} relative`}
                role='article'
                aria-label={`Course: ${course.title}`}
              >
                <CardHeader>
                  <div className='absolute top-4 right-4 w-20 h-20 opacity-20'>
                    {course.tier === 'free' && (
                      <BookOpen className='w-full h-full text-orange-500' />
                    )}
                    {course.tier === 'advanced' && (
                      <Shield className='w-full h-full text-purple-500' />
                    )}
                    {course.tier === 'expert' && <Star className='w-full h-full text-yellow-500' />}
                  </div>
                  <div className='flex items-start justify-between relative z-10'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <CardTitle className='text-2xl font-bold text-white'>
                          {course.title}
                        </CardTitle>
                        <TierBadge tier={course.tier} showIcon={true} />
                        {/* Start of removed code for subscription removal */}
                        {/* {course.price > 0 && (
                          <Badge variant='outline' className='text-sm'>
                            ${course.price.toFixed(2)}/month
                          </Badge>
                        )} */}
                        {/* End of removed code for subscription removal */}
                        {isRecommended && (
                          <Badge
                            variant='outline'
                            className='text-sm bg-yellow-50 border-yellow-200 text-yellow-800'
                          >
                            <Star className='w-3 h-3 mr-1' />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <CardDescription className='text-lg mb-4 text-gray-200'>
                        {course.description}
                      </CardDescription>

                      {/* Glass Course Features */}
                      <div className='flex flex-wrap gap-3 text-sm mb-4'>
                        <Badge className='flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm shadow-lg'>
                          <BookOpen className='w-4 h-4' weight='duotone' />
                          {course.totalModules} modules
                        </Badge>
                        <Badge className='flex items-center gap-1 bg-green-500/20 text-green-300 border border-green-400/30 backdrop-blur-sm shadow-lg'>
                          <Clock className='w-4 h-4' weight='duotone' />~{course.estimatedTotalTime}{' '}
                          min
                        </Badge>
                        <Badge className='flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm shadow-lg'>
                          <Users className='w-4 h-4' weight='duotone' />
                          50+ Friendly
                        </Badge>
                      </div>

                      {/* Glass Course Features List */}
                      <div className='mb-4 p-4 bg-white/10 border border-white/20 rounded-lg backdrop-blur-md shadow-lg'>
                        <ul className='text-sm space-y-2'>
                          {course.features.slice(0, 3).map((feature, index) => (
                            <li
                              key={feature}
                              className='flex items-center gap-2 hover:translate-x-2 transition-all duration-300 group/item text-gray-200'
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <CheckCircle
                                className='w-4 h-4 text-green-400 group-hover/item:text-green-300 transition-colors'
                                weight='fill'
                              />
                              <span className='group-hover/item:text-white transition-colors'>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {!hasAccess && <Lock className='text-gray-400 flex-shrink-0 mt-1' />}
                  </div>

                  {/* Progress Bar for Started Courses */}
                  {hasAccess && completion.isStarted && (
                    <div className='mt-4 p-4 bg-muted/30 rounded-lg'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium flex items-center gap-2'>
                          <ProgressRingMini
                            value={completion.percentage}
                            color={
                              course.tier === 'free'
                                ? 'orange'
                                : course.tier === 'advanced'
                                  ? 'purple'
                                  : 'warning'
                            }
                          />
                          Your Progress
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          {completion.completedModules} of {completion.totalModules} modules
                        </span>
                      </div>
                      <Progress
                        value={completion.percentage}
                        className='h-3 bg-gray-200 '
                        aria-label={`Course progress: ${completion.percentage}% complete`}
                      />
                      {completion.isCompleted && (
                        <div className='flex items-center gap-2 mt-2 text-green-700 '>
                          <CheckCircle className='w-4 h-4' weight='fill' />
                          <span className='text-sm font-medium'>Course completed!</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {/* Course Actions */}
                  {hasAccess ? (
                    <div className='flex items-center gap-4 mb-6'>
                      {completion.isStarted ? (
                        <Button
                          onClick={() => handleStartCourse(course.id, course)}
                          className='flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold'
                        >
                          <Play className='w-4 h-4' />
                          {completion.isCompleted ? 'Review Course' : 'Continue Learning'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartCourse(course.id, course)}
                          className='flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold'
                        >
                          <Play className='w-4 h-4' />
                          Start Course
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* Start of removed/added code for subscription removal */
                    <div className='mb-6 p-4 bg-muted/30 rounded-lg'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium mb-1'>Coming Soon</p>
                          <p className='text-sm text-muted-foreground'>
                            {course.tier === 'advanced' ? 'Advanced' : 'Expert'} courses will be
                            available in the future.
                          </p>
                        </div>
                        <Button disabled variant='outline' className='flex items-center gap-2'>
                          <Shield className='h-4 w-4' />
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                    /* End of removed/added code for subscription removal */
                    /* Removed for subscription removal - original subscription required section
                    <div className='mb-6 p-4 bg-muted/30 rounded-lg'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium mb-1'>
                            {course.tier === 'advanced' ? 'Advanced' : 'Expert'}{' '}
                            Subscription Required
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            ${course.price.toFixed(2)}/month to access all
                            modules
                          </p>
                        </div>
                        <Button
                          onClick={onAuthClick}
                          className='flex items-center gap-2'
                        >
                          <Shield className='h-4 w-4' />
                          {user ? 'Upgrade' : 'Sign Up'}
                          <ArrowRight />
                        </Button>
                      </div>
                    </div>
                    */
                  )}

                  {/* Module List */}
                  <div className='space-y-3'>
                    <h4 className='font-medium text-lg mb-3'>Course Modules</h4>
                    {course.modules.map((module, index) => {
                      const isModuleCompleted =
                        completion.isStarted &&
                        getCourseProgress(course.id)?.completedModules.includes(module.id);

                      return (
                        <div
                          key={module.id}
                          className={`border-2 rounded-xl p-4 transition-all duration-300 ${
                            hasAccess
                              ? 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-lg hover:border-primary/50 hover:scale-[1.03] cursor-pointer group'
                              : 'opacity-60'
                          } bg-gradient-to-r from-white via-gray-50/50 to-white   `}
                          onClick={() => {
                            if (hasAccess) {
                              const courseType =
                                course.id === 'ai-basics'
                                  ? 'basic'
                                  : course.id === 'ai-assistant'
                                    ? 'advanced'
                                    : 'expert';
                              void navigate(`/courses/${courseType}/module/${module.id}`);
                            }
                          }}
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-primary/30 group-hover:scale-110 group-hover:ring-primary/60 transition-all duration-300'>
                              {index + 1}
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h5 className='font-medium'>{module.title}</h5>
                                {isModuleCompleted && (
                                  <CheckCircle
                                    className='text-green-500 flex-shrink-0'
                                    weight='fill'
                                  />
                                )}
                                {!hasAccess && (
                                  <Lock className='text-muted-foreground flex-shrink-0' />
                                )}
                              </div>
                              <p className='text-sm text-muted-foreground mb-2'>
                                {module.description}
                              </p>
                              <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                <span className='flex items-center gap-1'>
                                  <Clock />
                                  {module.estimatedTime} min
                                </span>
                                {module.tags.length > 0 && (
                                  <span className='flex items-center gap-1'>#{module.tags[0]}</span>
                                )}
                              </div>
                            </div>

                            {hasAccess && (
                              <Button
                                variant={isModuleCompleted ? 'outline' : 'default'}
                                size='sm'
                                className='flex items-center gap-2 hover:shadow-md transition-all duration-200 hover:scale-105'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const courseType =
                                    course.id === 'ai-basics'
                                      ? 'basic'
                                      : course.id === 'ai-assistant'
                                        ? 'advanced'
                                        : 'expert';
                                  void navigate(`/courses/${courseType}/module/${module.id}`);
                                }}
                              >
                                {isModuleCompleted ? (
                                  <>
                                    <CheckCircle />
                                    Review
                                  </>
                                ) : (
                                  <>
                                    <Play />
                                    Start
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action for Non-Users */}
        {!user && (
          <Card className='mt-12 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300 ring-2 ring-indigo-100/50 relative overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-br from-indigo-200/20 via-transparent to-pink-200/20 pointer-events-none' />
            <div className='absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-indigo-300/20 to-transparent rounded-full blur-3xl pointer-events-none' />
            <CardContent className='p-8 text-center relative z-10'>
              <div className='max-w-2xl mx-auto'>
                <h3 className='text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
                  Ready to Start Your AI Learning Journey?
                </h3>
                <p className='text-lg text-muted-foreground mb-6'>
                  Join thousands of adults 50+ who are already mastering AI technology with{' '}
                  <BrandName variant='short' />. Start with our basic course and upgrade anytime to
                  access advanced content.
                </p>
                <div className='flex items-center justify-center gap-4 mb-6'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='text-green-500' />
                    <span>No credit card required</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='text-green-500' />
                    <span>Senior-friendly design</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='text-green-500' />
                    <span>Learn at your pace</span>
                  </div>
                </div>
                <Button
                  onClick={onAuthClick}
                  size='lg'
                  className='px-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg'
                >
                  <Shield className='h-4 w-4 mr-2' />
                  Get Started Free
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCourses.length === 0 && (
          <Card className='text-center p-8'>
            <CardContent>
              <MagnifyingGlass className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
              <h3 className='text-xl font-semibold mb-2'>No courses found</h3>
              <p className='text-muted-foreground'>
                Try adjusting your search terms or filters to find what you&apos;re looking for.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Memoized export for performance optimization
export const CoursesPage = React.memo(CoursesPageComponent);
