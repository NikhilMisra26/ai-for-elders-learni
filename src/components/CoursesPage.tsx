import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { SecureRoute, usePermissions } from '@/components/SecureRoute'
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Lock, 
  Play,
  ArrowRight,
  Shield
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { ModulePage } from './ModulePage'

interface Module {
  id: string
  title: string
  description: string
  content: string
  videoUrl?: string
  duration: string
  completed: boolean
}

interface Course {
  id: string
  title: string
  description: string
  tier: 'free' | 'advanced' | 'expert'
  modules: Module[]
  price?: string
}

const COURSES: Course[] = [
  {
    id: 'free-course',
    title: 'AI Basics for Beginners',
    description: 'Learn the fundamentals of AI and how to use it safely in your daily life.',
    tier: 'free',
    modules: [
      {
        id: 'free-1',
        title: 'What is Artificial Intelligence?',
        description: 'Understanding AI basics and common misconceptions',
        content: 'Artificial Intelligence (AI) is a technology that helps computers think and learn like humans...',
        duration: '15 min',
        completed: false
      },
      {
        id: 'free-2',
        title: 'AI Safety and Privacy',
        description: 'How to use AI tools safely and protect your personal information',
        content: 'When using AI tools, always be cautious about sharing personal information...',
        duration: '20 min',
        completed: false
      },
      {
        id: 'free-3',
        title: 'Your First AI Conversation',
        description: 'Learning how to communicate effectively with AI assistants',
        content: 'Talking to AI is like having a conversation with a knowledgeable friend...',
        duration: '25 min',
        completed: false
      },
      {
        id: 'free-4',
        title: 'Practical AI Applications',
        description: 'Real-world ways AI can help with daily tasks',
        content: 'AI can help you in many practical ways: writing and editing emails...',
        duration: '30 min',
        completed: false
      }
    ]
  },
  {
    id: 'advanced-course',
    title: 'AI Tools Mastery',
    description: 'Master prompt engineering and explore AI applications for health and finance.',
    tier: 'advanced',
    price: '$1.99/month',
    modules: [
      {
        id: 'adv-1',
        title: 'Prompt Engineering Basics',
        description: 'Learn to write effective prompts for better AI responses',
        content: 'Prompt engineering is the art of asking AI the right questions...',
        duration: '35 min',
        completed: false
      },
      {
        id: 'adv-2',
        title: 'AI for Health Management',
        description: 'Using AI to track symptoms, medication reminders, and health questions',
        content: 'AI can help you organize health information and ask better questions...',
        duration: '40 min',
        completed: false
      },
      {
        id: 'adv-3',
        title: 'Financial AI Applications',
        description: 'Budgeting, expense tracking, and financial planning with AI',
        content: 'AI can assist with budgeting by categorizing expenses...',
        duration: '45 min',
        completed: false
      },
      {
        id: 'adv-4',
        title: 'Monthly AI Updates',
        description: 'Latest AI tools and features to enhance your daily life',
        content: 'The AI world moves quickly, with new tools and features...',
        duration: '30 min',
        completed: false
      }
    ]
  },
  {
    id: 'expert-course',
    title: 'Advanced AI Mastery',
    description: 'Explore autonomous AI, custom assistants, and cutting-edge applications.',
    tier: 'expert',
    price: '$4.99/month',
    modules: [
      {
        id: 'exp-1',
        title: 'Autonomous AI Systems',
        description: 'Understanding and managing AI that works independently',
        content: 'Autonomous AI systems can perform tasks without constant supervision...',
        duration: '50 min',
        completed: false
      },
      {
        id: 'exp-2',
        title: 'Model Context Protocol (MCP)',
        description: 'Advanced AI communication and integration techniques',
        content: 'Model Context Protocol (MCP) is a way for different AI systems...',
        duration: '55 min',
        completed: false
      },
      {
        id: 'exp-3',
        title: 'Custom AI Assistants',
        description: 'Creating personalized AI helpers for specific needs',
        content: 'Custom AI assistants are AI helpers trained for your specific needs...',
        duration: '60 min',
        completed: false
      },
      {
        id: 'exp-4',
        title: 'Cutting-Edge AI Trends',
        description: 'Stay ahead with the latest AI developments and applications',
        content: 'Explore the newest AI developments that could impact your daily life...',
        duration: '45 min',
        completed: false
      }
    ]
  }
]

