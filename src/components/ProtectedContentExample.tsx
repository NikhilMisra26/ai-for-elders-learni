/**
 * Example usage of the Enhanced ProtectedContent Component
 *
 * This file demonstrates various use cases for the ProtectedContent component,
 * showing how to integrate it with different scenarios in the AI for Elders platform.
 */

import React from 'react';

import { ProtectedContent } from './ProtectedContentEnhanced';

// ========================================================================
// Example 1: Basic Course Protection
// ========================================================================

export function ProtectedCourseExample(): React.ReactElement {
  return (
    <ProtectedContent
      courseId='ai-basics'
      requiredTier='free'
      enforceServerSide={true}
    >
      <div className='p-6'>
        <h1 className='text-3xl font-bold mb-4'>AI Basics for Everyday Life</h1>
        <p className='text-lg text-muted-foreground'>
          Welcome to your journey into artificial intelligence! This course is
          designed specifically for adults 50+ who want to understand and use AI
          effectively.
        </p>
        {/* Full course content here */}
      </div>
    </ProtectedContent>
  );
}

// ========================================================================
// Example 2: Module with Preview Content
// ========================================================================

export function ProtectedModuleWithPreview(): React.ReactElement {
  const previewContent = (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-4'>Module 1: Understanding AI</h2>
      <p className='mb-4'>
        In this module, you'll learn the fundamentals of artificial intelligence
        and how it can enhance your daily life...
      </p>
      <p className='text-muted-foreground italic'>
        This is a preview. Upgrade to access the full module content including
        exercises, videos, and downloadable materials.
      </p>
    </div>
  );

  return (
    <ProtectedContent
      courseId='ai-assistant'
      moduleId='module-1'
      requiredTier='advanced'
      enforceServerSide={true}
      showPreviewForNonSubscribers={true}
      previewContent={previewContent}
      loadingMessage='Checking your access to this module...'
    >
      <div className='p-6'>
        <h2 className='text-2xl font-bold mb-4'>
          Module 1: Understanding AI - Full Version
        </h2>
        <div className='space-y-6'>
          <section>
            <h3 className='text-xl font-semibold mb-2'>
              What is Artificial Intelligence?
            </h3>
            <p>Complete content with interactive examples...</p>
          </section>
          <section>
            <h3 className='text-xl font-semibold mb-2'>Hands-on Exercises</h3>
            <p>Practice activities to reinforce your learning...</p>
          </section>
        </div>
      </div>
    </ProtectedContent>
  );
}

// ========================================================================
// Example 3: Expert Content with Custom Upgrade Handler
// ========================================================================

export function ProtectedExpertContent(): React.ReactElement {
  const handleUpgradeClick = (): void => {
    // Custom upgrade flow - maybe show a modal or navigate to pricing
    console.log('Custom upgrade handler triggered');
    // You could open a modal, navigate to pricing, or trigger a checkout flow
  };

  const handleAccessDenied = (reason: string): void => {
    // Custom analytics or user feedback
    console.log('Access denied:', reason);
    // Track this event in your analytics
  };

  return (
    <ProtectedContent
      courseId='advanced-ai'
      moduleId='mcp-protocol'
      requiredTier='expert'
      enforceServerSide={true}
      onUpgradeClick={handleUpgradeClick}
      onAccessDenied={handleAccessDenied}
      retryAttempts={5} // More retry attempts for critical content
      className='my-8'
    >
      <div className='p-6'>
        <h1 className='text-3xl font-bold mb-4'>
          Model Context Protocol (MCP)
        </h1>
        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6'>
          <p className='text-sm font-medium'>Expert Level Content</p>
        </div>
        <p className='text-lg mb-4'>
          Learn how to implement and use the Model Context Protocol to create
          sophisticated AI integrations...
        </p>
        {/* Expert-level content */}
      </div>
    </ProtectedContent>
  );
}

// ========================================================================
// Example 4: Content with Fallback
// ========================================================================

export function ProtectedWithFallback(): React.ReactElement {
  const fallbackContent = (
    <div className='p-6 text-center'>
      <h2 className='text-2xl font-bold mb-4'>Coming Soon!</h2>
      <p className='text-muted-foreground'>
        This advanced content is being prepared for our Expert tier members.
        Check back soon or upgrade your plan to be notified when it's available.
      </p>
    </div>
  );

  return (
    <ProtectedContent
      courseId='future-ai'
      requiredTier='expert'
      enforceServerSide={false} // Client-side only for quick checks
      fallbackContent={fallbackContent}
      showSkeleton={false} // No skeleton for quick client-side checks
    >
      <div className='p-6'>
        <h1 className='text-3xl font-bold mb-4'>Future of AI</h1>
        <p>Exclusive content about emerging AI technologies...</p>
      </div>
    </ProtectedContent>
  );
}

// ========================================================================
// Example 5: Lightweight Protection (Client-side only)
// ========================================================================

export function QuickProtectedContent(): React.ReactElement {
  return (
    <ProtectedContent
      courseId='quick-tips'
      requiredTier='free'
      enforceServerSide={false} // No server validation for free content
      showSkeleton={false}
      validateOnMount={true}
    >
      <div className='p-4'>
        <h3 className='text-lg font-semibold mb-2'>Quick AI Tips</h3>
        <ul className='list-disc list-inside space-y-2'>
          <li>Always verify AI-generated information</li>
          <li>Start with simple prompts and refine</li>
          <li>Use AI as a tool, not a replacement for critical thinking</li>
        </ul>
      </div>
    </ProtectedContent>
  );
}

