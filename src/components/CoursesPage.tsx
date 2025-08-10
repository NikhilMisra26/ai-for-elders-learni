import React, { useState, type ReactElement } from 'react';
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
  BookmarkSimple,
  ChartBar,
  Trophy,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import {
  useAccessControl,
  useMultiCourseAccess,
} from '@/hooks/useAccessControl';
import { SecurityLogger } from '@/lib/security';
import type { Course } from '@/lib/courseData';
import { courseData } from '@/lib/courseData';

interface CoursesPageProps {
  onAuthClick: () => void;
  onNavigateToModule?: (courseId: string, moduleId: string) => void;
}

export function CoursesPage({
  onAuthClick,
  onNavigateToModule,
}: CoursesPageProps): ReactElement {
  const { user } = useAuth();
  const { subscription, canAccessTier } = useSubscription();
  const { getCourseProgress, startCourse, getDashboardSummary } = useProgress();
  const { handleAccessDenied } = useAccessControl();

  // Batch access control for all courses
  const coursesForAccess = Object.values(courseData).map((course) => ({
    id: course.id,
    tier: course.tier,
  }));
  const courseAccessMap = useMultiCourseAccess(coursesForAccess);

  const [selectedModule, setSelectedModule] = useState<{
    courseId: string;
    moduleId: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<
    'all' | 'free' | 'advanced' | 'expert'
  >('all');

  const dashboardSummary = getDashboardSummary();
  // const availableCourses = getAvailableCourses(subscription.planId);

  // Filter courses based on search and filter
  const filteredCourses = Object.values(courseData).filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTier === 'all' || course.tier === filterTier;
    return matchesSearch && matchesFilter;
  });

  // Navigation is now handled by App.tsx
  React.useEffect(() => {
    if (selectedModule && onNavigateToModule) {
      // Navigate using the parent's navigation system
      onNavigateToModule(selectedModule.courseId, selectedModule.moduleId);
      setSelectedModule(null); // Reset local state
    }
  }, [selectedModule, onNavigateToModule]);

  // Don't render ModulePage here anymore - App.tsx handles it
  if (selectedModule) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-lg text-muted-foreground'>Loading module...</p>
        </div>
      </div>
    );
  }

  const handleModuleClick = (
    courseId: string,
    moduleId: string,
    course: Course,
  ): void => {
    // Check authentication
    if (!user) {
      onAuthClick();
      return;
    }

    // Check access permissions with enhanced tracking
    const hasClientAccess = canAccessTier(course.tier);
    const hasServerAccess = courseAccessMap.get(courseId) ?? false;

    if (!hasClientAccess || !hasServerAccess) {
      // Log the access attempt for analytics
      SecurityLogger.log(
        'course_access_attempt_denied',
        {
          userId: user.id,
          courseId,
          moduleId,
          userTier: subscription.planId,
          requiredTier: course.tier,
          hasClientAccess,
          hasServerAccess,
        },
        'info',
      );

      handleAccessDenied(
        course.tier,
        hasClientAccess ? 'server_denied' : 'tier_mismatch',
      );
      return;
    }

    // Use new navigation system if available, otherwise fallback
    if (onNavigateToModule) {
      onNavigateToModule(courseId, moduleId);
    } else {
      setSelectedModule({ courseId, moduleId });
    }
  };

  const handleStartCourse = (courseId: string, course: Course): void => {
    if (!user) {
      onAuthClick();
      return;
    }

    // Enhanced access validation
    const hasClientAccess = canAccessTier(course.tier);
    const hasServerAccess = courseAccessMap.get(courseId) ?? false;

    if (!hasClientAccess || !hasServerAccess) {
      // Log the access attempt for analytics
      SecurityLogger.log(
        'course_start_attempt_denied',
        {
          userId: user.id,
          courseId,
          userTier: subscription.planId,
          requiredTier: course.tier,
          hasClientAccess,
          hasServerAccess,
        },
        'info',
      );

      handleAccessDenied(
        course.tier,
        hasClientAccess ? 'server_denied' : 'tier_mismatch',
      );
      return;
    }

    startCourse(courseId);
    const firstModule = course.modules[0];
    if (firstModule) {
      if (onNavigateToModule) {
        onNavigateToModule(courseId, firstModule.id);
      } else {
        setSelectedModule({ courseId, moduleId: firstModule.id });
      }
    }
  };

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

  const getRecommendedCourse = (): Course | undefined => {
    // Find a course the user hasn't started yet with proper access validation
    const unstarted = Object.values(courseData).find((course) => {
      const progress = getCourseProgress(course.id);
      const hasClientAccess = canAccessTier(course.tier);
      const hasServerAccess = courseAccessMap.get(course.id) ?? false;
      return !progress && hasClientAccess && hasServerAccess;
    });
    return unstarted;
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
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-4'>AI Learning Courses</h1>
          <p className='text-xl text-muted-foreground'>
            Master AI technology at your own pace with courses designed
            specifically for adults 50+
          </p>
        </div>

        {/* Quick Stats for Logged In Users */}
        {user && (
          <div className='grid md:grid-cols-4 gap-4 mb-8'>
            <Card>
              <CardContent className='p-4 text-center'>
                <Trophy className='w-8 h-8 mx-auto mb-2 text-yellow-500' />
                <div className='text-2xl font-bold'>
                  {dashboardSummary.completedModules}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Modules Completed
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <BookOpen className='w-8 h-8 mx-auto mb-2 text-primary' />
                <div className='text-2xl font-bold'>
                  {dashboardSummary.startedCourses}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Courses Started
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <ChartBar className='w-8 h-8 mx-auto mb-2 text-green-500' />
                <div className='text-2xl font-bold'>
                  {dashboardSummary.currentStreak}
                </div>
                <div className='text-sm text-muted-foreground'>Day Streak</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <Medal className='w-8 h-8 mx-auto mb-2 text-purple-500' />
                <div className='text-2xl font-bold'>
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
                className='border-primary/20 bg-primary/5'
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
                            {completion.completedModules} of{' '}
                            {completion.totalModules} modules
                          </span>
                          <span className='text-sm font-medium'>
                            {completion.percentage}%
                          </span>
                        </div>
                        <Progress
                          value={completion.percentage}
                          className='mb-4'
                          aria-label={`Course progress: ${completion.percentage}% complete`}
                        />
                        <Button
                          onClick={() => handleStartCourse(course.id, course)}
                          className='w-full'
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

            {/* Recommended Course */}
            {getRecommendedCourse() && (
              <Card role='article' aria-label='Recommended course for you'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookmarkSimple className='w-5 h-5' />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {((): ReactElement | null => {
                    const course = getRecommendedCourse();
                    if (!course) return null;
                    return (
                      <>
                        <h3 className='font-semibold mb-2'>{course.title}</h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          {course.description}
                        </p>
                        <div className='flex items-center justify-between mb-4'>
                          <Badge
                            variant={
                              course.tier === 'free' ? 'secondary' : 'default'
                            }
                          >
                            {course.tier.toUpperCase()}
                          </Badge>
                          <span className='text-sm text-muted-foreground'>
                            {course.totalModules} modules
                          </span>
                        </div>
                        <Button
                          onClick={() => handleStartCourse(course.id, course)}
                          variant='outline'
                          className='w-full'
                        >
                          {course.tier === 'free'
                            ? 'Start Free Course'
                            : 'Start Course'}
                          <Play className='w-4 h-4 ml-2' />
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
            <MagnifyingGlass className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search courses and modules...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          <div className='flex gap-2'>
            {(['all', 'free', 'advanced', 'expert'] as const).map((tier) => (
              <Button
                key={tier}
                variant={filterTier === tier ? 'default' : 'outline'}
                size='sm'
                onClick={() => setFilterTier(tier)}
                className='capitalize'
              >
                {tier}
              </Button>
            ))}
          </div>
        </div>

        {/* Course List */}
        <div className='space-y-8'>
          {filteredCourses.map((course) => {
            const completion = getCourseCompletionData(course);
            const hasClientAccess = canAccessTier(course.tier);
            const hasServerAccess = courseAccessMap.get(course.id) ?? false;
            const hasAccess = hasClientAccess && hasServerAccess;
            const isLocked = !hasAccess;
            const isRecommended =
              course.tier === 'free' ||
              (course.tier === 'advanced' && subscription.planId === 'free');

            return (
              <Card
                key={course.id}
                className={`overflow-hidden transition-all duration-200 ${
                  isRecommended ? 'ring-2 ring-primary/20' : ''
                } ${isLocked ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg'}`}
                role='article'
                aria-label={`Course: ${course.title} ${isLocked ? '(Locked)' : ''}`}
                onClick={() => {
                  if (isLocked && user) {
                    // Track locked course click attempts
                    SecurityLogger.log(
                      'locked_course_clicked',
                      {
                        userId: user.id,
                        courseId: course.id,
                        requiredTier: course.tier,
                        userTier: subscription.planId,
                      },
                      'info',
                    );

                    toast.info('Upgrade Required', {
                      description: `This course requires ${course.tier} tier access. Click the upgrade button to continue.`,
                      action: {
                        label: 'Upgrade',
                        onClick: () => onAuthClick(),
                      },
                    });
                  }
                }}
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <CardTitle className='text-2xl'>
                          {course.title}
                        </CardTitle>
                        <Badge
                          variant={
                            course.tier === 'free' ? 'secondary' : 'default'
                          }
                          className='text-sm'
                        >
                          {course.tier.toUpperCase()}
                        </Badge>
                        {course.price > 0 && (
                          <Badge variant='outline' className='text-sm'>
                            ${course.price.toFixed(2)}/month
                          </Badge>
                        )}
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
                      <CardDescription className='text-base mb-4'>
                        {course.description}
                      </CardDescription>

                      {/* Course Features */}
                      <div className='flex flex-wrap gap-4 text-sm text-muted-foreground mb-4'>
                        <span className='flex items-center gap-1'>
                          <BookOpen className='w-4 h-4' />
                          {course.totalModules} modules
                        </span>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-4 h-4' />~
                          {course.estimatedTotalTime} minutes total
                        </span>
                        <span className='flex items-center gap-1'>
                          <Users className='w-4 h-4' />
                          Senior-friendly design
                        </span>
                      </div>

                      {/* Course Features List */}
                      <div className='mb-4'>
                        <ul className='text-sm space-y-1'>
                          {course.features.slice(0, 3).map((feature) => (
                            <li
                              key={feature}
                              className='flex items-center gap-2'
                            >
                              <CheckCircle className='w-4 h-4 text-green-500' />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {isLocked && (
                      <div className='flex items-center gap-2 flex-shrink-0 mt-1'>
                        <Lock className='text-yellow-500 h-5 w-5' />
                        <Badge
                          variant='outline'
                          className='text-xs bg-yellow-50 border-yellow-200 text-yellow-800'
                        >
                          {course.tier.toUpperCase()} REQUIRED
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for Started Courses */}
                  {hasAccess && completion.isStarted && (
                    <div className='mt-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium'>
                          Your Progress
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          {completion.completedModules} of{' '}
                          {completion.totalModules} modules (
                          {completion.percentage}%)
                        </span>
                      </div>
                      <Progress
                        value={completion.percentage}
                        className='h-2'
                        aria-label={`Course progress: ${completion.percentage}% complete`}
                      />
                      {completion.isCompleted && (
                        <div className='flex items-center gap-2 mt-2 text-green-700'>
                          <CheckCircle className='w-4 h-4' weight='fill' />
                          <span className='text-sm font-medium'>
                            Course completed! 🎉
                          </span>
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
                          className='flex items-center gap-2'
                        >
                          <Play className='w-4 h-4' />
                          {completion.isCompleted
                            ? 'Review Course'
                            : 'Continue Learning'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartCourse(course.id, course)}
                          className='flex items-center gap-2'
                        >
                          <Play className='w-4 h-4' />
                          {course.tier === 'free'
                            ? 'Start Free Course'
                            : 'Start Course'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className='mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='flex items-center gap-2 mb-1'>
                            <Lock className='h-4 w-4 text-yellow-600' />
                            <p className='font-medium text-yellow-800'>
                              {course.tier === 'advanced'
                                ? 'Advanced'
                                : 'Expert'}{' '}
                              Subscription Required
                            </p>
                          </div>
                          <p className='text-sm text-yellow-700'>
                            ${course.price.toFixed(2)}/month to access all
                            modules and premium features
                          </p>
                          <p className='text-xs text-yellow-600 mt-1'>
                            Server-side validation:{' '}
                            {hasServerAccess ? 'Passed' : 'Required'}
                          </p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Track upgrade button clicks
                            if (user) {
                              SecurityLogger.log(
                                'upgrade_button_clicked',
                                {
                                  userId: user.id,
                                  courseId: course.id,
                                  requiredTier: course.tier,
                                  userTier: subscription.planId,
                                  location: 'course_card',
                                },
                                'info',
                              );
                            }
                            onAuthClick();
                          }}
                          className='flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700'
                        >
                          <Shield className='h-4 w-4' />
                          {user ? 'Upgrade' : 'Sign Up'}
                          <ArrowRight />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Module List */}
                  <div className='space-y-3'>
                    <h4 className='font-medium text-lg mb-3'>Course Modules</h4>
                    {course.modules.map((module, index) => {
                      const isModuleCompleted =
                        completion.isStarted &&
                        getCourseProgress(course.id)?.completedModules.includes(
                          module.id,
                        );

                      return (
                        <div
                          key={module.id}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            hasAccess
                              ? 'hover:bg-muted/50 hover:border-primary/30 cursor-pointer'
                              : isLocked
                                ? 'opacity-60 bg-gray-50 cursor-not-allowed'
                                : 'opacity-60'
                          }`}
                          onClick={() => {
                            if (hasAccess) {
                              handleModuleClick(course.id, module.id, course);
                            } else if (isLocked && user) {
                              // Track locked module click attempts
                              SecurityLogger.log(
                                'locked_module_clicked',
                                {
                                  userId: user.id,
                                  courseId: course.id,
                                  moduleId: module.id,
                                  requiredTier: course.tier,
                                  userTier: subscription.planId,
                                },
                                'info',
                              );

                              toast.info('Module Locked', {
                                description: `Upgrade to ${course.tier} to access this module.`,
                                action: {
                                  label: 'Upgrade',
                                  onClick: () => onAuthClick(),
                                },
                              });
                            }
                          }}
                        >
                          <div className='flex items-start gap-4'>
                            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium'>
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
                                {isLocked && (
                                  <div className='flex items-center gap-1'>
                                    <Lock className='text-yellow-500 flex-shrink-0 h-4 w-4' />
                                    <Badge
                                      variant='outline'
                                      className='text-xs bg-yellow-50 border-yellow-200 text-yellow-800 px-1 py-0'
                                    >
                                      {course.tier
                                        .substring(0, 3)
                                        .toUpperCase()}
                                    </Badge>
                                  </div>
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
                                  <span className='flex items-center gap-1'>
                                    #{module.tags[0]}
                                  </span>
                                )}
                              </div>
                            </div>

                            {hasAccess ? (
                              <Button
                                variant={
                                  isModuleCompleted ? 'outline' : 'default'
                                }
                                size='sm'
                                className='flex items-center gap-2'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModuleClick(
                                    course.id,
                                    module.id,
                                    course,
                                  );
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
                            ) : (
                              <Button
                                variant='outline'
                                size='sm'
                                className='flex items-center gap-2 opacity-50 cursor-not-allowed'
                                disabled
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Lock className='h-3 w-3' />
                                Locked
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
          <Card className='mt-12 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20'>
            <CardContent className='p-8 text-center'>
              <div className='max-w-2xl mx-auto'>
                <h3 className='text-2xl font-bold mb-4'>
                  Ready to Start Your AI Learning Journey?
                </h3>
                <p className='text-lg text-muted-foreground mb-6'>
                  Join thousands of adults 50+ who are already mastering AI
                  technology. Start with our free course and upgrade anytime to
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
                <Button onClick={onAuthClick} size='lg' className='px-8'>
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
                Try adjusting your search terms or filters to find what
                you&apos;re looking for.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
