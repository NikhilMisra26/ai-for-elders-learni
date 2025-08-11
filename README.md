# AI for Elders 🧠✨

**AI for Elders** is a React-based educational platform designed to teach adults 50+ how to effectively and safely use artificial intelligence. The platform features a multi-tier subscription system, user authentication, progress tracking, and accessibility features optimized for older learners.

## 🌟 Key Features

### 📊 **Dynamic Metrics System**
- **Smart Thresholds**: Metrics only display when impressive enough
  - User count: Shows only when ≥ 1000 users
  - Course completion: Shows only when ≥ 85%
  - Average rating: Shows only when ≥ 4.0 stars with testimonials
  - Countries: Shows only when ≥ 5 countries
- **Real-time Data**: Fetches actual statistics from Supabase database
- **Responsive Layout**: Automatically adjusts grid to maintain symmetry
- **Performance Optimized**: 5-minute caching for fast load times

### 🎯 **Testimonials & Reviews**
- **Real User Reviews**: Displays approved testimonials from actual users
- **Review Submission**: Authenticated users can submit reviews via dialog
- **Admin Approval Workflow**: Reviews require approval before display
- **Fallback CTA**: Shows "Be the First to Review" when no testimonials exist
- **Duplicate Prevention**: Users can only submit one review

### 🎨 **Senior-Friendly Design**
- Large fonts and high contrast design
- **Enhanced Audio Narration System** with comprehensive accessibility features
  - **Primary Edge TTS Integration**: High-quality Microsoft Edge TTS with natural-sounding voices
  - **Intelligent Web Speech API Fallback**: Seamless fallback when Edge TTS unavailable
  - **Senior-Optimized Features**:
    - Default speech rate: 0.9x (slower for better comprehension)
    - Constrained rate range: 0.5x - 1.5x (prevents too-fast speech)
    - Recommended voices: Aria, Jenny, Sara (female) and Guy (male)
    - Enhanced text preprocessing (abbreviation expansion, natural pauses)
  - **Advanced Audio Management**:
    - Client-side audio caching with automatic cleanup
    - Progress tracking and duration estimation
    - Comprehensive error handling with user-friendly messages
    - Screen reader announcements for all state changes
  - **Accessibility-First Design**:
    - Keyboard controls (Space=play/pause, Enter=play, Escape=stop)
    - Volume/rate controls with arrow keys
    - ARIA live announcements for audio state changes
    - Touch-friendly controls with 44px minimum touch targets
- Touch-friendly interface with proper target sizes
- Clear navigation with breadcrumbs
- WCAG 2.1 AA accessibility compliance
- **Error-resilient UI** preventing blank screens from component failures

### 🔐 **Security & Privacy**
- Comprehensive security module with rate limiting
- CSRF protection and XSS prevention
- Session management with automatic timeout
- Row Level Security (RLS) on all database tables

### 💳 **Subscription System**
- **Free**: Basic AI course with community access
- **Advanced ($1.99/month)**: Personal assistant course + advanced features
- **Expert ($4.99/month)**: Cutting-edge AI technologies + custom assistants

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State**: React Context API
- **Authentication**: Supabase Auth
- **Audio**: Microsoft Edge TTS + Web Speech API fallback
- **Server**: Express.js (TTS API on port 3001)
- **Icons**: Phosphor Icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Development Commands
```bash
# Core Development
pnpm run dev          # Start development server (port 5173)
pnpm run dev:server   # Start TTS server (port 3001)
pnpm run dev:full     # Start both frontend and TTS server concurrently

# Build & Quality
pnpm run build        # Build for production
pnpm run typecheck    # Run TypeScript checking
pnpm run lint:fix     # Fix linting issues
pnpm run format       # Format code with Prettier

# Utilities
pnpm run kill         # Kill process on port 5000
pnpm run kill:tts     # Kill TTS server on port 3001
```

## 🗄️ Database Setup

