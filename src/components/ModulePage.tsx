import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useAccessibility } from '@/contexts/AccessibilityContext'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  BookOpen, 
  Clock,
  Star,
  MessageCircle
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

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
        content: 'Artificial Intelligence (AI) is a technology that helps computers think and learn like humans. It\'s not science fiction - it\'s here today and can help you with everyday tasks like writing emails, finding information, and organizing your schedule. AI is like having a very smart assistant that never gets tired and is always ready to help.',
        duration: '15 min',
        completed: false
      },
      {
        id: 'free-2',
        title: 'AI Safety and Privacy',
        description: 'How to use AI tools safely and protect your personal information',
        content: 'When using AI tools, always be cautious about sharing personal information like your full name, address, phone number, or financial details. Think of AI as a helpful stranger - you can ask for advice and assistance, but you wouldn\'t share your most private information. Always verify important information AI gives you, especially for health or financial decisions.',
        duration: '20 min',
        completed: false
      },
      {
        id: 'free-3',
        title: 'Your First AI Conversation',
        description: 'Learning how to communicate effectively with AI assistants',
        content: 'Talking to AI is like having a conversation with a knowledgeable friend. Be clear and specific about what you want. Instead of saying "help me," try "help me write a thank you note to my neighbor." The more specific you are, the better help you\'ll receive. Don\'t worry about being perfect - AI is patient and you can always ask for clarification.',
        duration: '25 min',
        completed: false
      },
      {
        id: 'free-4',
        title: 'Practical AI Applications',
        description: 'Real-world ways AI can help with daily tasks',
        content: 'AI can help you in many practical ways: writing and editing emails, creating shopping lists, planning trips, learning new recipes, organizing photos, and even video calling family members. Start with simple tasks and gradually try more complex ones as you become comfortable. Remember, AI is a tool to enhance your capabilities, not replace your judgment.',
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
        content: 'Prompt engineering is the art of asking AI the right questions in the right way. A good prompt includes context, specific instructions, and examples when helpful. Instead of "make this better," try "rewrite this email to sound more friendly and professional for my doctor\'s office." The key is being specific about what you want and how you want it delivered.',
        duration: '35 min',
        completed: false
      },
      {
        id: 'adv-2',
        title: 'AI for Health Management',
        description: 'Using AI to track symptoms, medication reminders, and health questions',
        content: 'AI can help you organize health information and ask better questions during doctor visits. You can use AI to track symptoms, set medication reminders, and research health topics. However, never use AI for medical diagnosis or treatment decisions - always consult your healthcare provider. AI is excellent for organizing your health information and preparing for medical appointments.',
        duration: '40 min',
        completed: false
      },
      {
        id: 'adv-3',
        title: 'Financial AI Applications',
        description: 'Budgeting, expense tracking, and financial planning with AI',
        content: 'AI can assist with budgeting by categorizing expenses, suggesting cost-saving measures, and helping you understand financial concepts. You can ask AI to explain investment terms, help create a monthly budget, or analyze spending patterns. Remember to never share specific account numbers or passwords with AI tools, and always verify financial advice with qualified professionals.',
        duration: '45 min',
        completed: false
      },
      {
        id: 'adv-4',
        title: 'Monthly AI Updates',
        description: 'Latest AI tools and features to enhance your daily life',
        content: 'The AI world moves quickly, with new tools and features released regularly. This module covers the latest user-friendly AI applications, updates to existing tools you might be using, and emerging technologies that could benefit your daily routine. We focus on practical, accessible tools that don\'t require technical expertise.',
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
        content: 'Autonomous AI systems can perform tasks without constant supervision, like smart home systems that adjust temperature based on your preferences, or email filters that organize your inbox. Learning to set up and monitor these systems can save time and improve your daily routine. We\'ll cover how to set boundaries, monitor performance, and maintain control over autonomous AI helpers.',
        duration: '50 min',
        completed: false
      },
      {
        id: 'exp-2',
        title: 'Model Context Protocol (MCP)',
        description: 'Advanced AI communication and integration techniques',
        content: 'Model Context Protocol (MCP) is a way for different AI systems to work together seamlessly. Think of it as teaching your various AI tools to communicate with each other. This allows for more sophisticated workflows, like having your calendar AI coordinate with your email AI to suggest meeting times. We\'ll explore practical applications without getting too technical.',
        duration: '55 min',
        completed: false
      },
      {
        id: 'exp-3',
        title: 'Custom AI Assistants',
        description: 'Creating personalized AI helpers for specific needs',
        content: 'Custom AI assistants are AI helpers trained for your specific needs and preferences. You can create an AI assistant that knows your writing style, understands your schedule preferences, or specializes in your hobbies. We\'ll guide you through user-friendly platforms that let you customize AI behavior without programming, focusing on practical applications for daily life.',
        duration: '60 min',
        completed: false
      },
      {
        id: 'exp-4',
        title: 'Cutting-Edge AI Trends',
        description: 'Stay ahead with the latest AI developments and applications',
        content: 'Explore the newest AI developments that could impact your daily life, from AI-powered healthcare tools to smart transportation systems. We focus on emerging technologies that are becoming accessible to everyday users, explaining their potential benefits and considerations. This module is updated monthly to keep you informed about the rapidly evolving AI landscape.',
        duration: '45 min',
        completed: false
      }
    ]
  }
]