interface CoursesPageProps {
  onAuthClick: () => void
}

export function CoursesPage({ onAuthClick }: CoursesPageProps) {
  const { user } = useAuth()
  const { canAccessCourse } = usePermissions()
  const [progress, setProgress] = useKV<Record<string, boolean>>('module-progress', {})
  const [selectedModule, setSelectedModule] = useState<{courseId: string, moduleId: string} | null>(null)

  if (selectedModule) {
    return (
      <ModulePage
        courseId={selectedModule.courseId}
        moduleId={selectedModule.moduleId}
        onBack={() => setSelectedModule(null)}
      />
    )
  }

  const getModuleProgress = (moduleId: string) => {
    return progress[moduleId] || false
  }

  const getCourseProgress = (course: Course) => {
    const completedModules = course.modules.filter(module => getModuleProgress(module.id)).length
    return (completedModules / course.modules.length) * 100
  }

  const handleModuleClick = (courseId: string, moduleId: string, course: Course) => {
    // Check access permissions
    if (!canAccessCourse(course.tier)) {
      if (!user) {
        onAuthClick()
        return
      }
      // Access will be handled by SecureRoute component
    }
    
    setSelectedModule({ courseId, moduleId })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Learning Courses</h1>
        <p className="text-lg text-muted-foreground">
          Choose your learning path and start mastering AI at your own pace
        </p>
      </div>

      <div className="space-y-8">
        {COURSES.map((course) => {
          const courseProgress = getCourseProgress(course)
          const hasAccess = canAccessCourse(course.tier)

          return (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{course.title}</CardTitle>
                      <Badge 
                        variant={course.tier === 'free' ? 'secondary' : 'default'}
                        className="text-sm"
                      >
                        {course.tier.toUpperCase()}
                      </Badge>
                      {course.price && (
                        <Badge variant="outline" className="text-sm">
                          {course.price}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      {course.description}
                    </CardDescription>
                  </div>
                  
                  {!hasAccess && (
                    <Lock weight="regular" className="text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </div>

                {hasAccess && courseProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(courseProgress)}% complete
                      </span>
                    </div>
                    <Progress value={courseProgress} className="h-2" />
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <SecureRoute 
                  requiredTier={course.tier}
                  onAuthRequired={onAuthClick}
                  fallback={
                    <div className="space-y-4">
                      {course.modules.map((module, index) => (
                        <div
                          key={module.id}
                          className="border rounded-lg p-4 opacity-60"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-lg">{module.title}</h3>
                                <Lock weight="regular" className="text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-muted-foreground mb-2">{module.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock weight="regular" />
                                  {module.duration}
                                </div>
                                <div className="flex items-center gap-1">
                                  <BookOpen weight="regular" />
                                  Module {index + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium mb-1">
                              {course.tier === 'advanced' ? 'Advanced' : 'Expert'} Subscription Required
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {course.price} to access all modules
                            </p>
                          </div>
                          <Button 
                            onClick={onAuthClick}
                            className="flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Subscribe
                            <ArrowRight weight="regular" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="grid gap-4">
                    {course.modules.map((module, index) => {
                      const isCompleted = getModuleProgress(module.id)
                      
                      return (
                        <div
                          key={module.id}
                          className="border rounded-lg p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleModuleClick(course.id, module.id, course)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-lg">{module.title}</h3>
                                {isCompleted && (
                                  <CheckCircle weight="fill" className="text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-muted-foreground mb-2">{module.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock weight="regular" />
                                  {module.duration}
                                </div>
                                <div className="flex items-center gap-1">
                                  <BookOpen weight="regular" />
                                  Module {index + 1}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <Button
                                variant={isCompleted ? "outline" : "default"}
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle weight="regular" />
                                    Review
                                  </>
                                ) : (
                                  <>
                                    <Play weight="regular" />
                                    Start
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </SecureRoute>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!user && (
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to Start Learning?</h3>
            <p className="text-muted-foreground mb-4">
              Create your free account to access the beginner course and track your progress
            </p>
            <Button onClick={onAuthClick} size="lg" className="px-8">
              <Shield className="h-4 w-4 mr-2" />
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}