### 1. Create Supabase Project
- Create a new project at [supabase.com](https://supabase.com)
- Get your project URL and anon key

### 2. Run Database Migrations
Execute these SQL files in your Supabase SQL Editor in order:

1. **Main Schema** (`supabase.schema.sql`):
   ```sql
   -- Creates profiles, subscriptions, progress, and activity tables
   -- Includes Row Level Security policies
   ```

2. **Testimonials System** (`supabase-testimonials.sql`):
   ```sql
   -- Creates testimonials table for user reviews
   -- Adds get_platform_stats() function for dynamic metrics
   -- Includes admin approval workflow
   ```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and add:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎙️ TTS Server Setup

The platform includes a high-quality text-to-speech server using Microsoft Edge TTS for enhanced audio narration.

### Local Development
```bash
# Install dependencies (if not already installed)
pnpm install

# Start TTS server
pnpm run dev:server  # Server runs on http://localhost:3001

# Or start both frontend and TTS server
pnpm run dev:full
```

### TTS Features

#### **Enhanced Audio Narration System**

**Primary Edge TTS Integration:**
- **Elderly-Optimized Voices**: 
  - Primary: `en-US-AriaNeural` (warm female voice, recommended for seniors)
  - Secondary: `en-US-JennyNeural` (friendly female voice, natural and clear)
  - Alternative: `en-US-SaraNeural` (professional female voice, clear articulation)
  - Male option: `en-US-GuyNeural` (clear, pleasant male voice)

**Senior-Friendly Audio Settings:**
- **Default speech rate**: 0.9x (slower for better comprehension)
- **Constrained rate range**: 0.5x - 1.5x (prevents too-fast speech)
- **Maximum text length**: 5000 characters per request
- **High-quality audio**: 24kHz, 48kbps MP3 output
- **Smart volume control**: Gradual adjustments with accessibility announcements

**Advanced Features:**
- **Intelligent Fallback System**: 
  - Automatic Web Speech API fallback when Edge TTS unavailable
  - Health check monitoring with user notifications
  - Graceful degradation with clear status messages
- **Enhanced Text Processing**:
  - Abbreviation expansion (AI → Artificial Intelligence, API → A-P-I)
  - Emoji to text conversion (✅ → Checkmark, ⚠️ → Warning)
  - Natural pause insertion for better comprehension
  - Markdown formatting removal
- **Memory-Efficient Caching**:
  - Client-side audio caching with 50-item limit
  - Automatic cleanup after 30 minutes
  - Object URL management to prevent memory leaks
- **Comprehensive Error Handling**:
  - User-friendly error messages for seniors
  - Automatic retry logic with exponential backoff
  - Detailed logging for debugging and monitoring

**Accessibility Features:**
- **Keyboard Controls**:
  - Space: Play/Pause toggle
  - Enter: Start playback  
  - Escape: Stop and reset
  - Arrow keys: Volume and rate control
- **Screen Reader Integration**:
  - ARIA live announcements for all state changes
  - Progress updates and completion notifications
  - Error message announcements
- **Touch-Friendly Controls**:
  - Minimum 44px touch targets
  - Large, clearly labeled buttons
  - Visual feedback for all interactions

### API Endpoints
- `POST /api/tts` - Generate speech audio
- `GET /api/tts/voices` - List available voices and settings
- `GET /health` - Server health check

### Testing the TTS Server
```bash
# Test server health
curl http://localhost:3001/health

# Generate speech (example)
curl -X POST http://localhost:3001/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, welcome to AI for Elders!", "voice": "en-US-AriaNeural", "rate": 0.9}' \
  --output test-audio.mp3
```

### Using the Enhanced Audio System in Components

#### Basic Usage with Enhanced Hook
```tsx
import { useAudioNarration } from '@/lib/audioNarration';

function MyComponent() {
  const [audioState, audioControls] = useAudioNarration(
    "Welcome to AI for Elders! This text will be spoken using high-quality Edge TTS voices.",
    true // prefer Edge TTS
  );

  return (
    <div>
      <button 
        onClick={audioControls.play}
        disabled={audioState.isLoading}
        className="min-h-[44px] min-w-[44px]" // Touch-friendly
      >
        {audioState.isLoading ? 'Loading...' : 
         audioState.isPlaying ? 'Pause' : 'Play'}
      </button>
      
      <p>Duration: {audioControls.getFormattedDuration()}</p>
      <p>Using: {audioState.usingEdgeTTS ? 'High-Quality Voice' : 'System Voice'}</p>
    </div>
  );
}
```

#### Advanced Usage with Dedicated Edge TTS Hook
```tsx
import { useEdgeTTSAudio, useAudioKeyboardControls } from '@/hooks/useEdgeTTSAudio';

function AdvancedAudioComponent() {
  const [audioState, audioControls] = useEdgeTTSAudio(
    "Advanced text-to-speech with full Edge TTS features.",
    {
      initialVoice: 'en-US-AriaNeural',
      initialRate: 0.9,
      onError: (error) => console.error('Audio error:', error),
      onPlaybackStart: () => console.log('Audio started'),
      onPlaybackEnd: () => console.log('Audio completed')
    }
  );

  // Set up keyboard controls
  const handleKeyDown = useAudioKeyboardControls(audioControls, audioState, {
    enableRateControl: true,
    volumeStep: 0.1,
    rateStep: 0.1
  });

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-4">
      {/* Audio Controls */}
      <div className="flex space-x-2">
        <button onClick={audioControls.play} disabled={audioState.isLoading}>
          {audioState.isLoading ? 'Loading...' : 'Play'}
        </button>
        <button onClick={audioControls.pause} disabled={!audioState.isPlaying}>
          Pause
        </button>
        <button onClick={audioControls.stop} disabled={!audioState.isPlaying && !audioState.isPaused}>
          Stop
        </button>
      </div>

      {/* Progress and Info */}
      <div>
        <p>Progress: {audioState.progress}%</p>
        <p>Duration: {audioControls.getFormattedDuration()}</p>
        <p>Server: {audioState.isServerAvailable ? 'Available' : 'Unavailable'}</p>
      </div>

      {/* Rate and Volume Controls */}
      <div className="space-y-2">
        <div>
          <label>Rate: {Math.round(audioState.rate * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={audioState.rate}
            onChange={(e) => audioControls.setRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label>Volume: {Math.round(audioState.volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioState.volume}
            onChange={(e) => audioControls.setVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Error Display */}
      {audioState.error && (
        <div className="text-red-600 p-2 bg-red-50 rounded">
          <p>{audioState.error}</p>
          <button onClick={audioControls.clearError} className="text-sm underline">
            Clear Error
          </button>
        </div>
      )}
    </div>
  );
}
```

#### Component Features
- **Automatic Health Checking**: Detects Edge TTS server availability on mount
- **Intelligent Fallback**: Seamlessly switches to Web Speech API when needed
- **Keyboard Accessibility**: Standard keyboard shortcuts for all audio controls
- **Progress Tracking**: Real-time progress updates during playback
- **Error Recovery**: Clear error messages with user-friendly recovery options
- **Senior-Friendly Defaults**: Optimized settings for elderly users out of the box

## 📊 Managing Dynamic Metrics

### Testimonials Administration
1. **View Submissions**: Query `testimonials` table in Supabase
2. **Approve Reviews**: Set `is_approved = true`
3. **Order Display**: Set `display_order` for custom sorting
4. **Thresholds**: Adjust thresholds in `src/hooks/useMetrics.ts`

### Metrics Thresholds
Current settings ensure only impressive metrics are shown:
- **Users**: 1000+ (configurable in `THRESHOLDS.MIN_USERS`)
- **Completion Rate**: 85%+ (configurable in `THRESHOLDS.MIN_COMPLETION_RATE`)  
- **Rating**: 4.0+ stars (configurable in `THRESHOLDS.MIN_RATING`)
- **Countries**: 5+ (configurable in `THRESHOLDS.MIN_COUNTRIES`)

## 🛡️ Route Protection System

### React Router Compatible Components
The platform includes comprehensive route protection for future React Router migration:

- **`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`): React Router v6/v7 compatible route wrapper
- **`RouteGuard`** (`src/components/RouteGuard.tsx`): Works with current custom routing system
- **`useRouteProtection`** (`src/hooks/useRouteProtection.ts`): Core protection logic hook

