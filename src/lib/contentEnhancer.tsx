import type { ReactElement } from 'react';
import {
  Lightbulb,
  Shield,
  Warning,
  Info,
  Brain,
  Heart,
  Sparkle,
  Trophy,
  CheckCircle,
  Star,
  ChatCircle,
} from '@phosphor-icons/react';

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'callout' | 'list' | 'divider' | 'checklist' | 'highlight';
  content: string;
  level?: number;
  variant?: 'concept' | 'tip' | 'warning' | 'example' | 'success' | 'info';
  icon?: ReactElement;
  items?: string[];
}

// Icon mapping based on keywords
const getIconForContent = (content: string, moduleId?: string): ReactElement => {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes('warning') ||
    lowerContent.includes('danger') ||
    lowerContent.includes('careful')
  ) {
    return <Warning className='w-6 h-6 text-amber-600' weight='duotone' />;
  }
  if (
    lowerContent.includes('tip') ||
    lowerContent.includes('hint') ||
    lowerContent.includes('suggestion')
  ) {
    return <Lightbulb className='w-6 h-6 text-yellow-600' weight='duotone' />;
  }
  if (
    lowerContent.includes('security') ||
    lowerContent.includes('safe') ||
    lowerContent.includes('protect')
  ) {
    return <Shield className='w-6 h-6 text-red-600' weight='duotone' />;
  }
  if (
    lowerContent.includes('brain') ||
    lowerContent.includes('think') ||
    lowerContent.includes('understand')
  ) {
    return <Brain className='w-6 h-6 text-indigo-600' weight='duotone' />;
  }
  if (
    lowerContent.includes('success') ||
    lowerContent.includes('complete') ||
    lowerContent.includes('achieve')
  ) {
    return <Trophy className='w-6 h-6 text-green-600' weight='duotone' />;
  }
  if (
    lowerContent.includes('chat') ||
    lowerContent.includes('conversation') ||
    lowerContent.includes('talk')
  ) {
    return <ChatCircle className='w-6 h-6 text-blue-600' weight='duotone' />;
  }
  if (
    lowerContent.includes('important') ||
    lowerContent.includes('key') ||
    lowerContent.includes('essential')
  ) {
    return <Star className='w-6 h-6 text-purple-600' weight='duotone' />;
  }

  // Module-specific defaults
  if (moduleId === 'staying-safe-ai')
    return <Shield className='w-6 h-6 text-red-600' weight='duotone' />;
  if (moduleId === 'first-ai-conversation')
    return <ChatCircle className='w-6 h-6 text-green-600' weight='duotone' />;
  if (moduleId === 'understanding-ai')
    return <Brain className='w-6 h-6 text-blue-600' weight='duotone' />;
  if (moduleId === 'ai-daily-life')
    return <Heart className='w-6 h-6 text-purple-600' weight='duotone' />;

  return <Sparkle className='w-6 h-6 text-pink-600' weight='duotone' />;
};

// Get color scheme based on module
export const getModuleColorScheme = (
  moduleId?: string,
): {
  gradient: string;
  border: string;
  text: string;
  icon: string;
} => {
  const schemes: Record<string, { gradient: string; border: string; text: string; icon: string }> =
    {
      introduction: {
        gradient: 'from-amber-50 via-orange-50 to-yellow-50   ',
        border: 'border-amber-300 ',
        text: 'text-amber-900 ',
        icon: 'text-amber-600',
      },
      'understanding-ai': {
        gradient: 'from-blue-50 via-indigo-50 to-sky-50   ',
        border: 'border-blue-300 ',
        text: 'text-blue-900 ',
        icon: 'text-blue-600',
      },
      'staying-safe-ai': {
        gradient: 'from-red-50 via-pink-50 to-rose-50   ',
        border: 'border-red-300 ',
        text: 'text-red-900 ',
        icon: 'text-red-600',
      },
      'first-ai-conversation': {
        gradient: 'from-green-50 via-emerald-50 to-teal-50   ',
        border: 'border-green-300 ',
        text: 'text-green-900 ',
        icon: 'text-green-600',
      },
      'ai-daily-life': {
        gradient: 'from-purple-50 via-violet-50 to-fuchsia-50   ',
        border: 'border-purple-300 ',
        text: 'text-purple-900 ',
        icon: 'text-purple-600',
      },
      conclusion: {
        gradient: 'from-yellow-50 via-amber-50 to-orange-50   ',
        border: 'border-yellow-300 ',
        text: 'text-yellow-900 ',
        icon: 'text-yellow-600',
      },
    };

  return schemes[moduleId ?? ''] ?? schemes['introduction'];
};

