/**
 * Breadcrumbs Component
 *
 * Senior-friendly breadcrumb navigation with large touch targets
 * and clear visual hierarchy.
 */

import React, { type ReactElement } from 'react';
import { House, CaretRight } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/lib/routingConfig';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (page: string, params?: Record<string, string>) => void;
  className?: string;
}

export function Breadcrumbs({
  items,
  onNavigate,
  className = '',
}: BreadcrumbsProps): ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label='Breadcrumb navigation'
      className={`flex items-center flex-wrap gap-2 py-4 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div
            key={`${item.page}-${JSON.stringify(item.params ?? {})}`}
            className='flex items-center gap-2'
          >
            {/* Separator */}
            {!isFirst && (
              <CaretRight
                className='h-4 w-4 text-muted-foreground flex-shrink-0'
                aria-hidden='true'
              />
            )}

            {/* Breadcrumb item */}
            {isLast ? (
              // Current page - not clickable
              <span
                className='text-base font-medium text-foreground px-3 py-2'
                aria-current='page'
              >
                {isFirst && item.label === 'Home' && (
                  <House className='inline h-5 w-5 mr-2' aria-hidden='true' />
                )}
                {item.label}
              </span>
            ) : (
              // Clickable breadcrumb
              <Button
                variant='ghost'
                size='sm'
                onClick={() =>
                  onNavigate(item.page, item.params as Record<string, string>)
                }
                className='text-base text-muted-foreground hover:text-foreground min-h-[44px] px-3'
                aria-label={`Navigate to ${item.label}`}
              >
                {isFirst && item.label === 'Home' && (
                  <House className='h-5 w-5 mr-2' aria-hidden='true' />
                )}
                {item.label}
              </Button>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Mobile-optimized breadcrumbs that collapse when too long
export function MobileBreadcrumbs({
  items,
  onNavigate,
  className = '',
}: BreadcrumbsProps): ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  // On mobile, show only: First > ... > Last
  const shouldCollapse = items.length > 2;
  const displayItems = shouldCollapse
    ? [
        items[0],
        { ...items[items.length - 1], label: items[items.length - 1].label },
      ]
    : items;

  return (
    <nav
      aria-label='Breadcrumb navigation'
      className={`flex items-center gap-2 py-3 overflow-x-auto ${className}`}
    >
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment
            key={`collapsed-${item.page}-${JSON.stringify(item.params ?? {})}`}
          >
            {/* Add ellipsis for collapsed items */}
            {shouldCollapse && index === 1 && (
              <>
                <CaretRight
                  className='h-4 w-4 text-muted-foreground flex-shrink-0'
                  aria-hidden='true'
                />
                <span className='text-muted-foreground px-1'>...</span>
              </>
            )}

            {/* Separator */}
            {!isFirst && (!shouldCollapse || index !== 1) && (
              <CaretRight
                className='h-4 w-4 text-muted-foreground flex-shrink-0'
                aria-hidden='true'
              />
            )}

            {/* Breadcrumb item */}
            {isLast ? (
              <span
                className='text-sm font-medium text-foreground whitespace-nowrap px-2 py-1'
                aria-current='page'
              >
                {item.label}
              </span>
            ) : (
              <Button
                variant='ghost'
                size='sm'
                onClick={() =>
                  onNavigate(item.page, item.params as Record<string, string>)
                }
                className='text-sm text-muted-foreground hover:text-foreground min-h-[44px] px-2 whitespace-nowrap'
                aria-label={`Navigate to ${item.label}`}
              >
                {isFirst && (
                  <House className='h-4 w-4 mr-1' aria-hidden='true' />
                )}
                {item.label}
              </Button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Enhanced breadcrumbs with description
export function DescriptiveBreadcrumbs({
  items,
  onNavigate,
  description,
  className = '',
}: BreadcrumbsProps & { description?: string }): ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`border-b pb-6 mb-6 ${className}`}>
      <nav
        aria-label='Breadcrumb navigation'
        className='flex items-center flex-wrap gap-2 mb-3'
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <div
              key={`${item.page}-${JSON.stringify(item.params ?? {})}`}
              className='flex items-center gap-2'
            >
              {/* Separator */}
              {!isFirst && (
                <CaretRight
                  className='h-4 w-4 text-muted-foreground flex-shrink-0'
                  aria-hidden='true'
                />
              )}

              {/* Breadcrumb item */}
              {isLast ? (
                <span
                  className='text-lg font-semibold text-foreground px-3 py-2'
                  aria-current='page'
                >
                  {item.label}
                </span>
              ) : (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    onNavigate(item.page, item.params as Record<string, string>)
                  }
                  className='text-base text-muted-foreground hover:text-foreground min-h-[44px] px-3'
                  aria-label={`Navigate to ${item.label}`}
                >
                  {isFirst && item.label === 'Home' && (
                    <House className='h-5 w-5 mr-2' aria-hidden='true' />
                  )}
                  {item.label}
                </Button>
              )}
            </div>
          );
        })}
      </nav>

      {/* Page description */}
      {description && (
        <p className='text-muted-foreground text-base pl-3'>{description}</p>
      )}
    </div>
  );
}
