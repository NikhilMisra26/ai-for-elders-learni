import { useState, useEffect } from 'react';

import {
  getPlatformStats,
  getTestimonials,
  formatMetricNumber,
  type Testimonial,
} from '@/lib/analytics';

export interface MetricItem {
  number: string;
  label: string;
  raw: number;
}

export interface MetricsData {
  stats: MetricItem[];
  testimonials: Testimonial[];
  isLoading: boolean;
  error: string | null;
}

// Thresholds for displaying metrics
const THRESHOLDS = {
  MIN_USERS: 1000,
  MIN_COMPLETION_RATE: 85,
  MIN_RATING: 4.0,
  MIN_COUNTRIES: 5,
};

export function useMetrics(): MetricsData {
  const [data, setData] = useState<MetricsData>({
    stats: [],
    testimonials: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchMetrics(): Promise<void> {
      try {
        // Fetch both stats and testimonials in parallel
        const [statsData, testimonialsData] = await Promise.all([
          getPlatformStats(),
          getTestimonials(3),
        ]);

        if (!mounted) return;

        const visibleStats: MetricItem[] = [];

        if (statsData) {
          // Only show user count if above threshold
          if (statsData.totalUsers >= THRESHOLDS.MIN_USERS) {
            visibleStats.push({
              number: formatMetricNumber(statsData.totalUsers),
              label: 'Happy Learners',
              raw: statsData.totalUsers,
            });
          }

          // Only show completion rate if above threshold
          if (statsData.avgCompletion >= THRESHOLDS.MIN_COMPLETION_RATE) {
            visibleStats.push({
              number: `${statsData.avgCompletion}%`,
              label: 'Course Completion',
              raw: statsData.avgCompletion,
            });
          }

          // Only show rating if above threshold and we have testimonials
          if (
            statsData.avgRating >= THRESHOLDS.MIN_RATING &&
            testimonialsData.length > 0
          ) {
            visibleStats.push({
              number: `${statsData.avgRating}/5`,
              label: 'Average Rating',
              raw: statsData.avgRating,
            });
          }

          // Only show countries if above threshold
          if (statsData.countriesCount >= THRESHOLDS.MIN_COUNTRIES) {
            visibleStats.push({
              number: `${statsData.countriesCount}+`,
              label: 'Countries Reached',
              raw: statsData.countriesCount,
            });
          }
        }

        setData({
          stats: visibleStats,
          testimonials: testimonialsData,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;

        setData({
          stats: [],
          testimonials: [],
          isLoading: false,
          error: 'Failed to load metrics',
        });
      }
    }

    fetchMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  return data;
}

// Hook for checking if we should show the stats section at all
export function useShouldShowStats(): boolean {
  const { stats, isLoading } = useMetrics();
  return !isLoading && stats.length > 0;
}

// Hook for checking if we should show testimonials section
export function useShouldShowTestimonials(): boolean {
  const { testimonials, isLoading } = useMetrics();
  return !isLoading && testimonials.length > 0;
}

