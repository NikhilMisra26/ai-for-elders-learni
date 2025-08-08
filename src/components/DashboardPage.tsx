import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  ChartBar,
  Trophy,
  Fire,
  Target,
  Users,
  Gift,
  Settings,
  BookmarkSimple,
  Play,
  Sparkle,
} from '@phosphor-icons/react';

import { AuthForm } from './AuthForm';

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
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import { courseData } from '@/lib/courseData';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const { subscription, getCurrentPlan, getDaysUntilExpiry } =
    useSubscription();
  const {
    getDashboardSummary,
    getLearningRecommendations,
    learningStats,
    setWeeklyGoal,
  } = useProgress();

  const [showGoalSetting, setShowGoalSetting] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Card className='max-w-md'>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your learning dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm onClose={() => onNavigate('home')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardSummary = getDashboardSummary();
  const recommendations = getLearningRecommendations();
  const currentPlan = getCurrentPlan();
  const daysUntilExpiry = getDaysUntilExpiry();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate weekly progress percentage
  const weeklyProgressPercentage =
    learningStats.weeklyGoal > 0
      ? Math.min(
          (learningStats.weeklyProgress / learningStats.weeklyGoal) * 100,
          100,
        )
      : 0;

  // Get recent courses
  const getRecentCourses = () => {
    return Object.values(courseData)
      .filter((course) => {
        const progress = dashboardSummary.startedCourses > 0;
        return progress;
      })
      .slice(0, 3);
  };

  const handleStartLearning = () => {
    if (recommendations.continueModule) {
      // Navigate to specific module - in a real app, you'd implement this routing
      onNavigate('courses');
    } else if (recommendations.startCourse) {
      onNavigate('courses');
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Welcome Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>
            {getGreeting()}, {user.name}! 👋
          </h1>
          <p className='text-xl text-muted-foreground'>
            Ready to continue your AI learning journey today?
          </p>
        </div>

        {/* Key Stats Row */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <Card className='text-center'>
            <CardContent className='p-4'>
              <Trophy className='w-8 h-8 mx-auto mb-2 text-yellow-500' />
              <div className='text-2xl font-bold'>
                {dashboardSummary.completedModules}
              </div>
              <div className='text-sm text-muted-foreground'>
                Modules Completed
              </div>
            </CardContent>
          </Card>

          <Card className='text-center'>
            <CardContent className='p-4'>
              <Fire className='w-8 h-8 mx-auto mb-2 text-orange-500' />
              <div className='text-2xl font-bold'>
                {dashboardSummary.currentStreak}
              </div>
              <div className='text-sm text-muted-foreground'>Day Streak</div>
            </CardContent>
          </Card>

          <Card className='text-center'>
            <CardContent className='p-4'>
              <ChartBar className='w-8 h-8 mx-auto mb-2 text-green-500' />
              <div className='text-2xl font-bold'>
                {Math.round(dashboardSummary.weeklyProgress / 60)}h
              </div>
              <div className='text-sm text-muted-foreground'>This Week</div>
            </CardContent>
          </Card>

          <Card className='text-center'>
            <CardContent className='p-4'>
              <Star className='w-8 h-8 mx-auto mb-2 text-purple-500' />
              <div className='text-2xl font-bold capitalize'>
                {subscription.planId}
              </div>
              <div className='text-sm text-muted-foreground'>Plan</div>
            </CardContent>
          </Card>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Continue Learning Card */}
            {recommendations.continueModule && (
              <Card className='border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Play className='w-5 h-5' />
                    Continue Learning
                  </CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between p-4 bg-background/50 rounded-lg'>
                    <div>
                      <h3 className='font-semibold text-lg mb-1'>
                        {recommendations.continueModule.module.title}
                      </h3>
                      <p className='text-muted-foreground'>
                        {
                          courseData[recommendations.continueModule.courseId]
                            ?.title
                        }
                      </p>
                      <div className='flex items-center gap-2 mt-2'>
                        <Clock className='w-4 h-4' />
                        <span className='text-sm text-muted-foreground'>
                          {recommendations.continueModule.module.estimatedTime}{' '}
                          min
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartLearning}
                      size='lg'
                      className='flex items-center gap-2'
                    >
                      Continue
                      <ArrowRight />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start New Course */}
            {recommendations.startCourse && !recommendations.continueModule && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookmarkSimple className='w-5 h-5' />
                    Recommended for You
                  </CardTitle>
                  <CardDescription>Start a new learning path</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between p-4 bg-muted/30 rounded-lg'>
                    <div>
                      <h3 className='font-semibold text-lg mb-1'>
                        {recommendations.startCourse.title}
                      </h3>
                      <p className='text-muted-foreground mb-2'>
                        {recommendations.startCourse.description}
                      </p>
                      <div className='flex items-center gap-4'>
                        <Badge
                          variant={
                            recommendations.startCourse.tier === 'free'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {recommendations.startCourse.tier.toUpperCase()}
                        </Badge>
                        <span className='text-sm text-muted-foreground'>
                          {recommendations.startCourse.totalModules} modules
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartLearning}
                      variant='outline'
                      className='flex items-center gap-2'
                    >
                      Start Course
                      <ArrowRight />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Goal Progress */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='w-5 h-5' />
                  Weekly Learning Goal
                </CardTitle>
                <CardDescription>
                  Track your weekly learning progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {Math.round(learningStats.weeklyProgress)} /{' '}
                      {learningStats.weeklyGoal} minutes
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {Math.round(weeklyProgressPercentage)}%
                    </span>
                  </div>
                  <Progress value={weeklyProgressPercentage} className='h-3' />
                  <div className='flex justify-between items-center'>
                    <p className='text-xs text-muted-foreground'>
                      {weeklyProgressPercentage >= 100
                        ? '🎉 Goal achieved this week!'
                        : `${Math.round((learningStats.weeklyGoal - learningStats.weeklyProgress) / 60)} hours to go`}
                    </p>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowGoalSetting(!showGoalSetting)}
                    >
                      <Settings className='w-4 h-4' />
                    </Button>
                  </div>

                  {showGoalSetting && (
                    <div className='pt-4 border-t'>
                      <label className='text-sm font-medium'>
                        Weekly Goal (minutes)
                      </label>
                      <div className='flex gap-2 mt-2'>
                        {[60, 120, 180, 240].map((minutes) => (
                          <Button
                            key={minutes}
                            variant={
                              learningStats.weeklyGoal === minutes
                                ? 'default'
                                : 'outline'
                            }
                            size='sm'
                            onClick={() => setWeeklyGoal(minutes)}
                          >
                            {minutes / 60}h
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>
                  Track your progress across all available courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {Object.values(courseData)
                    .filter((course) => {
                      // Show courses user has access to
                      const tierOrder = { free: 1, advanced: 2, expert: 3 };
                      return (
                        tierOrder[subscription.planId] >= tierOrder[course.tier]
                      );
                    })
                    .map((course) => {
                      const completedModules = course.modules.filter(
                        (module) =>
                          // Check if module is completed - in real app, use progress tracking
                          false, // Placeholder
                      ).length;
                      const progressPercentage = Math.round(
                        (completedModules / course.totalModules) * 100,
                      );

                      return (
                        <div key={course.id} className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <h3 className='font-medium'>{course.title}</h3>
                              <Badge
                                variant={
                                  course.tier === 'free'
                                    ? 'secondary'
                                    : 'default'
                                }
                              >
                                {course.tier.toUpperCase()}
                              </Badge>
                            </div>
                            <span className='text-sm text-muted-foreground'>
                              {completedModules}/{course.totalModules} modules
                            </span>
                          </div>
                          <Progress
                            value={progressPercentage}
                            className='h-2'
                          />
                          <div className='flex justify-between text-xs text-muted-foreground'>
                            <span>{progressPercentage}% complete</span>
                            <span>~{course.estimatedTotalTime} min total</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant='outline'
                  className='w-full mt-6'
                  onClick={() => onNavigate('courses')}
                >
                  View All Courses
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {dashboardSummary.recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Clock className='w-5 h-5' />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest learning milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboardSummary.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className='flex items-start gap-3 p-3 bg-muted/30 rounded-lg'
                      >
                        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                          {activity.type === 'module_completed' && (
                            <CheckCircle className='w-4 h-4 text-green-600' />
                          )}
                          {activity.type === 'course_started' && (
                            <BookOpen className='w-4 h-4 text-blue-600' />
                          )}
                          {activity.type === 'course_completed' && (
                            <Trophy className='w-4 h-4 text-yellow-600' />
                          )}
                          {activity.type === 'rating_given' && (
                            <Star className='w-4 h-4 text-purple-600' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <p className='font-medium text-sm'>
                            {activity.title}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {activity.description}
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5' />
                  Account Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <div className='text-sm font-medium text-muted-foreground'>
                    Subscription
                  </div>
                  <div className='flex items-center justify-between'>
                    <Badge
                      variant={
                        subscription.planId === 'free' ? 'secondary' : 'default'
                      }
                    >
                      {currentPlan.name}
                    </Badge>
                    {subscription.planId === 'free' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onNavigate('account')}
                      >
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>

                {subscription.planId !== 'free' && (
                  <div>
                    <div className='text-sm font-medium text-muted-foreground'>
                      Next Billing
                    </div>
                    <div className='text-sm'>
                      {subscription.nextBillingDate
                        ? new Date(
                            subscription.nextBillingDate,
                          ).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <div className='text-sm font-medium text-muted-foreground'>
                    Member Since
                  </div>
                  <div className='text-sm'>
                    {new Date(user.joinDate).toLocaleDateString()}
                  </div>
                </div>

                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => onNavigate('account')}
                >
                  Manage Account
                  <Settings className='w-4 h-4 ml-2' />
                </Button>
              </CardContent>
            </Card>

            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ChartBar className='w-5 h-5' />
                  Learning Stats
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold'>
                      {Math.round(learningStats.totalTimeSpent / 60)}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Hours Learned
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold'>
                      {learningStats.averageRating.toFixed(1)}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Avg Rating
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className='text-sm font-medium mb-2'>Current Streak</div>
                  <div className='flex items-center gap-2'>
                    <Fire className='w-5 h-5 text-orange-500' />
                    <span className='font-semibold'>
                      {learningStats.streak.currentStreak} days
                    </span>
                  </div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    Longest: {learningStats.streak.longestStreak} days
                  </div>
                </div>

                {learningStats.favoriteTopics.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className='text-sm font-medium mb-2'>
                        Favorite Topics
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {learningStats.favoriteTopics
                          .slice(0, 3)
                          .map((topic) => (
                            <Badge
                              key={topic}
                              variant='secondary'
                              className='text-xs'
                            >
                              {topic}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Learning Tips */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkle className='w-5 h-5' />
                  Daily Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  🎯 <strong>Pro tip:</strong> Try to complete at least one
                  module every few days to maintain your learning momentum.
                  Remember, you can always re-visit modules to reinforce your
                  understanding!
                </p>
              </CardContent>
            </Card>

            {/* Subscription Reminder */}
            {subscription.planId === 'free' && (
              <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Gift className='w-5 h-5' />
                    Unlock More Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Ready to dive deeper? Upgrade to access advanced AI
                    techniques and expert-level content.
                  </p>
                  <Button
                    onClick={() => onNavigate('account')}
                    className='w-full'
                  >
                    View Plans
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
