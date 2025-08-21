import type { ReactElement } from 'react';
import { createElement } from 'react';
import { CheckCircle, Warning, Lightbulb, Pencil, Star } from '@phosphor-icons/react';
import DOMPurify from 'dompurify';

// Types
export interface ContentSection {
  title: string;
  content: string;
  level: number;
  type: SectionType;
  id: string;
}

export enum SectionType {
  NORMAL = 'normal',
  WARNING = 'warning',
  TIP = 'tip',
  EXERCISE = 'exercise',
  KEYPOINT = 'keypoint',
  SUCCESS = 'success',
}

// Get default title for section types
const getDefaultTitleForType = (type: SectionType): string => {
  switch (type) {
    case SectionType.WARNING:
      return 'Important Warning';
    case SectionType.TIP:
      return 'Helpful Tip';
    case SectionType.EXERCISE:
      return 'Practice Exercise';
    case SectionType.SUCCESS:
      return 'Success';
    case SectionType.KEYPOINT:
      return 'Key Point';
    case SectionType.NORMAL:
    default:
      return 'Section';
  }
};

// Parse content into sections based on markdown-like headers
export const parseContentSections = (content: string): ContentSection[] => {
  const lines = content.split('\n');
  const sections: ContentSection[] = [];
  let currentSection: Partial<ContentSection> | null = null;
  let sectionCounter = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for headers
    const headerMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      // Save previous section if it exists
      if (currentSection?.title) {
        sections.push({
          title: currentSection.title,
          content: (currentSection.content ?? '').trim(),
          level: currentSection.level ?? 1,
          type: currentSection.type ?? SectionType.NORMAL,
          id: `section-${sectionCounter++}`,
        });
      }

      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      currentSection = {
        title,
        content: '',
        level,
        type: SectionType.NORMAL,
      };
      continue;
    }

    // Check for special blocks
    let sectionType = SectionType.NORMAL;
    let processedLine = trimmedLine;

    if (trimmedLine.startsWith('⚠️')) {
      sectionType = SectionType.WARNING;
      processedLine = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('💡')) {
      sectionType = SectionType.TIP;
      processedLine = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('✅')) {
      sectionType = SectionType.SUCCESS;
      processedLine = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('📝')) {
      sectionType = SectionType.EXERCISE;
      processedLine = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('🔑') || trimmedLine.startsWith('⭐')) {
      sectionType = SectionType.KEYPOINT;
      processedLine = trimmedLine.substring(2).trim();
    }

    // If we found a special block and don't have a current section, create one
    if (sectionType !== SectionType.NORMAL && !currentSection) {
      currentSection = {
        title: getDefaultTitleForType(sectionType),
        content: '',
        level: 2,
        type: sectionType,
      };
    }

    // Update section type if we found a special block
    if (currentSection && sectionType !== SectionType.NORMAL) {
      currentSection.type = sectionType;
    }

    // Add content to current section
    if (currentSection) {
      const contentToAdd = processedLine ?? line;
      currentSection.content = currentSection.content
        ? `${currentSection.content}\n${contentToAdd}`
        : contentToAdd;
    }
  }

  // Add the last section if it exists
  if (currentSection?.title) {
    sections.push({
      title: currentSection.title,
      content: (currentSection.content ?? '').trim(),
      level: currentSection.level ?? 1,
      type: currentSection.type ?? SectionType.NORMAL,
      id: `section-${sectionCounter++}`,
    });
  }

  return sections;
};

// Get icon for different section types
export const getIconForSectionType = (type: SectionType): ReactElement => {
  const iconProps = {
    size: 24,
    weight: 'regular' as const,
  };

  switch (type) {
    case SectionType.WARNING:
      return createElement(Warning, iconProps);
    case SectionType.TIP:
      return createElement(Lightbulb, iconProps);
    case SectionType.EXERCISE:
      return createElement(Pencil, iconProps);
    case SectionType.SUCCESS:
      return createElement(CheckCircle, iconProps);
    case SectionType.KEYPOINT:
      return createElement(Star, iconProps);
    case SectionType.NORMAL:
    default:
      return createElement('div', { className: 'w-6 h-6' });
  }
};

