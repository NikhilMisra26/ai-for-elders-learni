# AI for Elders - Product Requirements Document

A comprehensive learning platform designed to teach adults 50+ how to effectively and safely use artificial intelligence through structured, accessible courses.

**Experience Qualities**:

1. **Accessible** - Every interaction prioritizes clarity, readability, and ease of use for older adults
2. **Trustworthy** - Professional design that builds confidence in AI learning with clear progress indicators
3. **Empowering** - Content that transforms AI from intimidating to empowering through graduated skill building

**Complexity Level**: Complex Application (advanced functionality, accounts)

- Multi-tier subscription system with user accounts, progress tracking, and content management requires sophisticated state management and user flows

## Essential Features

### User Authentication & Tiers

- **Functionality**: Email/password registration with tiered access (Free, Advanced $1.99/month, Expert $4.99/month)
- **Purpose**: Provides structured learning path with monetization for sustainable platform
- **Trigger**: User clicks "Sign Up" or "Login" buttons
- **Progression**: Registration form → Email verification → Tier selection → Dashboard access
- **Success criteria**: Users can register, verify email, select subscription tier, and access appropriate content

### Course Management System

- **Functionality**: Three-tier course structure with 4 modules each, progress tracking, content display
- **Purpose**: Systematic AI education from basics to advanced applications
- **Trigger**: User selects course from dashboard or navigation
- **Progression**: Course overview → Module selection → Content consumption → Progress marking → Next module
- **Success criteria**: Users complete modules, track progress, and advance through structured curriculum

### Accessibility Controls

- **Functionality**: Font size adjustment (A-/A+), dark mode toggle, audio narration via Web Speech API
- **Purpose**: Ensures platform usability for older adults with varying visual and cognitive needs
- **Trigger**: User activates accessibility controls in header or module pages
- **Progression**: Control activation → Immediate visual/audio feedback → Setting persistence
- **Success criteria**: All content remains accessible with size/contrast adjustments and audio narration

### Progress Tracking & Dashboard

- **Functionality**: Visual progress indicators, next lesson recommendations, subscription status display
- **Purpose**: Motivates continued learning and provides clear achievement visibility
- **Trigger**: User accesses dashboard or completes module activities
- **Progression**: Login → Dashboard view → Progress overview → Course selection
- **Success criteria**: Users see completed modules, remaining content, and clear next steps

## Edge Case Handling

- **Subscription Expiry**: Graceful downgrade to free tier with content access notification
- **Network Failures**: Offline progress saving with sync when connectivity returns
- **Audio Failures**: Fallback text display when Web Speech API unavailable
- **Large Text Mode**: Layout reflow maintains usability at maximum font sizes
- **Incomplete Modules**: Resume functionality preserves partial progress
- **Payment Issues**: Clear messaging with customer support contact information

## Design Direction

The design should feel trustworthy, professional, and approachable - like a community college extension program rather than a flashy tech startup, with generous spacing and clear visual hierarchy that reduces cognitive load for older learners.

## Color Selection

High contrast complementary scheme optimized for accessibility and readability.

- **Primary Color**: Deep navy blue oklch(0.25 0.05 240) - communicates trust, professionalism, and stability
- **Secondary Colors**: Warm gray oklch(0.85 0.02 180) for backgrounds, soft blue oklch(0.7 0.1 240) for accents
- **Accent Color**: Warm orange oklch(0.65 0.15 60) for call-to-action buttons and progress indicators
- **Foreground/Background Pairings**:
  - Background (White oklch(1 0 0)): Dark navy text oklch(0.25 0.05 240) - Ratio 8.2:1 ✓
  - Card (Light gray oklch(0.98 0.01 180)): Dark navy text oklch(0.25 0.05 240) - Ratio 7.8:1 ✓
  - Primary (Deep navy oklch(0.25 0.05 240)): White text oklch(1 0 0) - Ratio 8.2:1 ✓
  - Secondary (Warm gray oklch(0.85 0.02 180)): Dark navy text oklch(0.25 0.05 240) - Ratio 4.9:1 ✓
  - Accent (Warm orange oklch(0.65 0.15 60)): White text oklch(1 0 0) - Ratio 4.7:1 ✓

## Font Selection

Use clear, highly readable sans-serif typography that maintains legibility at larger sizes while conveying approachability and professionalism.

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/28px/normal letter spacing
  - H3 (Module Titles): Inter Medium/24px/normal letter spacing
  - Body Text: Inter Regular/20px/relaxed line height (1.6)
  - Button Text: Inter Medium/18px/normal letter spacing
  - Small Text: Inter Regular/16px (minimum size)

## Animations

Subtle, purposeful animations that provide feedback without being distracting or overwhelming for older users who may find excessive motion disorienting.

- **Purposeful Meaning**: Gentle transitions communicate state changes and guide attention to important elements like progress updates
- **Hierarchy of Movement**: Priority on button hover feedback and progress bar animations, minimal page transitions

## Component Selection

- **Components**: Card-based layout using shadcn Cards for modules, Form components for registration, Button variants for different actions, Progress components for tracking, Tabs for course organization
- **Customizations**: Larger touch targets (minimum 44px), increased padding throughout, custom audio controls component
- **States**: Clear visual feedback for all interactive elements with enhanced focus states for keyboard navigation
- **Icon Selection**: Simple, universally recognized icons from Phosphor - Play/Pause for audio, CheckCircle for completion, User for account, Book for courses
- **Spacing**: Generous padding using Tailwind's larger spacing values (p-6, p-8, gap-6) for comfortable interaction
- **Mobile**: Mobile-first responsive design with collapsible navigation, stacked card layouts, and optimized touch targets for tablet/smartphone use
