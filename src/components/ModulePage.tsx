import { useState, useEffect, useRef, useMemo, type ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Stop,
  CheckCircle,
  BookOpen,
  Clock,
  Star,
  ChatCircle,
  ArrowLeft,
  ArrowRight,
  SpeakerHigh,
  List,
  ChartBar,
  Printer,
  StarFour,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AudioControlsErrorBoundary } from '@/components/AudioControlsErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import {
  useAudioNarration,
  getEstimatedSpeechTime,
  announceToScreenReader,
} from '@/lib/audioNarration';
import { errorHandler } from '@/lib/errorHandler';
import { getCourseById, getModuleById, getNextModule, getPreviousModule } from '@/lib/courseData';

interface ModulePageProps {
  courseType?: 'basic' | 'advanced' | 'expert';
}

export function ModulePage({ courseType: propCourseType }: ModulePageProps): ReactElement {
  const { courseType: paramCourseType, moduleId: paramModuleId } = useParams<{
    courseType: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  // Call ALL hooks at the top, before any conditional logic
  const { user } = useAuth();
  const { subscription, canAccessTier } = useSubscription();

  // Suppress unused variable warnings for required hook calls
  void user;
  void subscription;
  const {
    completeModule,
    isModuleCompleted,
    rateModule,
    getCourseProgress,
    getModuleProgress,
    setCurrentModule,
  } = useProgress();

  // Map route course types to course IDs
  const courseTypeToId = {
    basic: 'ai-basics',
    advanced: 'ai-assistant',
    expert: 'advanced-ai',
  } as const;

  // Determine course type and module ID from props or URL params
  const courseType = (propCourseType ?? paramCourseType) as keyof typeof courseTypeToId;
  const courseId = courseTypeToId[courseType];
  const moduleId = paramModuleId ?? null;

  // Get course and module data (may be null)
  const course = getCourseById(courseId);
  const module = moduleId ? getModuleById(courseId, moduleId) : null;
  const nextModule = moduleId ? getNextModule(courseId, moduleId) : null;
  const previousModule = moduleId ? getPreviousModule(courseId, moduleId) : null;
  const courseProgress = getCourseProgress(courseId);
  const moduleProgress = moduleId ? getModuleProgress(courseId, moduleId) : null;

  // Audio narration state - memoize content to prevent hook recreation
  const moduleContent = useMemo(() => module?.content ?? '', [module?.content]);
  const [audioState, audioControls] = useAudioNarration(moduleContent);
  const [showAudioControls, setShowAudioControls] = useState(false);

  // Module interaction state
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentRating, setCurrentRating] = useState(moduleProgress?.rating ?? 0);
  const [comment, setComment] = useState('');
  const [startTime, setStartTime] = useState(Date.now());
  const [showOutline, setShowOutline] = useState(false);

  // Track the last module that was set to prevent redundant calls
  const lastSetModuleRef = useRef<string | null>(null);
  // Track if cleanup has been performed to prevent double-cleanup
  const cleanupPerformedRef = useRef<boolean>(false);

  // If no module ID is provided, navigate to first module
  useEffect(() => {
    if (courseType && !moduleId) {
      const course = getCourseById(courseId);
      if (course && course.modules.length > 0) {
        void navigate(`/courses/${courseType}/module/${course.modules[0].id}`, {
          replace: true,
        });
        return;
      }
    }
  }, [courseType, moduleId, courseId, navigate]);

  // Set current module when available - with guard to prevent infinite loops
  useEffect(() => {
    if (course && module && moduleId) {
      const moduleKey = `${courseId}-${moduleId}`;

      // Only call setCurrentModule if we haven't already set this specific module
      if (lastSetModuleRef.current !== moduleKey) {
        lastSetModuleRef.current = moduleKey;
        setCurrentModule(courseId, moduleId);
      }
    }

    // Cleanup function to reset the ref when component unmounts or course/module changes significantly
    return (): void => {
      // Reset if course or module becomes unavailable
      if (!course || !module || !moduleId) {
        lastSetModuleRef.current = null;
      }
    };
  }, [courseId, moduleId, course, module, setCurrentModule]);

  // Reset startTime and timeSpent when navigating to new module
  useEffect(() => {
    if (moduleId) {
      setStartTime(Date.now());
      setTimeSpent(0);
    }
  }, [moduleId]);

  // Track time spent
  useEffect(() => {
    if (!moduleId) return undefined;

    const interval = window.setInterval((): void => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 60000); // Update every minute

    return (): void => {
      window.clearInterval(interval);
    };
  }, [startTime, moduleId]);

  // Handle component unmount to save progress and cleanup audio
  useEffect(() => {
    // Reset cleanup flag when effect runs
    cleanupPerformedRef.current = false;

    return (): void => {
      // Only perform cleanup once
      if (cleanupPerformedRef.current) {
        return;
      }
      cleanupPerformedRef.current = true;

      if (timeSpent > 0) {
        // Auto-save time spent when leaving module
      }

      // Cleanup audio on unmount
      try {
        if (audioState.isPlaying) {
          audioControls.stop();
        }
        setShowAudioControls(false);
      } catch (error) {
        // Silent cleanup error - no user-facing action needed
        errorHandler.logError(
          'Audio cleanup failed on unmount',
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'ModulePage',
            action: 'audio_cleanup',
          },
        );
      }
    };
    // Dependencies for cleanup effect
  }, [timeSpent, audioState.isPlaying, audioControls]);

  // Handle audio state errors and auto-hide controls on stop
  useEffect(() => {
    if (!audioState.isPlaying && !audioState.isPaused && showAudioControls) {
      // Auto-hide controls when audio stops naturally
      const timer = setTimeout(() => {
        setShowAudioControls(false);
      }, 2000);

      return (): void => {
        clearTimeout(timer);
      };
    }

    // Return undefined when no cleanup is needed
    return undefined;
  }, [audioState.isPlaying, audioState.isPaused, showAudioControls]);

  // Loading fallback component
  const PageLoader = (): ReactElement => (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <div className='text-center'>
        <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4' />
        <p className='text-lg text-muted-foreground'>Loading...</p>
      </div>
    </div>
  );

  // Early return if no module ID is available yet
  if (!moduleId) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <PageLoader />
      </div>
    );
  }

  const handleBackToCourses = (): void => {
    void navigate('/courses');
  };

  const handleBackToCourse = (): void => {
    void navigate(`/courses/${courseType}`);
  };

  const handleNavigateToModule = (targetCourseId: string, targetModuleId: string): void => {
    // Map course ID back to course type
    const idToCourseType = {
      'ai-basics': 'basic',
      'ai-assistant': 'advanced',
      'advanced-ai': 'expert',
    } as const;

    const targetCourseType = idToCourseType[targetCourseId as keyof typeof idToCourseType];
    if (targetCourseType) {
      void navigate(`/courses/${targetCourseType}/module/${targetModuleId}`);
    }
  };

  if (!course || !module) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='max-w-md'>
          <CardContent className='p-6 text-center'>
            <h2 className='text-xl font-semibold mb-2'>Module Not Found</h2>
            <p className='text-muted-foreground mb-4'>The requested module could not be found.</p>
            <Button onClick={handleBackToCourses}>Back to Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check access permissions
  const hasAccess = canAccessTier(course.tier);
  const isCompleted = isModuleCompleted(courseId, moduleId);
  const estimatedSpeechTime = getEstimatedSpeechTime(module.content);

  const handleMarkComplete = (): void => {
    const finalTimeSpent = Math.max(timeSpent, 1); // At least 1 minute
    completeModule(courseId, moduleId, finalTimeSpent, currentRating || undefined);
    toast.success('Module completed! 🎉', {
      description: 'Great job! Your progress has been saved.',
    });
    announceToScreenReader('Module marked as complete. Great job!');
  };

  const handleRating = (rating: number): void => {
    setCurrentRating(rating);
    rateModule(courseId, moduleId, rating);
    toast.success(`Rated ${rating} star${rating !== 1 ? 's' : ''}`);
    announceToScreenReader(`Module rated ${rating} out of 5 stars`);
  };

  const handleAudioPlay = (): void => {
    try {
      if (audioState.isPlaying) {
        audioControls.pause();
      } else if (audioState.isPaused) {
        audioControls.resume();
      } else {
        // Show controls immediately for better UX
        setShowAudioControls(true);
        audioControls.play();
      }
    } catch (error) {
      // Error already logged by errorHandler
      errorHandler.logError(
        'Audio playback failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'ModulePage',
          action: 'audio_play',
        },
      );
      toast.error('Audio playback failed. Please try again.');
      setShowAudioControls(false);
    }
  };

  const handleAudioStop = (): void => {
    try {
      audioControls.stop();
      setShowAudioControls(false);
    } catch (error) {
      errorHandler.logError(
        '[ModulePage] Audio stop failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'ModulePage',
          action: 'audio_stop',
        },
      );
      setShowAudioControls(false);
    }
  };

  const handlePrint = (): void => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${module.title} - ${course.title}</title>
            <style>
              body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #2c3e50; }
              h2 { color: #34495e; margin-top: 30px; }
              p { line-height: 1.6; margin-bottom: 15px; }
              .metadata { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="metadata">
              <strong>Course:</strong> ${course.title}<br>
              <strong>Module:</strong> ${module.title}<br>
              <strong>Estimated Time:</strong> ${module.estimatedTime} minutes<br>
              <strong>Printed:</strong> ${new Date().toLocaleDateString()}
            </div>
            <h1>${module.title}</h1>
            <p><em>${module.description}</em></p>
            ${module.content.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.+)/g, '<h2>$1</h2>')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Access denied view
  if (!hasAccess) {
    const plan = course.tier === 'advanced' ? 'Advanced' : 'Expert';
    const price = course.tier === 'advanced' ? '$1.99/month' : '$4.99/month';

    return (
      <div className='min-h-screen bg-background'>
        <div className='max-w-4xl mx-auto p-6'>
          <Button variant='outline' onClick={handleBackToCourses} className='mb-6'>
            <ArrowLeft className='mr-2' />
            Back to Courses
          </Button>

          <Card className='text-center p-8'>
            <CardContent>
              <div className='mb-6'>
                <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <BookOpen className='w-8 h-8 text-primary' />
                </div>
                <h1 className='text-2xl font-bold mb-2'>Upgrade Required</h1>
                <p className='text-lg text-muted-foreground'>
                  This module is part of the {plan} course ({price})
                </p>
              </div>

              <div className='bg-muted/50 rounded-lg p-6 mb-6'>
                <h2 className='text-xl font-semibold mb-2'>{module.title}</h2>
                <p className='text-muted-foreground mb-4'>{module.description}</p>
                <div className='flex items-center justify-center gap-4 text-sm'>
                  <span className='flex items-center gap-1'>
                    <Clock className='w-4 h-4' />
                    {module.estimatedTime} min
                  </span>
                  <Badge variant='secondary'>{course.tier.toUpperCase()}</Badge>
                </div>
              </div>

              <div className='space-y-3'>
                <Button size='lg' className='w-full max-w-sm'>
                  Upgrade to {plan} Plan
                </Button>
                <Button variant='outline' onClick={handleBackToCourses}>
                  Browse Free Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentModuleIndex = course.modules.findIndex((m) => m.id === moduleId);
  const progressPercentage = courseProgress
    ? Math.round((courseProgress.completedModules.length / course.totalModules) * 100)
    : 0;

  return (
    <div className='min-h-screen bg-background'>
      {/* Skip navigation */}
      <a href='#main-content' className='skip-nav'>
        Skip to main content
      </a>

      <div className='max-w-6xl mx-auto p-6'>
        {/* Header Navigation */}
        <div className='mb-6'>
          <Button variant='outline' onClick={handleBackToCourse} className='mb-4'>
            <ArrowLeft className='mr-2' />
            Back to Course
          </Button>

          {/* Breadcrumb */}
          <nav aria-label='Breadcrumb' className='mb-4'>
            <ol className='flex items-center space-x-2 text-sm text-muted-foreground'>
              <li>
                <button onClick={handleBackToCourse} className='hover:text-foreground'>
                  {course.title}
                </button>
              </li>
              <li>/</li>
              <li className='text-foreground font-medium'>
                Module {currentModuleIndex + 1}: {module.title}
              </li>
            </ol>
          </nav>

          {/* Module Header */}
          <div className='flex items-start justify-between flex-wrap gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <Badge variant={course.tier === 'free' ? 'secondary' : 'default'}>
                  {course.tier.toUpperCase()}
                </Badge>
                <span className='flex items-center gap-1 text-muted-foreground'>
                  <Clock className='w-4 h-4' />
                  {module.estimatedTime} min
                </span>
                {isCompleted && (
                  <Badge variant='outline' className='text-green-700 border-green-700'>
                    <CheckCircle className='w-3 h-3 mr-1' />
                    Completed
                  </Badge>
                )}
              </div>
              <h1 id='main-content' className='text-3xl font-bold mb-2'>
                {module.title}
              </h1>
              <p className='text-lg text-muted-foreground'>{module.description}</p>
            </div>

            {/* Quick Actions */}
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handlePrint}>
                <Printer className='w-4 h-4 mr-2' />
                Print
              </Button>
              <Button variant='outline' size='sm' onClick={() => setShowOutline(!showOutline)}>
                <List className='w-4 h-4 mr-2' />
                Outline
              </Button>
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-4 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-3 space-y-6'>
            {/* Course Progress */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>Course Progress</span>
                  <span className='text-sm text-muted-foreground'>
                    {courseProgress?.completedModules.length ?? 0} of {course.totalModules} modules
                  </span>
                </div>
                <Progress value={progressPercentage} className='h-2' />
              </CardContent>
            </Card>

            {/* Audio Controls */}
            <AudioControlsErrorBoundary
              onError={() => {
                setShowAudioControls(false);
                try {
                  audioControls.stop();
                } catch (error) {
                  // Silent cleanup error - audio already errored
                  errorHandler.logError(
                    'Audio cleanup failed in error boundary',
                    error instanceof Error ? error : new Error(String(error)),
                    {
                      component: 'ModulePage',
                      action: 'audio_error_boundary_cleanup',
                    },
                  );
                }
              }}
            >
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      <SpeakerHigh className='w-5 h-5' />
                      Audio Narration
                    </CardTitle>
                    {audioState.isSupported ? (
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleAudioPlay}
                          aria-label={audioState.isPlaying ? 'Pause narration' : 'Play narration'}
                        >
                          {audioState.isPlaying ? (
                            <Pause className='w-4 h-4' />
                          ) : (
                            <Play className='w-4 h-4' />
                          )}
                          {audioState.isPlaying ? 'Pause' : audioState.isPaused ? 'Resume' : 'Play'}
                        </Button>
                        {audioState.isPlaying && (
                          <Button variant='outline' size='sm' onClick={handleAudioStop}>
                            <Stop className='w-4 h-4' />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge variant='secondary'>Not Supported</Badge>
                    )}
                  </div>
                  {audioState.isSupported && (
                    <p className='text-sm text-muted-foreground'>
                      Estimated listening time: {estimatedSpeechTime} minute
                      {estimatedSpeechTime !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardHeader>

                {showAudioControls && audioState.isSupported && (
                  <CardContent className='space-y-4'>
                    {((): ReactElement => {
                      try {
                        // Ensure values are properly initialized
                        const rate =
                          typeof audioState.rate === 'number' && !isNaN(audioState.rate)
                            ? audioState.rate
                            : 1;
                        const volume =
                          typeof audioState.volume === 'number' && !isNaN(audioState.volume)
                            ? audioState.volume
                            : 1;

                        return (
                          <>
                            <div>
                              <label className='text-sm font-medium mb-2 block'>
                                Speed: {rate.toFixed(1)}x
                              </label>
                              <Slider
                                value={[rate]}
                                onValueChange={([newRate]) => {
                                  try {
                                    audioControls.setRate(newRate);
                                  } catch (error) {
                                    if (import.meta.env.DEV) {
                                      console.error('Failed to set audio rate:', error);
                                    }
                                    errorHandler.logError(
                                      'Failed to set audio rate',
                                      error instanceof Error ? error : new Error(String(error)),
                                      {
                                        component: 'ModulePage',
                                        action: 'set_audio_rate',
                                      },
                                    );
                                  }
                                }}
                                min={0.5}
                                max={2}
                                step={0.1}
                                className='w-full'
                                aria-label='Adjust playback speed'
                              />
                            </div>
                            <div>
                              <label className='text-sm font-medium mb-2 block'>
                                Volume: {Math.round(volume * 100)}%
                              </label>
                              <Slider
                                value={[volume]}
                                onValueChange={([newVolume]) => {
                                  try {
                                    audioControls.setVolume(newVolume);
                                  } catch (error) {
                                    if (import.meta.env.DEV) {
                                      console.error('Failed to set audio volume:', error);
                                    }
                                    errorHandler.logError(
                                      'Failed to set audio volume',
                                      error instanceof Error ? error : new Error(String(error)),
                                      {
                                        component: 'ModulePage',
                                        action: 'set_audio_volume',
                                      },
                                    );
                                  }
                                }}
                                min={0}
                                max={1}
                                step={0.1}
                                className='w-full'
                                aria-label='Adjust volume'
                              />
                            </div>
                          </>
                        );
                      } catch (error) {
                        errorHandler.logError(
                          'Error rendering audio controls',
                          error instanceof Error ? error : new Error(String(error)),
                          {
                            component: 'ModulePage',
                            action: 'render_audio_controls',
                          },
                        );
                        return (
                          <div className='text-center p-4 text-muted-foreground'>
                            <p>Audio controls temporarily unavailable</p>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowAudioControls(false);
                                audioControls.stop();
                              }}
                              className='mt-2'
                            >
                              Close Controls
                            </Button>
                          </div>
                        );
                      }
                    })()}
                  </CardContent>
                )}
              </Card>
            </AudioControlsErrorBoundary>

            {/* Module Content */}
            <Card>
              <CardContent className='p-6'>
                <article className='prose prose-lg max-w-none'>
                  <div
                    className='text-lg leading-relaxed space-y-4'
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {module.content}
                  </div>
                </article>
              </CardContent>
            </Card>

            {/* Module Actions */}
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between flex-wrap gap-4'>
                  <div>
                    {!isCompleted ? (
                      <Button
                        onClick={handleMarkComplete}
                        size='lg'
                        className='flex items-center gap-2'
                      >
                        <CheckCircle className='w-5 h-5' />
                        Mark as Complete
                      </Button>
                    ) : (
                      <div className='flex items-center gap-2 text-green-700'>
                        <CheckCircle className='w-5 h-5' weight='fill' />
                        <span className='font-medium text-lg'>Completed!</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className='flex items-center gap-2'>
                    {previousModule && (
                      <Button
                        variant='outline'
                        onClick={() => handleNavigateToModule(courseId, previousModule.id)}
                      >
                        <ArrowLeft className='w-4 h-4 mr-2' />
                        Previous
                      </Button>
                    )}
                    {nextModule && (
                      <Button onClick={() => handleNavigateToModule(courseId, nextModule.id)}>
                        Next
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating and Comments */}
            <div className='grid md:grid-cols-2 gap-6'>
              {/* Rating */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Star className='w-5 h-5' />
                    Rate This Module
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-1 mb-4'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRating(star)}
                        className='p-2 h-auto'
                        aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-6 h-6 ${star <= currentRating ? 'text-yellow-500' : 'text-gray-300'}`}
                          weight={star <= currentRating ? 'fill' : 'regular'}
                        />
                      </Button>
                    ))}
                  </div>
                  {currentRating > 0 && (
                    <p className='text-sm text-muted-foreground'>
                      You rated this module {currentRating} star
                      {currentRating !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ChatCircle className='w-5 h-5' />
                    Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder='Share your thoughts about this module...'
                      rows={3}
                    />
                    <Button
                      onClick={() => {
                        if (comment.trim()) {
                          toast.success('Thank you for your feedback!');
                          setComment('');
                        }
                      }}
                      disabled={!comment.trim()}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Course Outline */}
            <Card className={showOutline ? 'block' : 'hidden lg:block'}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <List className='w-5 h-5' />
                  Course Outline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <nav aria-label='Course modules'>
                  <ul className='space-y-2'>
                    {course.modules.map((mod, index) => {
                      const modCompleted = isModuleCompleted(courseId, mod.id);
                      const isCurrent = mod.id === moduleId;

                      return (
                        <li key={mod.id}>
                          <button
                            onClick={() => handleNavigateToModule(courseId, mod.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              isCurrent ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                            aria-current={isCurrent ? 'page' : undefined}
                          >
                            <div className='flex items-start gap-2'>
                              <div className='mt-1'>
                                {modCompleted ? (
                                  <CheckCircle className='w-4 h-4 text-green-600' weight='fill' />
                                ) : (
                                  <div className='w-4 h-4 rounded-full border-2 border-muted-foreground' />
                                )}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium text-sm truncate'>
                                  {index + 1}. {mod.title}
                                </p>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {mod.estimatedTime} min
                                </p>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </CardContent>
            </Card>

            {/* Module Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <ChartBar className='w-5 h-5' />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>Time in module</span>
                    <span>{timeSpent} min</span>
                  </div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>Estimated time</span>
                    <span>{module.estimatedTime} min</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>Course progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className='h-2' />
                </div>

                {moduleProgress && (
                  <>
                    <Separator />
                    <div className='text-sm space-y-1'>
                      <div className='flex justify-between'>
                        <span>Attempts</span>
                        <span>{moduleProgress.attempts}</span>
                      </div>
                      {moduleProgress.rating && (
                        <div className='flex justify-between'>
                          <span>Your rating</span>
                          <div className='flex items-center gap-1'>
                            <StarFour className='w-3 h-3 text-yellow-500' weight='fill' />
                            <span>{moduleProgress.rating}/5</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {module.tags && module.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {module.tags.map((tag) => (
                      <Badge key={tag} variant='secondary' className='text-xs'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
