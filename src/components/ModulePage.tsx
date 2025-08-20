import { useState, useEffect, useRef, type ReactElement, type ElementType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CheckCircle,
  BookOpen,
  Clock,
  Star,
  ChatCircle,
  ArrowLeft,
  ArrowRight,
  List,
  ChartBar,
  Printer,
  StarFour,
  CaretDown,
  CaretRight,
  Lightbulb,
  Shield,
  Warning,
  Brain,
  Heart,
  Sparkle,
  Trophy,
  Target,
  Rocket,
  CheckSquare,
  Square,
  Play,
  Pause,
  Stop,
  SpeakerHigh,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Callout, CalloutTitle, CalloutDescription } from '@/components/ui/callout';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TierBadge } from '@/components/ui/tier-badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import {
  getCourseById,
  getModuleById,
  getNextModule,
  getPreviousModule,
  getPartById,
  getNextPart,
  getPreviousPart,
} from '@/lib/courseData';
import { getAudioPlaylist } from '@/lib/audioMapping';
import { useMP3AudioPlayer } from '@/hooks/useMP3AudioPlayer';

interface ModulePageProps {
  courseType?: 'basic' | 'advanced' | 'expert';
}

export function ModulePage({ courseType: propCourseType }: ModulePageProps): ReactElement {
  const {
    courseType: paramCourseType,
    moduleId: paramModuleId,
    partId: paramPartId,
  } = useParams<{
    courseType: string;
    moduleId: string;
    partId?: string;
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

  // Determine course type, module ID, and part ID from props or URL params
  const courseType = (propCourseType ?? paramCourseType) as keyof typeof courseTypeToId;
  const courseId = courseTypeToId[courseType];
  const moduleId = paramModuleId ?? null;
  const partId = paramPartId ?? null;

  // Get course, module, and part data (may be null)
  const course = getCourseById(courseId);
  const module = moduleId ? getModuleById(courseId, moduleId) : null;
  const currentPart = partId && moduleId ? getPartById(courseId, moduleId, partId) : null;
  const nextModule = moduleId ? getNextModule(courseId, moduleId) : null;
  const previousModule = moduleId ? getPreviousModule(courseId, moduleId) : null;
  const nextPart = partId && moduleId ? getNextPart(courseId, moduleId, partId) : null;
  const previousPart = partId && moduleId ? getPreviousPart(courseId, moduleId, partId) : null;
  const courseProgress = getCourseProgress(courseId);
  const moduleProgress = moduleId ? getModuleProgress(courseId, moduleId) : null;

  // Module interaction state
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentRating, setCurrentRating] = useState(moduleProgress?.rating ?? 0);
  const [comment, setComment] = useState('');
  const [startTime, setStartTime] = useState(Date.now());
  const [showOutline, setShowOutline] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(moduleId ? [moduleId] : []),
  );
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Audio system

  const audioPlaylist = getAudioPlaylist(moduleId ?? '', partId ?? undefined);
  const [audioState, audioControls] = useMP3AudioPlayer(audioPlaylist);

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

  // Auto-expand current module when viewing it or its parts
  useEffect(() => {
    if (moduleId) {
      setExpandedModules(new Set([moduleId]));
    }
  }, [moduleId]);

  // Stop audio when component unmounts or when navigating away
  useEffect(() => {
    return (): void => {
      // Cleanup: stop audio when leaving the module page
      // This will only run when moduleId or partId changes (actual navigation)

      audioControls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, partId]); // Only depend on route params, not audio state

  // If viewing a module with parts but no specific part, redirect to first part
  useEffect(() => {
    if (module?.parts && module.parts.length > 0 && !partId) {
      const firstPart = module.parts[0];
      void navigate(`/courses/${courseType}/module/${moduleId}/part/${firstPart.id}`, {
        replace: true,
      });
    }
  }, [module, partId, courseType, moduleId, navigate]);

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
    };
    // Dependencies for cleanup effect
  }, [timeSpent]);

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

  const handleNavigateToPart = (targetPartId: string): void => {
    if (courseType && moduleId) {
      void navigate(`/courses/${courseType}/module/${moduleId}/part/${targetPartId}`);
    }
  };

  const handleMarkComplete = (): void => {
    const finalTimeSpent = Math.max(timeSpent, 1); // At least 1 minute
    completeModule(courseId, moduleId, finalTimeSpent, currentRating || undefined);
    toast.success('Module completed! 🎉', {
      description: 'Great job! Your progress has been saved.',
    });
  };

  const handleRating = (rating: number): void => {
    setCurrentRating(rating);
    rateModule(courseId, moduleId, rating);
    toast.success(`Rated ${rating} star${rating !== 1 ? 's' : ''}`);
  };

  const handlePrint = (): void => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Determine what to print - part or entire module
      let contentToPrint = '';
      let titleToPrint = '';
      let descriptionToPrint = '';
      let estimatedTimeToPrint = 0;

      if (currentPart) {
        // Print only current part
        titleToPrint = `${module.title} - ${currentPart.title}`;
        descriptionToPrint = currentPart.description;
        contentToPrint = currentPart.content;
        estimatedTimeToPrint = currentPart.estimatedTime;
      } else if (module.parts && module.parts.length > 0) {
        // Print entire module with all parts
        titleToPrint = module.title;
        descriptionToPrint = module.description;
        estimatedTimeToPrint = module.parts.reduce((total, part) => total + part.estimatedTime, 0);

        // Combine module content and all parts
        contentToPrint = module.content;
        module.parts.forEach((part, index) => {
          contentToPrint += `\n\n## Part ${index + 1}: ${part.title}\n\n${part.description}\n\n${part.content}`;
        });
      } else {
        // Print module content only (legacy modules without parts)
        titleToPrint = module.title;
        descriptionToPrint = module.description;
        contentToPrint = module.content;
        estimatedTimeToPrint = module.estimatedTime;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${titleToPrint} - ${course.title}</title>
            <style>
              body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #2c3e50; }
              h2 { color: #34495e; margin-top: 30px; }
              p { line-height: 1.6; margin-bottom: 15px; }
              .metadata { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
              .part-divider { border-top: 2px solid #e0e0e0; margin: 30px 0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="metadata">
              <strong>Course:</strong> ${course.title}<br>
              <strong>Module:</strong> ${titleToPrint}<br>
              <strong>Estimated Time:</strong> ${estimatedTimeToPrint} minutes<br>
              <strong>Printed:</strong> ${new Date().toLocaleDateString()}
            </div>
            <h1>${titleToPrint}</h1>
            <p><em>${descriptionToPrint}</em></p>
            <div class="part-divider"></div>
            ${contentToPrint.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.+)/g, '<h2>$1</h2>')}
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
                  Browse Basic Content
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
              <li>
                {currentPart ? (
                  <button
                    onClick={() => void navigate(`/courses/${courseType}/module/${moduleId}`)}
                    className='hover:text-foreground'
                  >
                    Module {currentModuleIndex + 1}: {module.title}
                  </button>
                ) : (
                  <span className='text-foreground font-medium'>
                    Module {currentModuleIndex + 1}: {module.title}
                  </span>
                )}
              </li>
              {currentPart && (
                <>
                  <li>/</li>
                  <li className='text-foreground font-medium'>{currentPart.title}</li>
                </>
              )}
            </ol>
          </nav>

          {/* Module Header */}
          <div className='flex items-start justify-between flex-wrap gap-4 transition-all duration-200 hover:shadow-sm'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <TierBadge tier={course.tier} showIcon={true} />
                <span className='flex items-center gap-1 text-muted-foreground'>
                  <Clock className='w-4 h-4' />
                  {currentPart ? currentPart.estimatedTime : module.estimatedTime} min
                </span>
                {isCompleted && (
                  <Badge variant='outline' className='text-green-700 border-green-700'>
                    <CheckCircle className='w-3 h-3 mr-1' />
                    Completed
                  </Badge>
                )}
              </div>
              <h1 id='main-content' className='text-3xl font-bold mb-2'>
                {currentPart ? currentPart.title : module.title}
              </h1>
              <p className='text-lg text-muted-foreground'>
                {currentPart ? currentPart.description : module.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className='flex items-center gap-2'>
              <Button
                variant='default'
                size='sm'
                onClick={handlePrint}
                className='transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2'
              >
                <Printer className='w-4 h-4 mr-2' />
                Print
              </Button>
              <Button
                variant='default'
                size='sm'
                onClick={() => setShowOutline(!showOutline)}
                className='transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2'
              >
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
            <Card className='transition-all duration-200 hover:shadow-lg border-2 border-gray-900  shadow-md bg-gradient-to-br from-blue-50/50 to-cyan-50/30  '>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium flex items-center gap-2 text-foreground'>
                    <ChartBar className='w-4 h-4 text-primary' />
                    Course Progress
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {courseProgress?.completedModules.length ?? 0} of {course.totalModules} modules
                  </span>
                </div>
                <Progress value={progressPercentage} className='h-3 bg-gray-200 ' />
                <div className='flex items-center justify-between mt-2'>
                  <span className='text-xs text-muted-foreground'>Keep going!</span>
                  <span className='text-xs font-semibold text-primary'>{progressPercentage}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Audio Controls - Enhanced */}
            {audioState.hasAudio && (
              <Card className='relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'>
                {/* Animated Background Elements */}
                <div className='absolute inset-0 opacity-30 pointer-events-none'>
                  <div className='absolute top-4 left-4 w-24 h-24 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-2xl animate-pulse' />
                  <div className='absolute bottom-4 right-4 w-28 h-28 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full blur-2xl animate-pulse delay-1000' />
                  {audioState.isPlaying && (
                    <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-3xl animate-pulse' />
                  )}
                </div>
                {!prefersReducedMotion && (
                  <div className='absolute inset-0 opacity-30 pointer-events-none'>
                    <div className='absolute top-4 left-4 w-24 h-24 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-2xl animate-pulse' />
                    <div className='absolute bottom-4 right-4 w-28 h-28 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full blur-2xl animate-pulse delay-1000' />
                    {audioState.isPlaying && (
                      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-3xl animate-pulse' />
                    )}
                  </div>
                )}
                {/* Optionally, you could add a static fallback for reduced motion users */}
                <CardHeader className='relative'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-3'>
                      <div className='relative'>
                        <div className='absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur-lg opacity-60' />
                        <div className='relative bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md'>
                          <SpeakerHigh className='w-6 h-6 text-purple-600' weight='duotone' />
                        </div>
                      </div>
                      <span className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                        Audio Narration
                      </span>
                      {audioState.isPlaying && (
                        <div className='flex items-center gap-1'>
                          <div className='w-1 h-3 bg-purple-500 rounded-full animate-pulse' />
                          <div className='w-1 h-5 bg-pink-500 rounded-full animate-pulse delay-75' />
                          <div className='w-1 h-4 bg-orange-500 rounded-full animate-pulse delay-150' />
                          <div className='w-1 h-6 bg-purple-500 rounded-full animate-pulse delay-200' />
                          <div className='w-1 h-3 bg-pink-500 rounded-full animate-pulse delay-300' />
                        </div>
                      )}
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        onClick={() => {
                          if (audioState.isPlaying) {
                            audioControls.pause();
                          } else {
                            audioControls.play();
                          }
                        }}
                        aria-label={audioState.isPlaying ? 'Pause narration' : 'Play narration'}
                        disabled={audioState.isLoading}
                        className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0'
                      >
                        {audioState.isPlaying ? (
                          <Pause className='w-4 h-4 mr-2' weight='fill' />
                        ) : (
                          <Play className='w-4 h-4 mr-2' weight='fill' />
                        )}
                        {audioState.isLoading
                          ? 'Loading...'
                          : audioState.isPlaying
                            ? 'Pause'
                            : audioState.isPaused
                              ? 'Resume'
                              : 'Play'}
                      </Button>
                      {(audioState.isPlaying || audioState.isPaused) && (
                        <Button
                          size='sm'
                          onClick={audioControls.stop}
                          className='bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0'
                        >
                          <Stop className='w-4 h-4' weight='fill' />
                        </Button>
                      )}
                    </div>
                  </div>
                  {audioState.currentFile && (
                    <div className='mt-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg'>
                      <p className='text-sm font-medium text-purple-700 flex items-center gap-2'>
                        <Sparkle className='w-4 h-4 text-purple-500' weight='duotone' />
                        Now Playing:{' '}
                        <span className='font-bold'>{audioState.currentFile.title}</span>
                        {audioPlaylist && audioPlaylist.files.length > 1 && (
                          <Badge className='ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
                            Track {audioState.currentFileIndex + 1} of {audioPlaylist.files.length}
                          </Badge>
                        )}
                      </p>
                    </div>
                  )}
                  {audioState.error && (
                    <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                      <p className='text-sm font-medium text-red-700 flex items-center gap-2'>
                        <Warning className='w-4 h-4' />
                        Audio Error: {audioState.error}
                      </p>
                    </div>
                  )}
                </CardHeader>
              </Card>
            )}

            {/* Module/Part Content */}
            <Card className='transition-all duration-300 hover:shadow-lg border border-border shadow-md'>
              <CardContent className='p-8 space-y-6'>
                {/* Dynamic Welcome Banner for Introduction */}
                {module.id === 'introduction' && (
                  <div className='relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 p-8 text-white shadow-xl'>
                    <div className='absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl' />
                    <div className='relative z-10'>
                      <Sparkle className='w-12 h-12 mb-4' weight='fill' />
                      <h2 className='text-3xl font-bold mb-2'>Welcome to Your AI Journey!</h2>
                      <p className='text-lg opacity-95'>
                        Let&apos;s explore the world of AI together, step by step.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submodule-specific Key Concept Callout (color by module, content by part) */}
                {((): ReactElement | null => {
                  interface Concept {
                    title: string;
                    description: string;
                  }
                  const concepts: Record<string, Record<string, Concept>> = {
                    // Module 1: Understanding AI (blue)
                    'understanding-ai': {
                      'ai-in-simple-terms': {
                        title: 'Core Understanding',
                        description:
                          'AI is an advanced pattern-recognition tool. It learns from many examples to spot patterns and make predictions — it does not truly think or feel like a person.',
                      },
                      'everyday-ai-you-use': {
                        title: 'You Already Use AI',
                        description:
                          'From streaming picks and spam filters to maps and fraud alerts, AI works quietly in the background to make daily tools more helpful — no tech expertise required.',
                      },
                      'what-ai-can-cant-do': {
                        title: 'Know the Limits',
                        description:
                          "AI is great at patterns, language, and ideas — but it isn't a doctor or lawyer, has no feelings or real-world memory, and can be confidently wrong. Verify important things.",
                      },
                    },
                    // Module 2: Staying Safe with AI (red)
                    'staying-safe-ai': {
                      'recognizing-ai-scams': {
                        title: 'Scam Defense Basics',
                        description:
                          'Expect voice cloning and deepfakes. Use a family code word, hang up and call back on a known number, and never send urgent payments by gift card, wire, or crypto.',
                      },
                      'privacy-personal-information': {
                        title: 'Protect Your Information',
                        description:
                          'Never share SSN, account numbers, passwords, or detailed IDs with AI. Share general interests only. Use strong passwords, two‑factor authentication, and separate emails.',
                      },
                      'fact-checking-verification': {
                        title: 'Verify Before You Trust',
                        description:
                          'AI can “hallucinate.” For health, finance, legal, and news topics, check multiple reliable sources and build a simple personal verification routine.',
                      },
                    },
                    // Module 3: Your First AI Conversation (green)
                    'first-ai-conversation': {
                      'getting-started-chatgpt': {
                        title: 'Start Simple, Stay Secure',
                        description:
                          'The free version is fine to begin. Use strong, unique passwords and 2FA. Conversations are saved — begin with small, easy questions to build comfort.',
                      },
                      'writing-effective-prompts': {
                        title: 'Better Prompts, Better Answers',
                        description:
                          'Be specific, provide context, ask for the format you want, and follow up. Treat it like a conversation you refine step by step.',
                      },
                      'practice-conversations': {
                        title: 'Practice Builds Confidence',
                        description:
                          'Use real interests to practice. Celebrate small wins, iterate on prompts, and remember — AI is patient and you can’t “break” it by asking.',
                      },
                    },
                    // Module 4: AI for Daily Life (purple)
                    'ai-daily-life': {
                      'health-wellness-support': {
                        title: 'Health Helper — Not a Doctor',
                        description:
                          'Use AI to organize questions, decode terms, and plan gentle routines, but always make medical decisions with your healthcare professionals.',
                      },
                      'family-social-connections': {
                        title: 'Communicate With Heart',
                        description:
                          'Draft warm notes, plan gatherings, and bridge generations. Personalize tone and details so messages sound like you.',
                      },
                      'hobbies-personal-growth': {
                        title: 'Grow Your Interests',
                        description:
                          'Ask AI for simple project ideas, learning plans, travel tips, and organization help. Set small goals and build enjoyable routines.',
                      },
                    },
                  };

                  const palettes: Record<
                    string,
                    {
                      container: string;
                      title: string;
                      text: string;
                      icon: string;
                      Icon: ElementType;
                    }
                  > = {
                    'understanding-ai': {
                      container: 'bg-blue-500/20 border border-blue-400/30',
                      title: 'text-blue-900',
                      text: 'text-blue-800',
                      icon: 'text-blue-400',
                      Icon: Brain,
                    },
                    'staying-safe-ai': {
                      container: 'bg-red-500/20 border border-red-400/30',
                      title: 'text-red-900',
                      text: 'text-red-800',
                      icon: 'text-red-400',
                      Icon: Shield,
                    },
                    'first-ai-conversation': {
                      container: 'bg-green-500/20 border border-green-400/30',
                      title: 'text-green-900',
                      text: 'text-green-800',
                      icon: 'text-green-400',
                      Icon: ChatCircle,
                    },
                    'ai-daily-life': {
                      container: 'bg-purple-500/20 border border-purple-400/30',
                      title: 'text-purple-900',
                      text: 'text-purple-800',
                      icon: 'text-purple-400',
                      Icon: Heart,
                    },
                  };

                  const currentConcept = concepts[module.id]?.[currentPart?.id ?? ''];
                  const palette = palettes[module.id];
                  if (!currentConcept || !palette) return null;
                  const IconComp = palette.Icon;

                  return (
                    <div
                      className={`${palette.container} backdrop-blur-lg p-6 rounded-xl shadow-2xl`}
                    >
                      <div className='flex items-start gap-4'>
                        <IconComp
                          className={`w-6 h-6 ${palette.icon} flex-shrink-0 mt-1`}
                          weight={
                            module.id === 'staying-safe-ai' || module.id === 'ai-daily-life'
                              ? 'fill'
                              : 'duotone'
                          }
                        />
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${palette.title}`}>
                            {currentConcept.title}
                          </h3>
                          <p className={`text-lg ${palette.text}`}>{currentConcept.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Remove extra top cards for cleaner single-callout header per submodule */}

                {/* Visual Divider */}
                <div className='relative py-4'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t-2 border-gradient-to-r from-transparent via-purple-300 to-transparent ' />
                  </div>
                  <div className='relative flex justify-center'>
                    <span className='bg-white  px-4'>
                      <Sparkle className='w-6 h-6 text-purple-500' weight='duotone' />
                    </span>
                  </div>
                </div>

                {/* Enhanced Main Content with Glass Typography */}
                <article className='prose prose-lg max-w-none'>
                  <div
                    className='text-lg leading-relaxed space-y-8 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:bg-gradient-to-r [&>h1]:from-blue-600 [&>h1]:to-purple-600 [&>h1]:bg-clip-text [&>h1]:text-transparent [&>h1]:mb-6 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:flex [&>h2]:items-center [&>h2]:gap-3 [&>h2]:before:content-[""] [&>h2]:before:w-1 [&>h2]:before:h-8 [&>h2]:before:bg-gradient-to-b [&>h2]:before:from-blue-600 [&>h2]:before:to-purple-600 [&>h2]:before:rounded-full [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:text-muted-foreground [&>p]:mb-6 [&>p]:leading-relaxed [&>ul]:space-y-3 [&>ul]:ml-4 [&>li]:text-muted-foreground [&>li]:flex [&>li]:items-start [&>li]:gap-3 [&>li]:before:content-["→"] [&>li]:before:text-blue-600 [&>li]:before:font-bold [&>li]:before:mt-0.5 [&>strong]:text-blue-600 [&>strong]:font-semibold [&>em]:text-purple-600 [&>em]:not-italic [&>em]:font-medium [&>blockquote]:border-l-4 [&>blockquote]:border-blue-600 [&>blockquote]:pl-6 [&>blockquote]:py-3 [&>blockquote]:bg-blue-500/10 [&>blockquote]:backdrop-blur-sm [&>blockquote]:rounded-r-lg [&>blockquote]:my-6 [&>blockquote]:italic [&>blockquote]:text-blue-700'
                    style={{
                      whiteSpace: 'pre-line',
                      lineHeight: '1.9',
                      fontSize: '1.125rem',
                    }}
                  >
                    {currentPart ? currentPart.content : module.content}
                  </div>
                </article>

                {/* Visual Divider */}
                <div className='relative py-4'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t-2 border-gradient-to-r from-transparent via-pink-300 to-transparent ' />
                  </div>
                  <div className='relative flex justify-center'>
                    <span className='bg-white  px-4'>
                      <Star className='w-6 h-6 text-pink-500' weight='duotone' />
                    </span>
                  </div>
                </div>

                {/* Dynamic Tips and Reminders */}
                {module.id === 'understanding-ai' && (
                  <Callout className='bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-lg p-6 rounded-xl shadow-2xl'>
                    <CalloutTitle className='flex items-center gap-2 text-lg font-semibold text-indigo-900'>
                      <Lightbulb className='w-5 h-5 text-indigo-400' weight='duotone' />
                      Remember
                    </CalloutTitle>
                    <CalloutDescription className='text-base mt-2 text-indigo-800'>
                      AI is a tool, just like a calculator or a dictionary. It&apos;s here to help
                      you, not replace your judgment!
                    </CalloutDescription>
                  </Callout>
                )}

                {module.id === 'first-ai-conversation' && (
                  <Callout className='bg-green-500/20 border border-green-400/30 backdrop-blur-lg p-6 rounded-xl shadow-2xl'>
                    <CalloutTitle className='flex items-center gap-2 text-lg font-semibold text-green-900'>
                      <Target className='w-5 h-5 text-green-400' weight='duotone' />
                      Pro Tip
                    </CalloutTitle>
                    <CalloutDescription className='text-base mt-2 text-green-800'>
                      Start with simple questions and gradually work your way up to more complex
                      conversations. There&apos;s no rush!
                    </CalloutDescription>
                  </Callout>
                )}

                {module.id === 'ai-daily-life' && (
                  <Callout className='bg-purple-500/20 border border-purple-400/30 backdrop-blur-lg p-6 rounded-xl shadow-2xl'>
                    <CalloutTitle className='flex items-center gap-2 text-lg font-semibold text-purple-900'>
                      <Rocket className='w-5 h-5 text-purple-400' weight='duotone' />
                      You&apos;re Ready!
                    </CalloutTitle>
                    <CalloutDescription className='text-base mt-2 text-purple-800'>
                      You now have practical knowledge to start using AI in your daily life.
                      Remember, the more you practice, the more comfortable you&apos;ll become!
                    </CalloutDescription>
                  </Callout>
                )}

                {module.id === 'conclusion' && (
                  <div className='bg-amber-500/20 border border-amber-400/30 backdrop-blur-lg rounded-xl p-6 shadow-2xl'>
                    <div className='flex items-start gap-4'>
                      <Trophy className='w-8 h-8 text-amber-400 flex-shrink-0 mt-1' weight='fill' />
                      <div>
                        <h3 className='text-xl font-bold text-amber-900 mb-2'>Congratulations!</h3>
                        <p className='text-lg text-amber-800'>
                          You&apos;ve completed the AI Basics course! You&apos;re now equipped with
                          the knowledge to use AI safely and effectively.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Checklist for Safety Module (moved to bottom for post-reading) */}
                {module.id === 'staying-safe-ai' && currentPart?.id === 'recognizing-ai-scams' && (
                  <div className='bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-md'>
                    <h4 className='text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2'>
                      <Warning className='w-6 h-6 text-amber-700' weight='duotone' />
                      Red Flag Checklist — Click to Check Off
                    </h4>
                    <div className='space-y-3'>
                      {[
                        'Urgency — "Act now or lose out!"',
                        'Too good to be true promises',
                        'Requests for personal information',
                        'Unprofessional grammar or spelling',
                        'Suspicious email addresses or links',
                      ].map((item, index) => (
                        <button
                          key={item}
                          onClick={() => {
                            const newChecked = new Set(checkedItems);
                            const itemId = `safety-${index}`;
                            if (newChecked.has(itemId)) {
                              newChecked.delete(itemId);
                            } else {
                              newChecked.add(itemId);
                            }
                            setCheckedItems(newChecked);
                          }}
                          className='flex items-center gap-3 p-3 bg-white/85 border border-amber-200 rounded-lg shadow-sm hover:shadow-md hover:bg-white transition-all duration-150 w-full text-left'
                        >
                          {checkedItems.has(`safety-${index}`) ? (
                            <CheckSquare className='w-5 h-5 text-green-700' weight='fill' />
                          ) : (
                            <Square className='w-5 h-5 text-amber-700' />
                          )}
                          <span
                            className={
                              checkedItems.has(`safety-${index}`)
                                ? 'line-through text-gray-500'
                                : 'text-amber-900'
                            }
                          >
                            {item}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Actions */}
            <Card className='transition-all duration-300 hover:shadow-lg border border-border shadow-md'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between flex-wrap gap-4'>
                  <div>
                    {!isCompleted ? (
                      <Button
                        onClick={handleMarkComplete}
                        size='lg'
                        className='flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
                    {/* Part Navigation (if viewing parts) */}
                    {currentPart && previousPart && (
                      <Button
                        variant='outline'
                        onClick={() => handleNavigateToPart(previousPart.id)}
                        className='transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      >
                        <ArrowLeft className='w-4 h-4 mr-2' />
                        Previous Part
                      </Button>
                    )}
                    {currentPart && nextPart && (
                      <Button
                        onClick={() => handleNavigateToPart(nextPart.id)}
                        className='transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      >
                        Next Part
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    )}

                    {/* Module Navigation (when not viewing parts or no more parts) */}
                    {!currentPart && previousModule && (
                      <Button
                        variant='outline'
                        onClick={() => handleNavigateToModule(courseId, previousModule.id)}
                      >
                        <ArrowLeft className='w-4 h-4 mr-2' />
                        Previous Module
                      </Button>
                    )}
                    {!currentPart && nextModule && (
                      <Button onClick={() => handleNavigateToModule(courseId, nextModule.id)}>
                        Next Module
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    )}

                    {/* Show next module if on last part */}
                    {currentPart && !nextPart && nextModule && (
                      <Button onClick={() => handleNavigateToModule(courseId, nextModule.id)}>
                        Next Module
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    )}

                    {/* Show previous module if on first part */}
                    {currentPart && !previousPart && previousModule && (
                      <Button
                        variant='outline'
                        onClick={() => handleNavigateToModule(courseId, previousModule.id)}
                      >
                        <ArrowLeft className='w-4 h-4 mr-2' />
                        Previous Module
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating and Comments */}
            <div className='grid md:grid-cols-2 gap-6'>
              {/* Rating */}
              <Card className='transition-all duration-200 hover:shadow-lg border-2 border-gray-900  shadow-md'>
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
              <Card className='transition-all duration-200 hover:shadow-lg border-2 border-gray-900  shadow-md'>
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
            <Card
              className={`${showOutline ? 'block' : 'hidden lg:block'} transition-all duration-200 hover:shadow-lg border-2 border-gray-900  shadow-md`}
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <List className='w-5 h-5' />
                  Course Outline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <nav aria-label='Course modules'>
                  <ul className='space-y-2'>
                    {course.modules.map((mod) => {
                      const modCompleted = isModuleCompleted(courseId, mod.id);
                      const isCurrent = mod.id === moduleId;
                      const hasPartsToShow = mod.parts && mod.parts.length > 0;
                      const isExpanded = expandedModules.has(mod.id);

                      const handleModuleClick = (): void => {
                        // Always navigate to the module
                        handleNavigateToModule(courseId, mod.id);
                      };

                      const handleKeyDown = (event: {
                        key: string;
                        preventDefault: () => void;
                      }): void => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleModuleClick();
                        }
                      };

                      return (
                        <li key={mod.id}>
                          <button
                            onClick={handleModuleClick}
                            onKeyDown={handleKeyDown}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              isCurrent ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                            aria-current={isCurrent ? 'page' : undefined}
                            aria-expanded={hasPartsToShow ? isExpanded : undefined}
                          >
                            <div className='flex items-start gap-2'>
                              <div className='mt-1 flex items-center gap-1'>
                                {hasPartsToShow &&
                                  (isExpanded ? (
                                    <CaretDown className='w-4 h-4' />
                                  ) : (
                                    <CaretRight className='w-4 h-4' />
                                  ))}
                                {modCompleted ? (
                                  <CheckCircle className='w-4 h-4 text-green-600' weight='fill' />
                                ) : !hasPartsToShow ? (
                                  <div className='w-4 h-4 rounded-full border-2 border-muted-foreground' />
                                ) : null}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium text-sm truncate'>{mod.title}</p>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {mod.estimatedTime} min
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Parts subsection */}
                          {hasPartsToShow && isExpanded && mod.parts && (
                            <div className='ml-6 mt-2 space-y-1 transition-all duration-200 ease-in-out'>
                              {mod.parts.map((part) => {
                                const isCurrentPart = currentPart?.id === part.id;
                                const isPartCompleted = part.isCompleted ?? false;

                                return (
                                  <button
                                    key={part.id}
                                    onClick={() => handleNavigateToPart(part.id)}
                                    className={`w-full text-left p-2 pl-5 rounded-md transition-colors text-sm ${
                                      isCurrentPart
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted/50'
                                    }`}
                                    aria-current={isCurrentPart ? 'page' : undefined}
                                  >
                                    <div className='flex items-start gap-2'>
                                      <div className='mt-0.5'>
                                        {isPartCompleted ? (
                                          <CheckCircle
                                            className='w-3 h-3 text-green-600'
                                            weight='fill'
                                          />
                                        ) : (
                                          <div className='w-3 h-3 rounded-full border border-muted-foreground' />
                                        )}
                                      </div>
                                      <div className='flex-1 min-w-0'>
                                        <p className='font-medium text-xs truncate'>
                                          {part.title}
                                          {isCurrentPart && ' [current]'}
                                        </p>
                                        <p className='text-xs text-muted-foreground mt-0.5'>
                                          {part.estimatedTime} min
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </CardContent>
            </Card>

            {/* Module Stats */}
            <Card className='transition-all duration-200 hover:shadow-lg border-2 border-gray-900  shadow-md bg-gradient-to-br from-purple-50/40 to-indigo-50/30  '>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg text-foreground'>
                  <ChartBar className='w-5 h-5 text-purple-500' />
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

                <div className='text-center'>
                  <ProgressRing
                    value={progressPercentage}
                    size={100}
                    color='purple'
                    label='Course'
                    animate={true}
                  />
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
              <Card className='transition-all duration-200 hover:shadow-lg border-2 border-gray-900  shadow-md'>
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