// ========================================================================
// Example 6: Complex Integration with Loading States
// ========================================================================

export function ComplexProtectedSection(): React.ReactElement {
  const [isLoading, setIsLoading] = React.useState(false);
  const [courseData, setCourseData] = React.useState<{ title: string } | null>(
    null,
  );

  React.useEffect(() => {
    // Simulate fetching course data after access is granted
    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      // Simulate API call
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      setCourseData({ title: 'Course loaded!' });
      setIsLoading(false);
    };

    void fetchData();
  }, []);

  const previewContent = (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-4'>AI Tools Overview</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='p-4 border rounded-lg'>
          <h3 className='font-semibold mb-2'>ChatGPT</h3>
          <p className='text-sm text-muted-foreground'>
            Preview: Learn the basics of ChatGPT...
          </p>
        </div>
        <div className='p-4 border rounded-lg'>
          <h3 className='font-semibold mb-2'>Claude</h3>
          <p className='text-sm text-muted-foreground'>
            Preview: Discover Claude's capabilities...
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedContent
      courseId='ai-tools'
      moduleId='tool-comparison'
      requiredTier='advanced'
      enforceServerSide={true}
      showPreviewForNonSubscribers={true}
      previewContent={previewContent}
      loadingMessage='Verifying your subscription and loading course materials...'
      retryAttempts={3}
      className='min-h-[400px]'
    >
      {isLoading ? (
        <div className='p-6 text-center'>
          <p>Loading course materials...</p>
        </div>
      ) : (
        <div className='p-6'>
          <h2 className='text-2xl font-bold mb-4'>Complete AI Tools Guide</h2>
          {courseData && <p>Course content loaded successfully!</p>}
          <div className='mt-6 space-y-8'>
            {/* Full course content with videos, exercises, etc. */}
            <section>
              <h3 className='text-xl font-semibold mb-4'>ChatGPT Mastery</h3>
              <video className='w-full rounded-lg' controls>
                <source src='/videos/chatgpt-tutorial.mp4' type='video/mp4' />
              </video>
            </section>
            <section>
              <h3 className='text-xl font-semibold mb-4'>
                Claude Advanced Techniques
              </h3>
              <video className='w-full rounded-lg' controls>
                <source src='/videos/claude-tutorial.mp4' type='video/mp4' />
              </video>
            </section>
          </div>
        </div>
      )}
    </ProtectedContent>
  );
}

// ========================================================================
// Example 7: Nested Protection (Course and Module)
// ========================================================================

export function NestedProtectedContent(): React.ReactElement {
  return (
    <div className='space-y-8'>
      {/* Course-level protection */}
      <ProtectedContent
        courseId='ai-assistant'
        requiredTier='advanced'
        enforceServerSide={true}
      >
        <div className='p-6 bg-muted/10 rounded-lg'>
          <h1 className='text-3xl font-bold mb-4'>
            AI as Your Personal Assistant
          </h1>
          <p className='mb-6'>Welcome to the Advanced course!</p>

          {/* Module-level protection within the course */}
          <ProtectedContent
            courseId='ai-assistant'
            moduleId='advanced-prompting'
            requiredTier='advanced'
            enforceServerSide={false} // Already validated at course level
            showSkeleton={false}
          >
            <div className='mt-6 p-4 border-l-4 border-primary'>
              <h2 className='text-xl font-semibold mb-2'>
                Advanced Prompting Techniques
              </h2>
              <p>
                This module teaches you sophisticated prompting strategies...
              </p>
            </div>
          </ProtectedContent>

          {/* Another module with higher tier requirement */}
          <ProtectedContent
            courseId='ai-assistant'
            moduleId='custom-assistants'
            requiredTier='expert'
            enforceServerSide={true}
            className='mt-6'
          >
            <div className='p-4 border-l-4 border-purple-500'>
              <h2 className='text-xl font-semibold mb-2'>
                Building Custom AI Assistants
              </h2>
              <p>Expert-only content on creating your own AI assistants...</p>
            </div>
          </ProtectedContent>
        </div>
      </ProtectedContent>
    </div>
  );
}

// ========================================================================
// Main Examples Component
// ========================================================================

export function ProtectedContentExamples(): React.ReactElement {
  return (
    <div className='max-w-6xl mx-auto p-8 space-y-12'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold mb-4'>
          ProtectedContent Component Examples
        </h1>
        <p className='text-lg text-muted-foreground'>
          Demonstrating various use cases for content protection in AI for
          Elders
        </p>
      </div>

      <section className='space-y-8'>
        <div>
          <h2 className='text-2xl font-semibold mb-4'>
            1. Basic Course Protection
          </h2>
          <ProtectedCourseExample />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>
            2. Module with Preview
          </h2>
          <ProtectedModuleWithPreview />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>
            3. Expert Content with Custom Handlers
          </h2>
          <ProtectedExpertContent />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>
            4. Content with Fallback
          </h2>
          <ProtectedWithFallback />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>
            5. Quick Client-side Protection
          </h2>
          <QuickProtectedContent />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>
            6. Complex Integration
          </h2>
          <ComplexProtectedSection />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>7. Nested Protection</h2>
          <NestedProtectedContent />
        </div>
      </section>
    </div>
  );
}