// Parse content and identify special sections
export function parseAndEnhanceContent(rawContent: string, moduleId?: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const lines = rawContent.split('\n');

  let currentParagraph = '';
  let inList = false;
  let listItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect headings
    if (line.startsWith('#')) {
      // Save current paragraph if exists
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph });
        currentParagraph = '';
      }

      // Save list if in progress
      if (inList && listItems.length > 0) {
        sections.push({ type: 'list', content: '', items: listItems });
        listItems = [];
        inList = false;
      }

      const level = line.match(/^#+/)?.[0].length ?? 1;
      const headingText = line.replace(/^#+\s*/, '');
      sections.push({
        type: 'heading',
        content: headingText,
        level,
        icon: getIconForContent(headingText, moduleId),
      });
    }
    // Detect list items
    else if (
      line.startsWith('-') ||
      line.startsWith('*') ||
      line.startsWith('•') ||
      /^\d+\./.test(line)
    ) {
      // Save current paragraph if exists
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph });
        currentParagraph = '';
      }

      inList = true;
      const listItem = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');
      listItems.push(listItem);
    }
    // Detect special callouts (lines starting with certain keywords)
    else if (
      line.startsWith('Important:') ||
      line.startsWith('Warning:') ||
      line.startsWith('Tip:') ||
      line.startsWith('Note:')
    ) {
      // Save current paragraph if exists
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph });
        currentParagraph = '';
      }

      // Save list if in progress
      if (inList && listItems.length > 0) {
        sections.push({ type: 'list', content: '', items: listItems });
        listItems = [];
        inList = false;
      }

      let variant: ContentSection['variant'] = 'info';
      if (line.startsWith('Warning:')) variant = 'warning';
      else if (line.startsWith('Tip:')) variant = 'tip';
      else if (line.startsWith('Important:')) variant = 'concept';

      sections.push({
        type: 'callout',
        content: line.replace(/^(Important|Warning|Tip|Note):\s*/, ''),
        variant,
        icon: getIconForContent(line, moduleId),
      });
    }
    // Regular paragraph text
    else if (line) {
      // Save list if ending
      if (inList && listItems.length > 0) {
        sections.push({ type: 'list', content: '', items: listItems });
        listItems = [];
        inList = false;
      }

      currentParagraph += (currentParagraph ? ' ' : '') + line;
    }
    // Empty line - save current paragraph
    else if (currentParagraph) {
      sections.push({ type: 'paragraph', content: currentParagraph });
      currentParagraph = '';
    }
  }

  // Save any remaining content
  if (currentParagraph) {
    sections.push({ type: 'paragraph', content: currentParagraph });
  }
  if (inList && listItems.length > 0) {
    sections.push({ type: 'list', content: '', items: listItems });
  }

  // Add visual dividers between major sections
  const enhancedSections: ContentSection[] = [];
  for (let i = 0; i < sections.length; i++) {
    enhancedSections.push(sections[i]);

    // Add divider after major headings (level 1 or 2) if not last item
    if (sections[i].type === 'heading') {
      const level = sections[i].level;
      if (level !== undefined && level <= 2 && i < sections.length - 1) {
        if (i > 0 && sections[i + 1].type !== 'heading') {
          enhancedSections.push({ type: 'divider', content: '' });
        }
      }
    }
  }

  return enhancedSections;
}

// Create highlight box for key points
export function createHighlightBox(
  content: string,
  variant: 'success' | 'warning' | 'info' = 'info',
): ContentSection {
  return {
    type: 'highlight',
    content,
    variant,
    icon:
      variant === 'success' ? (
        <CheckCircle className='w-6 h-6 text-green-600' weight='fill' />
      ) : variant === 'warning' ? (
        <Warning className='w-6 h-6 text-amber-600' weight='fill' />
      ) : (
        <Info className='w-6 h-6 text-blue-600' weight='fill' />
      ),
  };
}

// Create interactive checklist
export function createChecklist(title: string, items: string[], moduleId?: string): ContentSection {
  return {
    type: 'checklist',
    content: title,
    items,
    icon: getIconForContent(title, moduleId),
  };
}