interface ModulePageProps {
  courseId: string
  moduleId: string
  onBack: () => void
}

export function ModulePage({ courseId, moduleId, onBack }: ModulePageProps) {
  const { user } = useAuth()
  const { speakText, stopSpeaking, isSpeaking } = useAccessibility()
  const [progress, setProgress] = useKV<Record<string, boolean>>('module-progress', {})
  const [ratings, setRatings] = useKV<Record<string, number>>('module-ratings', {})
  const [comments, setComments] = useKV<Record<string, string[]>>('module-comments', {})
  const [newComment, setNewComment] = useState('')
  const [currentRating, setCurrentRating] = useState(0)

  const course = COURSES.find(c => c.id === courseId)
  const module = course?.modules.find(m => m.id === moduleId)

  if (!course || !module) {
    return <div>Module not found</div>
  }

  const hasAccess = course.tier === 'free' || 
    (course.tier === 'advanced' && (user?.tier === 'advanced' || user?.tier === 'expert')) ||
    (course.tier === 'expert' && user?.tier === 'expert')

  const isCompleted = progress[moduleId] || false
  const moduleRating = ratings[moduleId] || 0
  const moduleComments = comments[moduleId] || []

  const handleMarkComplete = () => {
    setProgress(currentProgress => ({
      ...currentProgress,
      [moduleId]: true
    }))
  }

  const handleRating = (rating: number) => {
    setCurrentRating(rating)
    setRatings(currentRatings => ({
      ...currentRatings,
      [moduleId]: rating
    }))
  }

  const handleComment = () => {
    if (newComment.trim()) {
      setComments(currentComments => ({
        ...currentComments,
        [moduleId]: [...(currentComments[moduleId] || []), newComment.trim()]
      }))
      setNewComment('')
    }
  }

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speakText(module.content)
    }
  }

  if (!hasAccess) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">
              This module requires a {course.tier} subscription to access.
            </p>
            <Button onClick={onBack}>Back to Courses</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Back to Course
        </Button>
        <div className="flex items-center gap-4 mb-2">
          <Badge variant={course.tier === 'free' ? 'secondary' : 'default'}>
            {course.tier.toUpperCase()}
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock weight="regular" />
            {module.duration}
          </span>
        </div>
        <h1 id="main-content">{module.title}</h1>
        <p className="text-lg text-muted-foreground mt-2">{module.description}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Module Content</CardTitle>
            <Button
              variant="outline"
              onClick={handleSpeak}
              className="flex items-center gap-2"
              aria-label={isSpeaking ? "Stop audio narration" : "Start audio narration"}
            >
              {isSpeaking ? <Pause weight="regular" /> : <Play weight="regular" />}
              {isSpeaking ? 'Stop Audio' : 'Listen'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg leading-relaxed mb-6">
            {module.content}
          </div>
          
          {module.videoUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Video Content</h3>
              <div className="bg-muted p-4 rounded-lg text-center">
                <BookOpen size={48} className="mx-auto mb-2 text-muted-foreground" />
                <p>Video content would be embedded here</p>
                <p className="text-sm text-muted-foreground">URL: {module.videoUrl}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {!isCompleted ? (
              <Button 
                onClick={handleMarkComplete}
                className="flex items-center gap-2"
              >
                <CheckCircle weight="regular" />
                Mark as Complete
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle weight="fill" />
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star weight="regular" />
              Rate This Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRating(star)}
                  className="p-1"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star 
                    weight={star <= (currentRating || moduleRating) ? "fill" : "regular"}
                    className="text-yellow-500"
                  />
                </Button>
              ))}
            </div>
            {(currentRating || moduleRating) > 0 && (
              <p className="text-sm text-muted-foreground">
                You rated this module {currentRating || moduleRating} star{(currentRating || moduleRating) === 1 ? '' : 's'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle weight="regular" />
              Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this module..."
                  className="w-full p-3 border border-input rounded-md resize-none"
                  rows={3}
                  id="comment-input"
                />
                <Button 
                  onClick={handleComment}
                  className="mt-2"
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
              
              <div className="space-y-2">
                {moduleComments.length > 0 ? (
                  moduleComments.map((comment, index) => (
                    <div key={index} className="p-3 bg-muted rounded-md">
                      <p>{comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}