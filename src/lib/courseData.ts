export interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedTime: number; // in minutes
  order: number;
  isCompleted?: boolean;
  rating?: number;
  videoUrl?: string;
  audioUrl?: string;
  tags: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  tier: 'free' | 'advanced' | 'expert';
  price: number;
  modules: Module[];
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  estimatedTotalTime: number;
  features: string[];
  isLocked: boolean;
}

export interface UserProgress {
  courseId: string;
  moduleId: string;
  completedAt: string;
  rating?: number;
  timeSpent: number;
}

export interface UserSubscriptionTier {
  tier: 'free' | 'advanced' | 'expert';
  startDate: string;
  endDate?: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  paymentMethod?: string;
  nextBillingDate?: string;
  gracePeriodEnd?: string;
}

// Course content data - placeholders for now as requested
export const courseData: Record<string, Course> = {
  'ai-basics': {
    id: 'ai-basics',
    title: 'DISCOVER BASICS: AI for Everyday Life',
    description:
      'Learn the fundamentals of AI technology with practical, real-world examples designed specifically for people over 50.',
    tier: 'free',
    price: 0,
    totalModules: 4,
    completedModules: 0,
    progressPercentage: 0,
    estimatedTotalTime: 80, // 20 minutes per module
    isLocked: false,
    features: [
      'Introduction to AI concepts',
      'Practical daily applications',
      'Safety and privacy guidance',
      'No technical background required',
    ],
    modules: [
      {
        id: 'what-is-ai',
        title: 'What is AI, Really?',
        description:
          'Understand AI as your smart assistant with everyday examples like Netflix, GPS, and voice assistants.',
        content: `# What is AI, Really?

## Introduction

Artificial Intelligence, or AI, might sound complicated, but it's actually something you already use every day! Think of AI as a very smart assistant that helps make your life easier.

## AI in Your Daily Life

**Netflix Recommendations**: When Netflix suggests a movie you might enjoy, that's AI learning from what you've watched before.

**GPS Navigation**: Your phone's map app uses AI to find the fastest route, considering traffic and road closures.

**Voice Assistants**: When you ask Siri or Alexa a question, AI helps them understand your voice and find the answer.

## Margaret's Story

Margaret, a 68-year-old from Phoenix, was initially intimidated by the term "Artificial Intelligence." But when her daughter explained that her smart thermostat was using AI to learn her preferences and save energy, Margaret realized she'd been benefiting from AI for months without knowing it!

## Key Takeaways

- AI is like having a smart helper that learns your preferences
- You're probably already using AI in apps and devices
- AI is designed to make technology work better for you
- You don't need to understand how it works to benefit from it

## Safety Reminder

✅ **Remember**: AI is a tool to help you, but always use your good judgment. Never share personal information like passwords or Social Security numbers with AI chatbots.`,
        estimatedTime: 20,
        order: 1,
        tags: ['beginner', 'introduction', 'safety'],
      },
      {
        id: 'first-conversation',
        title: 'Your First AI Conversation',
        description:
          'Learn natural conversation techniques with AI instead of using keyword searches.',
        content: `# Your First AI Conversation

## Introduction

Talking to AI is different from searching Google. Instead of typing keywords, you can have a natural conversation!

## The Difference: Keywords vs. Conversation

**Old way (keyword search)**: "weather Phoenix Arizona"
**New way (AI conversation)**: "What's the weather like in Phoenix today? Should I bring a jacket?"

## Tips for Better AI Conversations

1. **Be specific**: Instead of "recipes," try "I need a simple dinner recipe for two people that takes less than 30 minutes"
2. **Ask follow-up questions**: AI remembers what you just talked about
3. **Be polite**: Saying "please" and "thank you" isn't required, but it feels natural

## Robert's Success Story

Robert, 72, wanted to plan a garden but didn't know where to start. Instead of searching "gardening tips," he asked ChatGPT: "I'm a beginner who wants to start a small vegetable garden in Colorado. What vegetables are easiest to grow, and when should I plant them?" The AI gave him specific advice for his location and experience level.

## Practice Exercise

Try having this conversation with an AI:
1. "I want to cook a healthy meal for my grandchildren when they visit"
2. When the AI responds, ask: "What if one of them doesn't like vegetables?"
3. Then ask: "Can you give me a simple recipe I can make?"

## Safety Reminder

⚠️ **Important**: Never share personal details like your full address, phone number, or financial information in AI conversations.`,
        estimatedTime: 20,
        order: 2,
        tags: ['conversation', 'practice', 'tips'],
      },
      {
        id: 'daily-tasks',
        title: 'AI for Daily Tasks',
        description:
          'Discover how AI can help with health management, family communication, hobbies, and daily organization.',
        content: `# AI for Daily Tasks

## Introduction

AI can be your personal assistant for many everyday activities. Let's explore practical ways to use AI in your daily routine.

## Health Management

**Medication Reminders**: Ask AI to help you create a medication schedule
**Symptom Tracking**: "Help me track my blood pressure readings this week"
**Doctor Visit Prep**: "I'm seeing my doctor about knee pain. What questions should I ask?"

## Family Communication

**Email Writing**: "Help me write a friendly email to my daughter about visiting for the holidays"
**Social Media**: "What's a nice way to wish my grandson happy birthday on Facebook?"
**Letters and Cards**: "Help me write a thank you note for the lovely dinner"

## Hobbies and Interests

**Recipe Ideas**: "I have chicken, rice, and vegetables. What can I make for dinner?"
**Travel Planning**: "I want to visit my sister in Florida. What should I know about driving there?"
**Learning New Skills**: "I want to learn to use my smartphone better. Where should I start?"

## Daily Organization

**To-Do Lists**: "Help me organize my tasks for this week"
**Shopping Lists**: "I'm making Thanksgiving dinner for 8 people. What should I buy?"
**Schedule Management**: "I have three appointments next week. Help me organize my time"

## Success Story: Linda's Weekly Planning

Linda, 65, uses AI every Sunday to plan her week. She asks: "I have a doctor's appointment Tuesday, lunch with friends Thursday, and need to grocery shop. How should I organize my week to be most efficient?" The AI helps her group errands and suggests the best days for each activity.

## Pro Tips

✅ Be specific about your needs and preferences
✅ Ask AI to explain things step-by-step
✅ Request reminders about important safety considerations
✅ Use AI to break down complex tasks into simple steps

## Safety Reminder

🔒 **Remember**: Use AI for planning and organizing, but never share sensitive information like bank account numbers, passwords, or Social Security numbers.`,
        estimatedTime: 20,
        order: 3,
        tags: ['practical', 'daily-life', 'organization'],
      },
      {
        id: 'staying-safe',
        title: 'Staying Safe with AI',
        description: 'Essential privacy rules, how to spot AI mistakes, and avoiding scams.',
        content: `# Staying Safe with AI

## Introduction

While AI is a powerful tool, it's important to use it safely and understand its limitations. Let's learn how to protect yourself while getting the most benefit from AI.

## Privacy Rules You Should Always Follow

### Never Share These with AI:
- ❌ Social Security number
- ❌ Bank account or credit card numbers
- ❌ Passwords or PINs
- ❌ Full home address
- ❌ Medicare or insurance ID numbers

### Safe to Share:
- ✅ General location (city, state)
- ✅ Hobbies and interests
- ✅ General health questions (not specific medical records)
- ✅ Learning goals and preferences

## Spotting AI Mistakes

AI is very smart, but it's not perfect. Here's how to double-check:

**Medical Advice**: AI can provide general health information, but always confirm with your doctor
**Financial Information**: Verify investment or insurance advice with trusted professionals
**Recent Events**: AI might not know about very recent news or changes
**Personal Situations**: AI gives general advice - consider your specific circumstances

## Common AI Scams to Avoid

### Red Flags:
🚨 **Urgent requests for money or personal information**
🚨 **Claims that "AI has found something wrong" with your accounts**
🚨 **Fake AI "doctors" or "financial advisors" asking for personal details**
🚨 **Too-good-to-be-true investment opportunities**

### How to Stay Safe:
1. **Verify independently**: If AI tells you something important, check with another source
2. **Use official websites**: Only use AI on trusted platforms like OpenAI's ChatGPT
3. **Trust your instincts**: If something feels wrong, it probably is
4. **Ask family or friends**: When in doubt, ask someone you trust

## Helen's Safety Story

Helen, 69, received an email claiming "AI detected suspicious activity" on her bank account and asking her to click a link. Instead of clicking, she called her bank directly. It was a scam! The bank thanked her for being cautious.

## Building Good Habits

✅ **Always think before sharing information**
✅ **Use AI from reputable sources only**
✅ **Double-check important advice with trusted professionals**
✅ **Log out of AI platforms when you're done**
✅ **Keep your conversations general, not personal**

## Getting Help When You Need It

- If you're unsure about an AI response, ask a family member or friend
- Contact your bank directly if you receive any financial "alerts"
- Trust your local doctor over AI for medical decisions
- When in doubt, don't share personal information

## Final Thoughts

AI is like any tool - incredibly useful when used properly and safely. By following these guidelines, you can enjoy the benefits of AI while protecting your privacy and security.

Remember: You're in control. AI is there to help you, not to make decisions for you.`,
        estimatedTime: 20,
        order: 4,
        tags: ['safety', 'privacy', 'scams', 'security'],
      },
    ],
  },
  'ai-assistant': {
    id: 'ai-assistant',
    title: 'DISCOVER Advanced: Personal AI Assistant',
    description:
      'Learn advanced techniques to make AI work better for you with better prompting, useful tools, and practical applications.',
    tier: 'advanced',
    price: 1.99,
    totalModules: 4,
    completedModules: 0,
    progressPercentage: 0,
    estimatedTotalTime: 100,
    isLocked: true,
    features: [
      'Advanced prompting techniques',
      'Practical AI tools and apps',
      'Health and finance applications',
      'Monthly updates and new tools',
    ],
    modules: [
      {
        id: 'better-prompting',
        title: 'Better Prompting Techniques',
        description:
          'Master the art of asking AI better questions through specificity, role-playing, and follow-up techniques.',
        content:
          '# Better Prompting Techniques\n\n[Placeholder content for Advanced Course Module 1]\n\nThis module will cover:\n- How to be more specific in your requests\n- Role-playing techniques with AI\n- Asking effective follow-up questions\n- Getting better results from AI conversations',
        estimatedTime: 25,
        order: 1,
        tags: ['advanced', 'prompting', 'techniques'],
      },
      {
        id: 'ai-tools-apps',
        title: 'AI Tools and Apps',
        description:
          'Explore voice assistants, health apps, financial helpers, and memory aids that can improve your daily life.',
        content:
          '# AI Tools and Apps\n\n[Placeholder content for Advanced Course Module 2]\n\nThis module will cover:\n- Voice assistants (Siri, Alexa, Google)\n- Health and wellness apps\n- Financial management tools\n- Memory and organization aids',
        estimatedTime: 25,
        order: 2,
        tags: ['tools', 'apps', 'voice-assistants'],
      },
      {
        id: 'health-finance',
        title: 'Health & Finance Applications',
        description:
          'Learn how AI can help prepare for doctor visits, manage budgets, and compare insurance options.',
        content:
          '# Health & Finance Applications\n\n[Placeholder content for Advanced Course Module 3]\n\nThis module will cover:\n- Preparing for medical appointments\n- Budget planning and expense tracking\n- Insurance comparison and selection\n- Managing prescriptions and health records',
        estimatedTime: 25,
        order: 3,
        tags: ['health', 'finance', 'insurance'],
      },
      {
        id: 'monthly-updates',
        title: 'Monthly AI Updates',
        description:
          'Stay current with the latest AI tools, safety updates, and new features that can benefit you.',
        content:
          '# Monthly AI Updates\n\n[Placeholder content for Advanced Course Module 4]\n\nThis module will cover:\n- Latest AI tool releases\n- Safety and security updates\n- New features in popular AI platforms\n- Trending applications for seniors',
        estimatedTime: 25,
        order: 4,
        tags: ['updates', 'news', 'safety'],
      },
    ],
  },
  'advanced-ai': {
    id: 'advanced-ai',
    title: 'DISCOVER EXPERT: Cutting-Edge AI',
    description:
      'Master cutting-edge AI technologies including autonomous agents, custom assistants, and the latest developments for people over 50.',
    tier: 'expert',
    price: 4.99,
    totalModules: 4,
    completedModules: 0,
    progressPercentage: 0,
    estimatedTotalTime: 120,
    isLocked: true,
    features: [
      'Autonomous AI agents',
      'Model Context Protocol (MCP)',
      'Custom AI assistant creation',
      'Cutting-edge updates and ethics',
    ],
    modules: [
      {
        id: 'autonomous-agents',
        title: 'Autonomous AI Agents',
        description:
          'Understand AI that can complete multi-step tasks independently and how to use them safely.',
        content:
          '# Autonomous AI Agents\n\n[Placeholder content for Expert Course Module 1]\n\nThis module will cover:\n- What are autonomous AI agents\n- Multi-step task automation\n- Safety considerations and limitations\n- Practical applications for people over 50',
        estimatedTime: 30,
        order: 1,
        tags: ['expert', 'autonomous', 'agents'],
      },
      {
        id: 'mcp-protocol',
        title: 'Model Context Protocol (MCP)',
        description: 'Learn how to safely connect AI to your personal data and applications.',
        content:
          '# Model Context Protocol (MCP)\n\n[Placeholder content for Expert Course Module 2]\n\nThis module will cover:\n- Understanding MCP technology\n- Safe data connections\n- Privacy and security considerations\n- Practical implementation examples',
        estimatedTime: 30,
        order: 2,
        tags: ['mcp', 'data', 'privacy'],
      },
      {
        id: 'custom-assistants',
        title: 'Custom AI Assistants',
        description:
          'Create personalized AI assistants tailored to your specific needs and workflows.',
        content:
          '# Custom AI Assistants\n\n[Placeholder content for Expert Course Module 3]\n\nThis module will cover:\n- Personalizing AI responses\n- Creating custom workflows\n- Fine-tuning for your needs\n- Automation and efficiency',
        estimatedTime: 30,
        order: 3,
        tags: ['custom', 'personalization', 'workflows'],
      },
      {
        id: 'cutting-edge',
        title: 'Cutting-Edge Updates',
        description:
          'Stay ahead with the latest AI developments, ethics discussions, and community involvement.',
        content:
          '# Cutting-Edge Updates\n\n[Placeholder content for Expert Course Module 4]\n\nThis module will cover:\n- Latest AI breakthroughs\n- Ethical considerations\n- Community involvement opportunities\n- Future of AI technology',
        estimatedTime: 30,
        order: 4,
        tags: ['updates', 'ethics', 'future'],
      },
    ],
  },
};

