export interface ModulePart {
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
  parts?: ModulePart[]; // Optional subsections for modules
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

// Course content data
export const courseData: Record<string, Course> = {
  'ai-basics': {
    id: 'ai-basics',
    title: 'DISCOVER BASICS: AI for Everyday Life',
    description:
      'Learn the fundamentals of AI technology with practical, real-world examples designed specifically for people over 50.',
    tier: 'free',
    price: 0,
    totalModules: 6,
    completedModules: 0,
    progressPercentage: 0,
    estimatedTotalTime: 90, // Introduction (10) + 4 main modules (15 each) + Conclusion (5)
    isLocked: false,
    features: [
      'Introduction to AI concepts',
      'Practical daily applications',
      'Safety and privacy guidance',
      'No technical background required',
    ],
    modules: [
      {
        id: 'introduction',
        title: 'Introduction: Welcome to Your AI Journey',
        description:
          'A friendly introduction to artificial intelligence designed specifically for people over 50.',
        content: `# Introduction: Welcome to Your AI Journey

Welcome to the fascinating world of Artificial Intelligence! If you're reading this, you're about to embark on an exciting journey that will show you how AI can make your daily life easier and more enjoyable. Don't worry if you feel a bit overwhelmed by the idea of AI – by the end of this course, you'll understand exactly what it is, how to use it safely, and how it can become a helpful tool in your everyday activities.

This course is designed specifically for people over 50, which means we won't use confusing technical jargon or assume you have any previous experience with AI. We'll take things step by step, explain everything clearly, and repeat important points to make sure you feel confident. Think of this as sitting down with a patient friend who's explaining something new and interesting to you over a cup of coffee.

You might be wondering why you should learn about AI at all. The truth is, AI is already part of your life, whether you realize it or not. From the spam filter in your email to the recommendations on Netflix, AI is working behind the scenes to make technology more helpful. By understanding AI better, you'll be able to use it more effectively, protect yourself from scams that use AI, and maybe even have some fun along the way.

This course will take about an hour to read through completely. You don't have to read it all at once – feel free to take breaks, come back to sections, or read at whatever pace feels comfortable. We've organized it into main modules that build on each other, but each section can also stand alone if you want to jump to a specific topic.

Remember, there's no such thing as a silly question when learning something new. Everyone starts as a beginner, and the fact that you're here reading this shows you're curious and willing to learn. That's fantastic! Let's begin your AI adventure.`,
        estimatedTime: 10,
        order: 1,
        tags: ['introduction', 'welcome', 'overview'],
      },
      {
        id: 'understanding-ai',
        title: 'Module 1: Understanding AI',
        description:
          'Learn what AI really is through everyday examples and discover how it already helps you.',
        content: `# Module 1: Understanding AI

In this module, we'll demystify AI and help you understand how it's already working in your daily life. Don't worry – we'll keep things simple and practical!`,
        estimatedTime: 15,
        order: 2,
        tags: ['basics', 'understanding', 'daily-life'],
        parts: [
          {
            id: 'what-is-ai-really',
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
- You don't need to understand how it works to benefit from it`,
            estimatedTime: 5,
            order: 1,
            tags: ['beginner', 'introduction', 'examples'],
          },
          {
            id: 'ai-myths-vs-reality',
            title: 'AI Myths vs Reality',
            description: 'Separate fact from fiction about artificial intelligence.',
            content: `# AI Myths vs Reality

## Common Myths About AI

**Myth**: AI will take over the world
**Reality**: AI is a tool that helps us, just like a calculator or microwave

**Myth**: AI is too complicated for seniors
**Reality**: You don't need to understand how it works to use it effectively

**Myth**: AI can read your mind
**Reality**: AI only knows what you tell it or what you've shared online

## The Truth About AI

AI is designed to make your life easier, not replace human judgment. It's like having a very smart assistant that can help with tasks, answer questions, and provide suggestions. But it still needs your guidance and common sense to work properly.`,
            estimatedTime: 5,
            order: 2,
            tags: ['myths', 'reality', 'education'],
          },
          {
            id: 'ai-in-your-devices',
            title: 'AI in Your Devices',
            description:
              'Discover the AI features already in your smartphone, computer, and smart home devices.',
            content: `# AI in Your Devices

## Your Smartphone

- **Camera**: Automatically improves your photos
- **Keyboard**: Suggests words as you type
- **Assistant**: Siri (iPhone) or Google Assistant (Android)
- **Apps**: Maps, weather, and news apps use AI

## Your Computer

- **Email**: Spam filtering keeps unwanted emails away
- **Search**: Better results based on what you're looking for
- **Photos**: Automatically organizes pictures by people and places

## Smart Home Devices

- **Thermostat**: Learns your schedule and preferences
- **TV**: Recommends shows you might like
- **Security**: Can recognize familiar faces

## The Bottom Line

You're already using AI every day! These tools are designed to work quietly in the background, making your technology more helpful and easier to use.`,
            estimatedTime: 5,
            order: 3,
            tags: ['devices', 'smartphone', 'smart-home'],
          },
        ],
      },
      {
        id: 'staying-safe-ai',
        title: 'Module 2: Staying Safe with AI',
        description:
          'Learn essential privacy rules, how to spot AI mistakes, and protect yourself from AI-related scams.',
        content: `# Module 2: Staying Safe with AI

Safety first! In this module, we'll cover everything you need to know to use AI confidently and securely.`,
        estimatedTime: 15,
        order: 3,
        tags: ['safety', 'privacy', 'security'],
        parts: [
          {
            id: 'privacy-rules',
            title: 'Privacy Rules You Should Always Follow',
            description:
              'Essential guidelines for protecting your personal information when using AI.',
            content: `# Privacy Rules You Should Always Follow

## Never Share These with AI:
- ❌ Social Security number
- ❌ Bank account or credit card numbers
- ❌ Passwords or PINs
- ❌ Full home address
- ❌ Medicare or insurance ID numbers

## Safe to Share:
- ✅ General location (city, state)
- ✅ Hobbies and interests
- ✅ General health questions (not specific medical records)
- ✅ Learning goals and preferences

## Why This Matters

AI systems store conversations and data. While reputable companies protect your information, it's always better to be cautious. Think of AI conversations like talking to a helpful stranger – be friendly but don't share personal details.

## Building Good Habits

✅ **Always think before sharing information**
✅ **Use AI from reputable sources only**
✅ **Log out of AI platforms when you're done**
✅ **Keep your conversations general, not personal**`,
            estimatedTime: 5,
            order: 1,
            tags: ['privacy', 'personal-info', 'safety'],
          },
          {
            id: 'spotting-ai-mistakes',
            title: 'How to Spot AI Mistakes',
            description: 'Learn when and how to double-check AI responses for accuracy.',
            content: `# How to Spot AI Mistakes

## AI is Smart, But Not Perfect

AI can make mistakes, especially with:

**Medical Advice**: AI can provide general health information, but always confirm with your doctor
**Financial Information**: Verify investment or insurance advice with trusted professionals
**Recent Events**: AI might not know about very recent news or changes
**Personal Situations**: AI gives general advice - consider your specific circumstances

## How to Double-Check

1. **Ask a second source**: Check with another website or person
2. **Use your common sense**: If something sounds too good to be true, it probably is
3. **Consult professionals**: For health, finance, or legal matters, talk to qualified experts
4. **Ask follow-up questions**: If you're unsure, ask the AI to explain more

## Red Flags to Watch For

🚨 Advice that contradicts what your doctor told you
🚨 Financial recommendations that seem risky
🚨 Information that doesn't match what you know to be true
🚨 Responses that seem generic rather than specific to your question`,
            estimatedTime: 5,
            order: 2,
            tags: ['accuracy', 'verification', 'critical-thinking'],
          },
          {
            id: 'avoiding-ai-scams',
            title: 'Avoiding AI-Related Scams',
            description:
              'Recognize and protect yourself from scams that use AI or claim AI benefits.',
            content: `# Avoiding AI-Related Scams

## Common AI Scams to Watch For

### Red Flags:
🚨 **Urgent requests for money or personal information**
🚨 **Claims that "AI has found something wrong" with your accounts**
🚨 **Fake AI "doctors" or "financial advisors" asking for personal details**
🚨 **Too-good-to-be-true investment opportunities involving AI**

## Helen's Safety Story

Helen, 69, received an email claiming "AI detected suspicious activity" on her bank account and asking her to click a link. Instead of clicking, she called her bank directly. It was a scam! The bank thanked her for being cautious.

## How to Stay Safe:

1. **Verify independently**: If AI tells you something important, check with another source
2. **Use official websites**: Only use AI on trusted platforms like OpenAI's ChatGPT
3. **Trust your instincts**: If something feels wrong, it probably is
4. **Ask family or friends**: When in doubt, ask someone you trust

## Getting Help When You Need It

- If you're unsure about an AI response, ask a family member or friend
- Contact your bank directly if you receive any financial "alerts"
- Trust your local doctor over AI for medical decisions
- When in doubt, don't share personal information`,
            estimatedTime: 5,
            order: 3,
            tags: ['scams', 'fraud-prevention', 'verification'],
          },
        ],
      },
      {
        id: 'first-ai-conversation',
        title: 'Module 3: Your First AI Conversation',
        description:
          'Master the art of talking with AI using natural conversation instead of keyword searches.',
        content: `# Module 3: Your First AI Conversation

Ready to have your first real conversation with AI? Let's learn how to communicate naturally and effectively!`,
        estimatedTime: 15,
        order: 4,
        tags: ['conversation', 'communication', 'practice'],
        parts: [
          {
            id: 'conversation-vs-search',
            title: 'Conversation vs Search',
            description:
              'Learn the difference between AI conversation and traditional web searching.',
            content: `# Conversation vs Search

## The Old Way: Keyword Search

When you search Google, you typically use keywords:
- "weather Phoenix Arizona"
- "recipes chicken easy"
- "doctor appointment prep"

## The New Way: AI Conversation

With AI, you can ask complete questions and have a back-and-forth conversation:
- "What's the weather like in Phoenix today? Should I bring a jacket?"
- "I need a simple chicken recipe for two people that takes less than 30 minutes"
- "I'm seeing my doctor about knee pain. What questions should I ask?"

## Why This is Better

✅ **More natural**: Ask questions like you would to a friend
✅ **More specific results**: AI understands context and your specific needs
✅ **Follow-up questions**: You can continue the conversation and ask for clarification
✅ **Personalized advice**: AI can tailor responses to your situation`,
            estimatedTime: 5,
            order: 1,
            tags: ['comparison', 'natural-language', 'benefits'],
          },
          {
            id: 'conversation-tips',
            title: 'Tips for Better AI Conversations',
            description: 'Learn practical techniques to get the most helpful responses from AI.',
            content: `# Tips for Better AI Conversations

## 1. Be Specific About Your Needs

**Instead of**: "recipes"
**Try**: "I need a healthy dinner recipe for two people that uses ingredients I probably have at home"

## 2. Provide Context

**Instead of**: "What should I plant?"
**Try**: "I'm a beginner gardener in Colorado. What vegetables are easiest to grow and when should I plant them?"

## 3. Ask Follow-Up Questions

AI remembers what you just talked about, so you can build on the conversation:
- "That sounds great, but what if I don't have that ingredient?"
- "Can you make that recipe even simpler?"
- "What tools would I need for that?"

## 4. Be Polite (It Feels Natural)

While not required, saying "please" and "thank you" makes the conversation feel more natural and comfortable for you.

## 5. Ask for Step-by-Step Help

"Can you break that down into simple steps for me?" is one of the most useful phrases when talking to AI.`,
            estimatedTime: 5,
            order: 2,
            tags: ['tips', 'techniques', 'best-practices'],
          },
          {
            id: 'practice-exercises',
            title: 'Practice Exercises',
            description: 'Try these conversation starters to practice talking with AI.',
            content: `# Practice Exercises

## Exercise 1: Family Dinner Planning

Try this conversation with an AI:
1. "I want to cook a special dinner for my grandchildren when they visit"
2. When the AI responds, ask: "What if one of them doesn't like vegetables?"
3. Then ask: "Can you give me a simple recipe I can make?"

## Exercise 2: Health Questions

Practice asking health-related questions:
1. "I'm going to see my doctor about my arthritis. What questions should I prepare?"
2. Follow up with: "How can I keep track of my symptoms before the appointment?"

## Exercise 3: Technology Help

Get help with technology:
1. "I want to learn to use my smartphone camera better. Where should I start?"
2. Ask: "Can you explain that in simpler terms?"
3. Then: "What's the most important tip for taking better photos?"

## Robert's Success Story

Robert, 72, wanted to plan a garden but didn't know where to start. Instead of searching "gardening tips," he asked ChatGPT: "I'm a beginner who wants to start a small vegetable garden in Colorado. What vegetables are easiest to grow, and when should I plant them?" The AI gave him specific advice for his location and experience level.

## Your Turn!

Try one of these exercises with a real AI system. Remember: there's no wrong way to start a conversation!`,
            estimatedTime: 5,
            order: 3,
            tags: ['practice', 'exercises', 'examples'],
          },
        ],
      },
      {
        id: 'ai-daily-life',
        title: 'Module 4: AI for Daily Life',
        description:
          'Discover practical ways to use AI for health, family communication, hobbies, and daily organization.',
        content: `# Module 4: AI for Daily Life

Now let's explore the exciting ways AI can become your daily assistant, helping with everything from health management to family communication.`,
        estimatedTime: 15,
        order: 5,
        tags: ['practical', 'daily-life', 'applications'],
        parts: [
          {
            id: 'health-and-wellness',
            title: 'Health and Wellness',
            description:
              'Use AI to help manage medications, prepare for doctor visits, and track wellness goals.',
            content: `# Health and Wellness

## Medication Management

**Ask AI to help**: "Can you help me create a simple medication schedule? I take three pills at different times."
**Follow up with**: "How can I set reminders for these medications?"

## Doctor Visit Preparation

**Try asking**: "I'm seeing my doctor about knee pain. What questions should I ask?"
**For symptoms**: "Help me organize my symptoms to discuss with my doctor"
**For follow-up**: "What should I ask about treatment options?"

## Wellness Tracking

**Blood pressure**: "Help me create a simple chart to track my blood pressure readings"
**Exercise**: "I want to start walking more. Can you suggest a gentle routine for beginners?"
**Diet**: "What are some heart-healthy meal ideas that are easy to prepare?"

## Important Safety Note

⚠️ **Always remember**: AI can provide general health information and help you organize your thoughts, but never replace your doctor's advice. Always discuss health decisions with your healthcare provider.`,
            estimatedTime: 5,
            order: 1,
            tags: ['health', 'medication', 'wellness'],
          },
          {
            id: 'family-communication',
            title: 'Family Communication',
            description:
              'Get help writing emails, social media posts, and staying connected with loved ones.',
            content: `# Family Communication

## Email Writing

**Holiday planning**: "Help me write a friendly email to my daughter about visiting for Thanksgiving"
**Thank you notes**: "I want to thank my neighbor for helping with my groceries. How should I word this?"
**Invitations**: "Help me write an invitation for my birthday dinner"

## Social Media Help

**Birthday wishes**: "What's a nice way to wish my grandson happy birthday on Facebook?"
**Photo captions**: "Help me write a caption for this photo of my garden"
**Responses**: "Someone complimented my cooking. How should I respond?"

## Card and Letter Writing

**Thank you cards**: "Help me write a heartfelt thank you note for the lovely dinner"
**Get well wishes**: "My friend is in the hospital. What should I write in a card?"
**Holiday cards**: "Help me write a warm holiday message for my family card"

## Staying Connected

**Conversation starters**: "I'm calling my son but don't know what to talk about. Any suggestions?"
**Long-distance relationships**: "How can I stay close to my grandchildren who live far away?"`,
            estimatedTime: 5,
            order: 2,
            tags: ['family', 'communication', 'relationships'],
          },
          {
            id: 'hobbies-and-organization',
            title: 'Hobbies and Daily Organization',
            description:
              'Let AI help with cooking, travel planning, learning new skills, and organizing your day.',
            content: `# Hobbies and Daily Organization

## Cooking and Recipes

**Ingredient-based cooking**: "I have chicken, rice, and vegetables. What can I make for dinner?"
**Dietary needs**: "I need low-sodium recipes that are still flavorful"
**Cooking tips**: "How do I know when my roast is done?"

## Travel and Transportation

**Trip planning**: "I want to visit my sister in Florida. What should I know about driving there?"
**Local activities**: "What are some senior-friendly activities in my area?"
**Transportation**: "What are my options for getting to my doctor's appointment?"

## Learning and Hobbies

**Technology**: "I want to learn to use my smartphone better. Where should I start?"
**New hobbies**: "I'm interested in bird watching. How do I get started?"
**Crafts**: "Help me plan a simple craft project for my grandchildren"

## Daily Organization

**Weekly planning**: "Help me organize my tasks for this week"
**Shopping lists**: "I'm making Thanksgiving dinner for 8 people. What should I buy?"
**Appointment scheduling**: "I have three appointments next week. Help me organize my time efficiently"

## Linda's Success Story

Linda, 65, uses AI every Sunday to plan her week. She asks: "I have a doctor's appointment Tuesday, lunch with friends Thursday, and need to grocery shop. How should I organize my week to be most efficient?" The AI helps her group errands and suggests the best days for each activity.`,
            estimatedTime: 5,
            order: 3,
            tags: ['hobbies', 'organization', 'planning'],
          },
        ],
      },
      {
        id: 'conclusion',
        title: 'Conclusion: Your AI Journey Continues',
        description:
          "Congratulations on completing the course! Here's how to continue learning and using AI safely.",
        content: `# Conclusion: Your AI Journey Continues

## Congratulations!

You've completed your introduction to AI! You now understand what AI is, how to use it safely, how to have natural conversations with it, and practical ways to use it in your daily life. That's quite an accomplishment!

## What You've Learned

✅ **AI is already helping you** in apps and devices you use every day
✅ **Safety comes first** – you know what information to keep private
✅ **Natural conversation** works better than keyword searches
✅ **Practical applications** for health, family, hobbies, and organization

## Next Steps

**Start Small**: Pick one area where AI can help you – maybe meal planning or organizing your week – and try it out.

**Practice Regularly**: The more you use AI, the more comfortable you'll become. Start with simple questions and build up to more complex conversations.

**Stay Curious**: Technology keeps improving. Don't be afraid to try new AI features as they become available.

**Share Your Knowledge**: Teach friends and family what you've learned. You might be surprised how much you can help others!

## Remember the Golden Rules

1. **Never share personal financial or medical information**
2. **Verify important advice with trusted professionals**
3. **Use your common sense and trust your instincts**
4. **AI is a tool to help you, not replace your judgment**

## Keep Learning

Technology changes, but the principles you've learned here will serve you well. Stay curious, stay safe, and enjoy exploring how AI can make your life easier and more enjoyable.

Welcome to the future – you're ready for it!`,
        estimatedTime: 5,
        order: 6,
        tags: ['conclusion', 'next-steps', 'encouragement'],
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
          '# Better Prompting Techniques\n\n[Coming Soon]\n\nThis module will cover:\n- How to be more specific in your requests\n- Role-playing techniques with AI\n- Asking effective follow-up questions\n- Getting better results from AI conversations',
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
          '# AI Tools and Apps\n\n[Coming Soon]\n\nThis module will cover:\n- Voice assistants (Siri, Alexa, Google)\n- Health and wellness apps\n- Financial management tools\n- Memory and organization aids',
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
          '# Health & Finance Applications\n\n[Coming Soon]\n\nThis module will cover:\n- Preparing for medical appointments\n- Budget planning and expense tracking\n- Insurance comparison and selection\n- Managing prescriptions and health records',
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
          '# Monthly AI Updates\n\n[Coming Soon]\n\nThis module will cover:\n- Latest AI tool releases\n- Safety and security updates\n- New features in popular AI platforms\n- Trending applications for seniors',
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
          '# Autonomous AI Agents\n\n[Coming Soon]\n\nThis module will cover:\n- What are autonomous AI agents\n- Multi-step task automation\n- Safety considerations and limitations\n- Practical applications for people over 50',
        estimatedTime: 30,
        order: 1,
        tags: ['expert', 'autonomous', 'agents'],
      },
      {
        id: 'mcp-protocol',
        title: 'Model Context Protocol (MCP)',
        description: 'Learn how to safely connect AI to your personal data and applications.',
        content:
          '# Model Context Protocol (MCP)\n\n[Coming Soon]\n\nThis module will cover:\n- Understanding MCP technology\n- Safe data connections\n- Privacy and security considerations\n- Practical implementation examples',
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
          '# Custom AI Assistants\n\n[Coming Soon]\n\nThis module will cover:\n- Personalizing AI responses\n- Creating custom workflows\n- Fine-tuning for your needs\n- Automation and efficiency',
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
          '# Cutting-Edge Updates\n\n[Coming Soon]\n\nThis module will cover:\n- Latest AI breakthroughs\n- Ethical considerations\n- Community involvement opportunities\n- Future of AI technology',
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

// Helper functions for module parts
export const getPartById = (
  courseId: string,
  moduleId: string,
  partId: string,
): ModulePart | undefined => {
  const module = getModuleById(courseId, moduleId);
  return module?.parts?.find((part) => part.id === partId);
};

export const getNextPart = (
  courseId: string,
  moduleId: string,
  currentPartId: string,
): ModulePart | null => {
  const module = getModuleById(courseId, moduleId);
  if (!module?.parts) return null;

  const currentIndex = module.parts.findIndex((part) => part.id === currentPartId);
  if (currentIndex === -1 || currentIndex === module.parts.length - 1) return null;

  return module.parts[currentIndex + 1];
};

export const getPreviousPart = (
  courseId: string,
  moduleId: string,
  currentPartId: string,
): ModulePart | null => {
  const module = getModuleById(courseId, moduleId);
  if (!module?.parts) return null;

  const currentIndex = module.parts.findIndex((part) => part.id === currentPartId);
  if (currentIndex <= 0) return null;

  return module.parts[currentIndex - 1];
};
