import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  Star
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface DashboardPageProps {
  onNavigate: (page: string) => void
}

const COURSES = [
  {
    id: 'free-course',
    title: 'AI Basics for Beginners',
    tier: 'free' as const,
    modules: ['free-1', 'free-2', 'free-3', 'free-4']
  },
  {
    id: 'advanced-course',
    title: 'AI Tools Mastery',
    tier: 'advanced' as const,
    modules: ['adv-1', 'adv-2', 'adv-3', 'adv-4']
  },
  {
    id: 'expert-course',
    title: 'Advanced AI Mastery',
    tier: 'expert' as const,
    modules: ['exp-1', 'exp-2', 'exp-3', 'exp-4']
  }
]

const MODULE_TITLES: Record<string, string> = {
  'free-1': 'What is Artificial Intelligence?',
  'free-2': 'AI Safety and Privacy',
  'free-3': 'Your First AI Conversation',
  'free-4': 'Practical AI Applications',
  'adv-1': 'Prompt Engineering Basics',
  'adv-2': 'AI for Health Management',
  'adv-3': 'Financial AI Applications',
  'adv-4': 'Monthly AI Updates',
  'exp-1': 'Autonomous AI Systems',
  'exp-2': 'Model Context Protocol (MCP)',
  'exp-3': 'Custom AI Assistants',
  'exp-4': 'Cutting-Edge AI Trends'
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useKV<Record<string, boolean>>('module-progress', {})

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              Please sign in to view your learning progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('home')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getAvailableCourses = () => {
    return COURSES.filter(course => {
      if (course.tier === 'free') return true
      if (course.tier === 'advanced' && (user.tier === 'advanced' || user.tier === 'expert')) return true
      if (course.tier === 'expert' && user.tier === 'expert') return true
      return false
    })
  }

  const getCourseProgress = (courseModules: string[]) => {
    const completedModules = courseModules.filter(moduleId => progress[moduleId]).length
    return (completedModules / courseModules.length) * 100
  }

  const getOverallProgress = () => {
    const availableCourses = getAvailableCourses()
    const totalModules = availableCourses.reduce((sum, course) => sum + course.modules.length, 0)
    const completedModules = availableCourses.reduce((sum, course) => {
      return sum + course.modules.filter(moduleId => progress[moduleId]).length
    }, 0)
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0
  }

  const getNextLesson = () => {
    const availableCourses = getAvailableCourses()
    
    for (const course of availableCourses) {
      for (const moduleId of course.modules) {
        if (!progress[moduleId]) {
          return {
            courseId: course.id,
            moduleId,
            title: MODULE_TITLES[moduleId],
            courseTitle: course.title
          }
        }
      }
    }
    return null
  }

  const getCompletedModules = () => {
    return Object.keys(progress).filter(moduleId => progress[moduleId])
  }

  const getStreakDays = () => {
    // Simplified streak calculation - in a real app, you'd track daily activity
    const completedCount = getCompletedModules().length
    return Math.min(completedCount, 7) // Max 7-day streak for demo
  }

  const availableCourses = getAvailableCourses()
  const overallProgress = getOverallProgress()
  const nextLesson = getNextLesson()
  const completedModules = getCompletedModules()
  const streakDays = getStreakDays()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-lg text-muted-foreground">
          Continue your AI learning journey
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
              </div>
              <TrendingUp weight="regular" className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Modules</p>
                <p className="text-2xl font-bold">{completedModules.length}</p>
              </div>
              <CheckCircle weight="regular" className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Streak</p>
                <p className="text-2xl font-bold">{streakDays} days</p>
              </div>
              <Award weight="regular" className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subscription</p>
                <p className="text-2xl font-bold capitalize">{user.tier}</p>
              </div>
              <Star weight="regular" className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Lesson */}
          {nextLesson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen weight="regular" />
                  Continue Learning
                </CardTitle>
                <CardDescription>
                  Pick up where you left off
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{nextLesson.title}</h3>
                    <p className="text-muted-foreground">{nextLesson.courseTitle}</p>
                  </div>
                  <Button 
                    onClick={() => onNavigate('courses')}
                    className="flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight weight="regular" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>
                Track your progress across all available courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {availableCourses.map((course) => {
                  const courseProgress = getCourseProgress(course.modules)
                  const completedInCourse = course.modules.filter(moduleId => progress[moduleId]).length
                  
                  return (
                    <div key={course.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{course.title}</h3>
                          <Badge variant={course.tier === 'free' ? 'secondary' : 'default'}>
                            {course.tier.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {completedInCourse}/{course.modules.length} modules
                        </span>
                      </div>
                      <Progress value={courseProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(courseProgress)}% complete
                      </p>
                    </div>
                  )
                })}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6"
                onClick={() => onNavigate('courses')}
              >
                View All Courses
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Subscription</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={user.tier === 'free' ? 'secondary' : 'default'}>
                    {user.tier.toUpperCase()}
                  </Badge>
                  {user.tier === 'free' && (
                    <Button size="sm" variant="outline">
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <p className="text-sm">{new Date(user.joinDate).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          {completedModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award weight="regular" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedModules.slice(0, 3).map((moduleId) => (
                    <div key={moduleId} className="flex items-center gap-2">
                      <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                      <span className="text-sm">{MODULE_TITLES[moduleId]}</span>
                    </div>
                  ))}
                  {completedModules.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{completedModules.length - 3} more completed
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar weight="regular" />
                Learning Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Try to complete one module every few days to maintain your learning momentum. 
                Remember, you can always re-watch modules to reinforce your understanding!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}