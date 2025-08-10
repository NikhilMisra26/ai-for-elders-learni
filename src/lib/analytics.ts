import { supabase } from './supabaseClient';
import { errorHandler } from './errorHandler';

export interface PlatformStats {
  totalUsers: number;
  avgCompletion: number;
  avgRating: number;
  countriesCount: number;
}

export interface Testimonial {
  id: string;
  userName: string;
  userLocation: string | null;
  courseTier: 'free' | 'advanced' | 'expert';
  rating: number;
  content: string;
  createdAt: string;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Cache configuration - use environment variable or default to 5 minutes
const getAnalyticsCacheDuration = (): number => {
  // Check for client-side Vite environment variable first
  const viteEnvValue = import.meta.env?.VITE_ANALYTICS_CACHE_DURATION_MS as
    | string
    | undefined;
  if (typeof window !== 'undefined' && viteEnvValue) {
    return parseInt(viteEnvValue, 10);
  }
  // Fallback to server-side environment variable
  if (
    typeof process !== 'undefined' &&
    process.env?.ANALYTICS_CACHE_DURATION_MS
  ) {
    return parseInt(process.env.ANALYTICS_CACHE_DURATION_MS, 10);
  }
  // Default to 5 minutes
  return 5 * 60 * 1000;
};

const CACHE_DURATION = getAnalyticsCacheDuration();
const statsCache: { current: CachedData<PlatformStats> | null } = {
  current: null,
};
const testimonialsCache: { current: CachedData<Testimonial[]> | null } = {
  current: null,
};

// Check if cache is still valid
function isCacheValid<T>(cache: CachedData<T> | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

// Fetch platform statistics from Supabase
export async function getPlatformStats(): Promise<PlatformStats | null> {
  // Check cache first
  if (statsCache.current && isCacheValid(statsCache.current)) {
    return statsCache.current.data;
  }

  try {
    // Use the database function we created
    const { data, error } = (await supabase.rpc('get_platform_stats')) as {
      data: {
        total_users: number;
        avg_completion: number;
        avg_rating: number;
        countries_count: number;
      } | null;
      error: Error | null;
    };

    if (error) {
      errorHandler.logError('Failed to fetch platform stats', error, {
        component: 'analytics',
        action: 'get_platform_stats',
      });
      return null;
    }

    if (!data) return null;

    const stats: PlatformStats = {
      totalUsers: data.total_users ?? 0,
      avgCompletion: Math.round(data.avg_completion ?? 0),
      avgRating: Number((data.avg_rating ?? 0).toFixed(1)),
      countriesCount: data.countries_count ?? 0,
    };

    // Update cache
    statsCache.current = {
      data: stats,
      timestamp: Date.now(),
    };

    return stats;
  } catch (error) {
    errorHandler.logError(
      'Error fetching platform stats',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'analytics',
        action: 'get_platform_stats',
      },
    );
    return null;
  }
}

// Fetch approved testimonials
export async function getTestimonials(limit = 3): Promise<Testimonial[]> {
  // Check cache first
  if (testimonialsCache.current && isCacheValid(testimonialsCache.current)) {
    return testimonialsCache.current.data.slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(10); // Fetch more than needed for caching

    if (error) {
      errorHandler.logError('Failed to fetch testimonials', error, {
        component: 'analytics',
        action: 'get_testimonials',
      });
      return [];
    }

    const testimonials: Testimonial[] = (data ?? []).map(
      (t: {
        id: string;
        user_name: string;
        user_location: string;
        course_tier: string;
        rating: number;
        content: string;
        created_at: string;
      }) => ({
        id: t.id,
        userName: t.user_name,
        userLocation: t.user_location,
        courseTier: t.course_tier as 'free' | 'advanced' | 'expert',
        rating: t.rating,
        content: t.content,
        createdAt: t.created_at,
      }),
    );

    // Update cache
    testimonialsCache.current = {
      data: testimonials,
      timestamp: Date.now(),
    };

    return testimonials.slice(0, limit);
  } catch (error) {
    errorHandler.logError(
      'Error fetching testimonials',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'analytics',
        action: 'get_testimonials',
      },
    );
    return [];
  }
}

// Submit a new testimonial (for authenticated users)
export async function submitTestimonial(
  userId: string,
  data: {
    userName: string;
    userLocation?: string;
    courseTier: 'free' | 'advanced' | 'expert';
    rating: number;
    content: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('testimonials').insert({
      user_id: userId,
      user_name: data.userName,
      user_location: data.userLocation ?? null,
      course_tier: data.courseTier,
      rating: data.rating,
      content: data.content,
    });

    if (error) {
      errorHandler.logError('Failed to submit testimonial', error, {
        component: 'analytics',
        action: 'submit_testimonial',
        userId,
      });
      return {
        success: false,
        error: 'Failed to submit review. Please try again later.',
      };
    }

    // Clear testimonials cache to force refresh
    testimonialsCache.current = null;

    return { success: true };
  } catch (error) {
    errorHandler.logError(
      'Error submitting testimonial',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'analytics',
        action: 'submit_testimonial',
        userId,
      },
    );
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}

// Check if user has already submitted a testimonial
export async function hasUserSubmittedTestimonial(
  userId: string,
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('testimonials')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      errorHandler.logWarning('Failed to check user testimonial', {
        component: 'analytics',
        action: 'check_user_testimonial',
        userId,
        metadata: { error: error.message },
      });
      return false;
    }

    return (count ?? 0) > 0;
  } catch (error) {
    errorHandler.logWarning('Error checking user testimonial', {
      component: 'analytics',
      action: 'check_user_testimonial',
      userId,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return false;
  }
}

// Clear all analytics caches (useful after data updates)
export function clearAnalyticsCache(): void {
  statsCache.current = null;
  testimonialsCache.current = null;
}

// Format large numbers for display
export function formatMetricNumber(num: number): string {
  if (num >= 10000) {
    return `${Math.floor(num / 1000)}k+`;
  }
  if (num >= 1000) {
    return `${num.toLocaleString()}+`;
  }
  return num.toString();
}
