import React, { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  ChartBar,
  Trophy,
  Fire,
  BookmarkSimple,
  Play,
  Sparkle,
  Brain,
  Lightning,
  //  Medal, // Subscription feature - temporarily disabled, will be re-enabled later
} from '@phosphor-icons/react';

import { BrandName } from '@/components/BrandName';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import { courseData } from '@/lib/courseData';

function DashboardPageComponent(): ReactElement {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { getDashboardSummary, getLearningRecommendations, learningStats } =
    useProgress();

  const dashboardSummary = getDashboardSummary();
  const recommendations = getLearningRecommendations();

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };


  const handleStartLearning = (): void => {
    if (recommendations.continueModule) {
      void navigate('/courses');
    } else if (recommendations.startCourse) {
      void navigate('/courses');
    }
  };

  return (
    <div className='min-h-screen'>

      {/* Hero Section with Gradient */}
      <section className='relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16 px-4 sm:px-6 lg:px-8'>
        {/* Animated Background Elements - optimized for performance */}
        <div className='absolute inset-0 opacity-40 pointer-events-none'>
          <div className='absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-2xl animate-pulse will-change-transform' />
          <div className='absolute top-40 right-40 w-40 h-40 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full blur-2xl animate-pulse delay-1000 will-change-transform' />
          <div className='absolute bottom-20 left-1/3 w-36 h-36 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-2xl animate-pulse delay-2000 will-change-transform' />
        </div>

        <div className='relative max-w-7xl mx-auto'>
          <div className='text-center'>
            <h1 className='text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent'>
              {getGreeting()}!
            </h1>
            <p className='text-2xl text-gray-700 font-medium'>
              Your AI Learning Journey with <BrandName variant='short' />
            </p>

            {/* Quick Stats Hero Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 mb-8 max-w-4xl mx-auto'>
              <div className='relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-75' />
                <Card className='relative bg-white/90 backdrop-blur-sm border-0 shadow-xl transform hover:scale-105 transition-all duration-300'>
                  <CardContent className='p-6'>
                    <Trophy className='w-12 h-12 mx-auto mb-3 text-yellow-600' />
                    <div className='text-3xl font-bold text-gray-800'>
                      {dashboardSummary.completedModules}
                    </div>
                    <div className='text-sm font-medium text-gray-600'>Modules Mastered</div>
                  </CardContent>
                </Card>
              </div>

              <div className='relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-75' />
                <Card className='relative bg-white/90 backdrop-blur-sm border-0 shadow-xl transform hover:scale-105 transition-all duration-300'>
                  <CardContent className='p-6'>
                    <Fire className='w-12 h-12 mx-auto mb-3 text-orange-600' />
                    <div className='text-3xl font-bold text-gray-800'>
                      {dashboardSummary.currentStreak}
                    </div>
                    <div className='text-sm font-medium text-gray-600'>Day Streak 🔥</div>
                  </CardContent>
                </Card>
              </div>

              <div className='relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-75' />
                <Card className='relative bg-white/90 backdrop-blur-sm border-0 shadow-xl transform hover:scale-105 transition-all duration-300'>
                  <CardContent className='p-6'>
                    <Lightning className='w-12 h-12 mx-auto mb-3 text-green-600' />
                    <div className='text-3xl font-bold text-gray-800'>
                      {Math.round(dashboardSummary.weeklyProgress / 60)}h
                    </div>
                    <div className='text-sm font-medium text-gray-600'>This Week</div>
                  </CardContent>
                </Card>
              </div>
              {/* start of removed codd for subscription removal
              <div className='relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-75' />
                <Card className='relative bg-white/90 backdrop-blur-sm border-0 shadow-xl transform hover:scale-105 transition-all duration-300'>
                  <CardContent className='p-6'>
                    <Medal className='w-12 h-12 mx-auto mb-3 text-purple-600' />
                    <div className='text-3xl font-bold text-gray-800 capitalize'>
                      {subscription.planId}
                    </div>
                    <div className='text-sm font-medium text-gray-600'>Your Plan</div>
                  </CardContent>
                </Card>
              </div> {/* end of removed code for subscription removal */}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto p-6'>
        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Continue Learning Card - Enhanced */}
            {recommendations.continueModule && (
              <Card className='relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-2xl opacity-50' />
                <CardHeader className='relative'>
                  <CardTitle className='flex items-center gap-2 text-2xl'>
                    <Play className='w-7 h-7 text-blue-600' />
                    Continue Your Journey
                  </CardTitle>
                  <CardDescription className='text-base'>
                    Pick up where you left off
                  </CardDescription>
                </CardHeader>
                <CardContent className='relative'>
                  <div className='flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg'>
                    <div>
                      <h3 className='font-bold text-xl mb-2 text-gray-800'>
                        {recommendations.continueModule.module.title}
                      </h3>
                      <p className='text-gray-600 font-medium'>
                        {courseData[recommendations.continueModule.courseId]?.title}
                      </p>
                      <div className='flex items-center gap-2 mt-3'>
                        <Clock className='w-5 h-5 text-blue-500' />
                        <span className='text-sm font-medium text-gray-600'>
                          {recommendations.continueModule.module.estimatedTime} min remaining
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartLearning}
                      size='lg'
                      className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                    >
                      Continue
                      <ArrowRight className='ml-2' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start New Course - Enhanced */}
            {recommendations.startCourse && !recommendations.continueModule && (
              <Card className='relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-50 via-teal-50 to-blue-50'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200 to-teal-200 rounded-full blur-2xl opacity-50' />
                <CardHeader className='relative'>
                  <CardTitle className='flex items-center gap-2 text-2xl'>
                    <BookmarkSimple className='w-7 h-7 text-green-600' />
                    Recommended for You
                  </CardTitle>
                  <CardDescription className='text-base'>
                    Start a new learning adventure
                  </CardDescription>
                </CardHeader>
                <CardContent className='relative'>
                  <div className='flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg'>
                    <div>
                      <h3 className='font-bold text-xl mb-2 text-gray-800'>
                        {recommendations.startCourse.title}
                      </h3>
                      <p className='text-gray-600 mb-3'>
                        {recommendations.startCourse.description}
                      </p>
                      <div className='flex items-center gap-4'>
                        <Badge
                          variant='secondary'
                          className='bg-gradient-to-r from-green-100 to-teal-100 text-green-800 border-green-200'
                        >
                          {recommendations.startCourse.tier.toUpperCase()}
                        </Badge>
                        <span className='text-sm font-medium text-gray-600'>
                          {recommendations.startCourse.totalModules} exciting modules
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleStartLearning}
                      className='bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                    >
                      Start Course
                      <ArrowRight className='ml-2' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Course Progress Overview - Enhanced */}
            <Card className='border-0 shadow-xl'>
              <CardHeader className='bg-gradient-to-r from-purple-50 to-pink-50'>
                <CardTitle className='text-xl'>Your Learning Path</CardTitle>
                <CardDescription>Track your progress across all courses</CardDescription>
              </CardHeader>
              <CardContent className='pt-6'>
                <div className='space-y-6'>
                  {Object.values(courseData)
                    .filter((course) => {
                      const tierOrder = { free: 1, advanced: 2, expert: 3 };
                      return tierOrder[subscription.planId] >= tierOrder[course.tier];
                    })
                    .map((course) => {
                      const completedModules = course.modules.filter(
                        () => false, // Placeholder
                      ).length;
                      const progressPercentage = Math.round(
                        (completedModules / course.totalModules) * 100,
                      );

                      return (
                        <div
                          key={course.id}
                          className='p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center gap-3'>
                              <Brain className='w-5 h-5 text-purple-600' />
                              <h3 className='font-semibold text-gray-800'>{course.title}</h3>
                              <Badge
                                variant='secondary'
                                className={
                                  course.tier === 'free'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                }
                              >
                                {course.tier.toUpperCase()}
                              </Badge>
                            </div>
                            <span className='text-sm font-medium text-gray-600'>
                              {completedModules}/{course.totalModules} modules
                            </span>
                          </div>
                          <div className='relative'>
                            <Progress value={progressPercentage} className='h-3 bg-gray-200' />
                            <div
                              className='absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500'
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div className='flex justify-between text-sm text-gray-600 mt-2'>
                            <span className='font-medium'>{progressPercentage}% complete</span>
                            <span>~{course.estimatedTotalTime} min total</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant='default'
                  className='w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                  onClick={() => void navigate('/courses')}
                >
                  Explore All Courses
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity - Enhanced */}
            {dashboardSummary.recentActivity.length > 0 && (
              <Card className='border-0 shadow-xl'>
                <CardHeader className='bg-gradient-to-r from-blue-50 to-teal-50'>
                  <CardTitle className='flex items-center gap-2 text-xl'>
                    <Clock className='w-6 h-6 text-blue-600' />
                    Recent Achievements
                  </CardTitle>
                  <CardDescription>Your latest learning milestones</CardDescription>
                </CardHeader>
                <CardContent className='pt-6'>
                  <div className='space-y-3'>
                    {dashboardSummary.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className='flex items-start gap-3 p-4 bg-gradient-to-r from-white to-blue-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200'
                      >
                        <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center flex-shrink-0'>
                          {activity.type === 'module_completed' && (
                            <CheckCircle className='w-5 h-5 text-green-600' />
                          )}
                          {activity.type === 'course_started' && (
                            <BookOpen className='w-5 h-5 text-blue-600' />
                          )}
                          {activity.type === 'course_completed' && (
                            <Trophy className='w-5 h-5 text-yellow-600' />
                          )}
                          {activity.type === 'rating_given' && (
                            <Star className='w-5 h-5 text-purple-600' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-gray-800'>{activity.title}</p>
                          <p className='text-sm text-gray-600'>{activity.description}</p>
                          <p className='text-xs text-gray-500 mt-1'>
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

          {/* Sidebar - Enhanced */}
          <div className='space-y-6'>

            {/* Learning Stats - Enhanced */}
            <Card className='border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ChartBar className='w-5 h-5 text-orange-600' />
                  Learning Stats
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg'>
                    <div className='text-3xl font-bold text-orange-600'>
                      {Math.round(learningStats.totalTimeSpent / 60)}
                    </div>
                    <div className='text-xs font-semibold text-gray-600'>Hours Learned</div>
                  </div>
                  <div className='text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg'>
                    <div className='text-3xl font-bold text-yellow-600'>
                      {learningStats.averageRating.toFixed(1)}
                    </div>
                    <div className='text-xs font-semibold text-gray-600'>Avg Rating</div>
                  </div>
                </div>

                <Separator className='bg-orange-100' />

                <div className='p-4 bg-white/80 backdrop-blur-sm rounded-lg'>
                  <div className='text-sm font-semibold text-gray-700 mb-2'>Current Streak</div>
                  <div className='flex items-center gap-2'>
                    <Fire className='w-6 h-6 text-orange-500' />
                    <span className='font-bold text-lg text-gray-800'>
                      {learningStats.streak.currentStreak} days
                    </span>
                  </div>
                  <div className='text-xs font-medium text-gray-600 mt-1'>
                    Best streak: {learningStats.streak.longestStreak} days
                  </div>
                </div>

                {learningStats.favoriteTopics.length > 0 && (
                  <>
                    <Separator className='bg-orange-100' />
                    <div className='p-4 bg-white/80 backdrop-blur-sm rounded-lg'>
                      <div className='text-sm font-semibold text-gray-700 mb-3'>
                        Favorite Topics
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {learningStats.favoriteTopics.slice(0, 3).map((topic) => (
                          <Badge
                            key={topic}
                            variant='secondary'
                            className='bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800'
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

            {/* Daily Tip - Enhanced */}
            <Card className='border-0 shadow-xl bg-gradient-to-br from-green-50 to-teal-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkle className='w-5 h-5 text-teal-600' />
                  Daily Wisdom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='p-4 bg-white/80 backdrop-blur-sm rounded-lg'>
                  <p className='text-sm text-gray-700 leading-relaxed'>
                    <span className='text-2xl mr-2'>💡</span>
                    <strong className='text-teal-700'>Today&apos;s tip:</strong> Learning AI is a
                    journey, not a race. Take your time to understand each concept thoroughly.
                    Remember, even 15 minutes a day can lead to amazing progress over time!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoized export for performance optimization
export const DashboardPage = React.memo(DashboardPageComponent);
