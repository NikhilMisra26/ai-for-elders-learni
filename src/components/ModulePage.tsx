import React, { useState, useEffect, type ReactElement } from 'react';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Stop,
  CheckCircle,
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
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/lib/progressTracking';
import { useSubscription } from '@/lib/subscription';
import { ProtectedContent } from '@/components/ProtectedContent';
import { SecurityLogger } from '@/lib/security';
import {
  useAudioNarration,
  getEstimatedSpeechTime,
  announceToScreenReader,
} from '@/lib/audioNarration';
import {
  getCourseById,
  getModuleById,
  getNextModule,
  getPreviousModule,
} from '@/lib/courseData';

interface ModulePageProps {
  courseId: string;
  moduleId: string;
  onBack: () => void;
  onNavigate: (courseId: string, moduleId: string) => void;
}

export function ModulePage({
  courseId,
  moduleId,
  onBack,
  onNavigate,
}: ModulePageProps): ReactElement {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { canAccessTier: _canAccessTier } = useSubscription();
  const {
    completeModule,
    isModuleCompleted,
    rateModule,
    getCourseProgress,
    getModuleProgress,
    setCurrentModule,
  } = useProgress();

  // Get course and module data
  const course = getCourseById(courseId);
  const module = getModuleById(courseId, moduleId);
  const nextModule = getNextModule(courseId, moduleId);
  const previousModule = getPreviousModule(courseId, moduleId);
  const courseProgress = getCourseProgress(courseId);
  const moduleProgress = getModuleProgress(courseId, moduleId);

  // Audio narration state
  const [audioState, audioControls] = useAudioNarration(module?.content ?? '');
  const [showAudioControls, setShowAudioControls] = useState(false);

  // Module interaction state
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentRating, setCurrentRating] = useState(
    moduleProgress?.rating ?? 0,
  );
  const [comment, setComment] = useState('');
  const [startTime] = useState(Date.now());
  const [showOutline, setShowOutline] = useState(false);

  useEffect(() => {
    if (course && module) {
      setCurrentModule(courseId, moduleId);
    }
  }, [courseId, moduleId, course, module, setCurrentModule]);

  // Track time spent
  useEffect(() => {
    const interval = window.setInterval((): void => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 60000); // Update every minute

    return (): void => window.clearInterval(interval);
  }, [startTime]);

  // Handle component unmount to save progress
  useEffect(() => {
    return (): void => {
      if (timeSpent > 0) {
        // Auto-save time spent when leaving module
      }
    };
  }, [timeSpent]);

  if (!course || !module) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='max-w-md'>
          <CardContent className='p-6 text-center'>
            <h2 className='text-xl font-semibold mb-2'>Module Not Found</h2>
            <p className='text-muted-foreground mb-4'>
              The requested module could not be found.
            </p>
            <Button onClick={onBack}>Back to Courses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = isModuleCompleted(courseId, moduleId);
  const estimatedSpeechTime = getEstimatedSpeechTime(module.content);

  const handleMarkComplete = (): void => {
    const finalTimeSpent = Math.max(timeSpent, 1); // At least 1 minute
    completeModule(
      courseId,
      moduleId,
      finalTimeSpent,
      currentRating || undefined,
    );
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
    if (audioState.isPlaying) {
      audioControls.pause();
    } else if (audioState.isPaused) {
      audioControls.resume();
    } else {
      audioControls.play();
      setShowAudioControls(true);
    }
  };

  const handleAudioStop = (): void => {
    audioControls.stop();
    setShowAudioControls(false);
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

  const currentModuleIndex = course.modules.findIndex((m) => m.id === moduleId);
  const progressPercentage = courseProgress
    ? Math.round(
        (courseProgress.completedModules.length / course.totalModules) * 100,
      )
    : 0;

  // Add access denied callback to handle navigation back to courses with tracking
  const handleAccessDenied = (reason: string): void => {
    if (user) {
      SecurityLogger.log(
        'module_access_denied',
        {
          userId: user.id,
          courseId,
          moduleId,
          reason,
          requiredTier: course.tier,
        },
        'info',
      );
    }
    onBack();
  };

  return (
    <ProtectedContent
      courseId={courseId}
      moduleId={moduleId}
      requiredTier={course.tier}
      enforceServerSide={true}
      onAccessDenied={handleAccessDenied}
      showSkeleton={true}
    >
      <div className='min-h-screen bg-background'>
        {/* Skip navigation */}
        <a href='#main-content' className='skip-nav'>
          Skip to main content
        </a>

        <div className='max-w-6xl mx-auto p-6'>
          {/* Header Navigation */}
          <div className='mb-6'>
            <Button variant='outline' onClick={onBack} className='mb-4'>
              <ArrowLeft className='mr-2' />
              Back to Course
            </Button>

            {/* Breadcrumb */}
            <nav aria-label='Breadcrumb' className='mb-4'>
              <ol className='flex items-center space-x-2 text-sm text-muted-foreground'>
                <li>
                  <button onClick={onBack} className='hover:text-foreground'>
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
                  <Badge
                    variant={course.tier === 'free' ? 'secondary' : 'default'}
                  >
                    {course.tier.toUpperCase()}
                  </Badge>
                  <span className='flex items-center gap-1 text-muted-foreground'>
                    <Clock className='w-4 h-4' />
                    {module.estimatedTime} min
                  </span>
                  {isCompleted && (
                    <Badge
                      variant='outline'
                      className='text-green-700 border-green-700'
                    >
                      <CheckCircle className='w-3 h-3 mr-1' />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 id='main-content' className='text-3xl font-bold mb-2'>
                  {module.title}
                </h1>
                <p className='text-lg text-muted-foreground'>
                  {module.description}
                </p>
              </div>

              {/* Quick Actions */}
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={handlePrint}>
                  <Printer className='w-4 h-4 mr-2' />
                  Print
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowOutline(!showOutline)}
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
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium'>Course Progress</span>
                    <span className='text-sm text-muted-foreground'>
                      {courseProgress?.completedModules.length ?? 0} of{' '}
                      {course.totalModules} modules
                    </span>
                  </div>
                  <Progress value={progressPercentage} className='h-2' />
                </CardContent>
              </Card>

              {/* Audio Controls */}
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
                          aria-label={
                            audioState.isPlaying
                              ? 'Pause narration'
                              : 'Play narration'
                          }
                        >
                          {audioState.isPlaying ? (
                            <Pause className='w-4 h-4' />
                          ) : (
                            <Play className='w-4 h-4' />
                          )}
                          {audioState.isPlaying
                            ? 'Pause'
                            : audioState.isPaused
                              ? 'Resume'
                              : 'Play'}
                        </Button>
                        {audioState.isPlaying && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={handleAudioStop}
                          >
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
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Speed: {audioState.rate}x
                      </label>
                      <Slider
                        value={[audioState.rate]}
                        onValueChange={([rate]) => audioControls.setRate(rate)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className='w-full'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Volume: {Math.round(audioState.volume * 100)}%
                      </label>
                      <Slider
                        value={[audioState.volume]}
                        onValueChange={([volume]) =>
                          audioControls.setVolume(volume)
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className='w-full'
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

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
                          <span className='font-medium text-lg'>
                            Completed!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className='flex items-center gap-2'>
                      {previousModule && (
                        <Button
                          variant='outline'
                          onClick={() =>
                            onNavigate(courseId, previousModule.id)
                          }
                        >
                          <ArrowLeft className='w-4 h-4 mr-2' />
                          Previous
                        </Button>
                      )}
                      {nextModule && (
                        <Button
                          onClick={() => onNavigate(courseId, nextModule.id)}
                        >
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
                        const modCompleted = isModuleCompleted(
                          courseId,
                          mod.id,
                        );
                        const isCurrent = mod.id === moduleId;

                        return (
                          <li key={mod.id}>
                            <button
                              onClick={() => onNavigate(courseId, mod.id)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                isCurrent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                              aria-current={isCurrent ? 'page' : undefined}
                            >
                              <div className='flex items-start gap-2'>
                                <div className='mt-1'>
                                  {modCompleted ? (
                                    <CheckCircle
                                      className='w-4 h-4 text-green-600'
                                      weight='fill'
                                    />
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
                              <StarFour
                                className='w-3 h-3 text-yellow-500'
                                weight='fill'
                              />
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
                        <Badge
                          key={tag}
                          variant='secondary'
                          className='text-xs'
                        >
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
    </ProtectedContent>
  );
}