### Features
- **Authentication Guard**: Redirects unauthenticated users with preserved destination
- **Role-Based Access**: Supports `free`, `advanced`, `expert`, and `admin` roles
- **Tier Upgrades**: Shows upgrade prompts for insufficient subscription tiers
- **Accessibility**: Full WCAG compliance with proper ARIA labels and keyboard navigation
- **Senior-Friendly**: Large touch targets, clear messaging, and simplified UI flows

### Usage Examples
```tsx
// React Router compatible (future migration)
<Route path="/dashboard" element={
  <ProtectedRoute requiredRole="advanced">
    <DashboardPage />
  </ProtectedRoute>
} />

// Current custom routing system
<RouteGuard requiredRole="expert" onAuthRequired={openAuthDialog}>
  <ExpertContent />
</RouteGuard>
```

## 🏗️ Architecture Notes

- **Offline-First**: Local storage with cloud sync when authenticated
- **Caching**: 5-minute cache on analytics data for performance
- **Security**: Comprehensive rate limiting and session management
- **Accessibility**: Designed specifically for users 50+ with accessibility features
- **React Router v7**: Modern client-side routing with lazy loading and protected routes
- **Performance Optimizations**: Infinite loop prevention in module navigation with ref-based tracking

### 📚 Course Navigation System