// Constants for tier ordering
export const TIER_ORDER = { free: 1, advanced: 2, expert: 3 } as const;

// Helper functions for course management
export const getCourseById = (courseId: string): Course | undefined => {
  return courseData[courseId];
};

export const getModuleById = (courseId: string, moduleId: string): Module | undefined => {
  const course = getCourseById(courseId);
  return course?.modules.find((module) => module.id === moduleId);
};

// Start of removed/added code for subscription removal
export const getAvailableCourses = (_userTier: 'free' | 'advanced' | 'expert'): Course[] => {
  // Removed for subscription removal: original tier-based filtering
  /*
  const userLevel = TIER_ORDER[userTier];

  return Object.values(courseData).filter((course) => {
    const courseLevel = TIER_ORDER[course.tier];
    return courseLevel <= userLevel;
  });
  */
  // Added for subscription removal: only return free courses
  return Object.values(courseData).filter((course) => {
    return course.tier === 'free';
  });
};
// End of removed/added code for subscription removal

// Start of removed/added code for subscription removal
export const isModuleAccessible = (
  course: Course,
  _module: Module,
  _userTier: 'free' | 'advanced' | 'expert',
): boolean => {
  // Removed for subscription removal: original tier-based access logic
  /*
  if (course.tier === 'free') return true;
  return TIER_ORDER[userTier] >= TIER_ORDER[course.tier];
  */
  // Added for subscription removal: only allow access to free courses
  return course.tier === 'free';
};
// End of removed/added code for subscription removal

export const calculateCourseProgress = (courseId: string, completedModules: string[]): number => {
  const course = getCourseById(courseId);
  if (!course) return 0;

  const completed = completedModules.filter((moduleId) =>
    course.modules.some((module) => module.id === moduleId),
  ).length;

  return Math.round((completed / course.totalModules) * 100);
};

export const getNextModule = (courseId: string, currentModuleId: string): Module | null => {
  const course = getCourseById(courseId);
  if (!course) return null;

  const currentIndex = course.modules.findIndex((module) => module.id === currentModuleId);
  if (currentIndex === -1 || currentIndex === course.modules.length - 1) return null;

  return course.modules[currentIndex + 1];
};

export const getPreviousModule = (courseId: string, currentModuleId: string): Module | null => {
  const course = getCourseById(courseId);
  if (!course) return null;

  const currentIndex = course.modules.findIndex((module) => module.id === currentModuleId);
  if (currentIndex <= 0) return null;

  return course.modules[currentIndex - 1];
};