// Render a section with appropriate visual styling
export const renderSectionWithStyle = (section: ContentSection): ReactElement => {
  const baseClasses = 'mb-6 p-4 rounded-lg border-l-4';
  const icon = getIconForSectionType(section.type);

  let typeClasses = '';
  let iconColor = '';

  switch (section.type) {
    case SectionType.WARNING:
      typeClasses = 'bg-amber-50 border-amber-400 text-amber-900';
      iconColor = 'text-amber-600';
      break;
    case SectionType.TIP:
      typeClasses = 'bg-purple-50 border-purple-400 text-purple-900';
      iconColor = 'text-purple-600';
      break;
    case SectionType.EXERCISE:
      typeClasses = 'bg-blue-50 border-blue-400 text-blue-900';
      iconColor = 'text-blue-600';
      break;
    case SectionType.SUCCESS:
      typeClasses = 'bg-green-50 border-green-400 text-green-900';
      iconColor = 'text-green-600';
      break;
    case SectionType.KEYPOINT:
      typeClasses = 'bg-yellow-50 border-yellow-400 text-yellow-900';
      iconColor = 'text-yellow-600';
      break;
    case SectionType.NORMAL:
    default:
      typeClasses = 'bg-gray-50 border-gray-300 text-gray-900';
      iconColor = 'text-gray-600';
      break;
  }

  const HeadingTag = `h${Math.min(section.level, 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return createElement(
    'div',
    {
      className: `${baseClasses} ${typeClasses}`,
      key: section.id,
    },
    createElement(
      'div',
      { className: 'flex items-start gap-3 mb-3' },
      createElement('div', { className: `${iconColor} flex-shrink-0 mt-1` }, icon),
      createElement(
        HeadingTag,
        {
          className: `font-semibold text-lg ${section.level === 1 ? 'text-2xl' : section.level === 2 ? 'text-xl' : 'text-lg'}`,
        },
        section.title,
      ),
    ),
    createElement('div', {
      className: 'prose prose-sm max-w-none',
      dangerouslySetInnerHTML: { __html: formatSpecialBlocks(section.content) },
    }),
  );
};

// Format special content blocks (warnings, tips, exercises)
// SECURITY: Sanitizes HTML output to prevent XSS attacks
export const formatSpecialBlocks = (content: string): string => {
  // First, escape any HTML in the original content to prevent XSS
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  let formattedContent = escapedContent;

  // Handle bullet points (safe because content is already escaped)
  formattedContent = formattedContent.replace(
    /^- (.+)$/gm,
    '<li class="ml-4 mb-2 list-disc list-inside">$1</li>',
  );

  // Handle numbered lists (safe because content is already escaped)
  formattedContent = formattedContent.replace(
    /^(\d+)\.\s(.+)$/gm,
    '<li class="ml-4 mb-2 list-decimal list-inside"><span class="font-medium">$1.</span> $2</li>',
  );

  // Wrap consecutive list items in ul/ol tags
  formattedContent = formattedContent.replace(
    /(<li class="ml-4 mb-2 list-disc[^>]*>.*?<\/li>)(?:\s*\n\s*(<li class="ml-4 mb-2 list-disc[^>]*>.*?<\/li>))*/gs,
    '<ul class="mb-4">$&</ul>',
  );

  formattedContent = formattedContent.replace(
    /(<li class="ml-4 mb-2 list-decimal[^>]*>.*?<\/li>)(?:\s*\n\s*(<li class="ml-4 mb-2 list-decimal[^>]*>.*?<\/li>))*/gs,
    '<ol class="mb-4">$&</ol>',
  );

  // Handle bold text (safe because content is already escaped)
  formattedContent = formattedContent.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold">$1</strong>',
  );

  // Handle italic text (safe because content is already escaped)
  formattedContent = formattedContent.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Handle inline code (safe because content is already escaped)
  formattedContent = formattedContent.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">$1</code>',
  );

  // Handle paragraphs (split by double newlines)
  const paragraphs = formattedContent.split(/\n\s*\n/);
  formattedContent = paragraphs
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';

      // Don't wrap if it's already a list or HTML element
      if (
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<h')
      ) {
        return trimmed;
      }

      return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  // Sanitize the final HTML with DOMPurify to ensure safety
  // This allows only safe HTML tags and attributes
  const sanitized = DOMPurify.sanitize(formattedContent, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'code',
      'ul',
      'ol',
      'li',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'div',
    ],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
  });

  return sanitized;
};

// Utility function to extract content sections from course module content
export const extractContentSections = (moduleContent: string): ContentSection[] => {
  return parseContentSections(moduleContent);
};

// Utility function to render all sections from a module
export const renderModuleSections = (moduleContent: string): ReactElement[] => {
  const sections = extractContentSections(moduleContent);
  return sections.map((section) => renderSectionWithStyle(section));
};