The platform now uses React Router v7 for seamless course and module navigation:

**Route Structure:**
- `/courses` - Course listing page
- `/courses/basic` - Free AI basics course (redirects to first module)
- `/courses/advanced` - Advanced course ($1.99/month, redirects to first module)
- `/courses/expert` - Expert course ($4.99/month, redirects to first module)
- `/courses/:courseType/module/:moduleId` - Individual module pages

**Navigation Features:**
- **Automatic Redirection**: Course root paths redirect to the first module automatically
- **URL Parameters**: Course type and module ID are preserved in the URL for bookmarking
- **Smart Back Navigation**: Back buttons intelligently navigate to course overview or main courses page
- **Module Progression**: Previous/Next buttons update the URL for proper navigation history
- **Course Outline Navigation**: Module sidebar allows direct navigation to any module within a course

**Course Type Mapping:**
- `basic` ↔ `ai-basics` (Free tier)
- `advanced` ↔ `ai-assistant` (Advanced tier, $1.99/month)
- `expert` ↔ `advanced-ai` (Expert tier, $4.99/month)

**Recent Bug Fixes:**
- **Module Navigation Performance**: Fixed "Maximum update depth exceeded" error in ModulePage.tsx by implementing ref-based tracking to prevent redundant `setCurrentModule` calls in useEffect hooks
- **Audio Narration Hook Recreation Fix**: 
  - **Fixed hook recreation issue**: Added `useMemo` to memoize module content passed to `useAudioNarration` hook, preventing unnecessary hook recreation on every render
  - **Improved cleanup logic**: Fixed cleanup effect to only run on actual component unmount by removing problematic dependencies that caused audio to stop immediately after starting
  - **Double-cleanup prevention**: Added ref tracking to ensure cleanup operations only run once per component lifecycle
  - **Enhanced unmount handling**: Cleanup now properly detects component unmount vs effect re-run to preserve audio playback during normal state changes
- **Audio Narration Critical Fixes**: 
  - **Fixed utterance recreation bug**: Moved utterance to ref to prevent recreation during state changes that interrupted active speech
  - **Resolved race conditions**: Added separate ref tracking for actual speech state vs React state to prevent sync issues
  - **Enhanced state management**: Only recreate utterance when text changes, not on rate/volume/voice adjustments
  - **Improved settings handling**: Apply rate/volume/voice changes to existing utterance dynamically without interruption
  - **Extensive debugging**: Added comprehensive console logging with timestamps and context for troubleshooting
  - **Better error handling**: Graceful handling of 'interrupted' errors and proper cleanup on component unmount
  - **Pause/Resume intelligence**: Improved logic to resume paused speech instead of restarting unnecessarily
