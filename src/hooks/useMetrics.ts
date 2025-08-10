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

// Thresholds for displaying metrics, configurable via environment variables
function getEnvNumber(varName: string, defaultValue: number): number {
  console.log(`🔍 useMetrics: Getting environment variable ${varName}`);

  // Use import.meta.env for Vite instead of process.env
  const value = import.meta.env[varName];

  console.log(`📋 useMetrics: Raw value for ${varName}:`, value);
  console.log(`📋 useMetrics: Value type:`, typeof value);
  console.log(`📋 useMetrics: Value === undefined:`, value === undefined);
  console.log(`📋 useMetrics: Value === null:`, value === null);
  console.log(`📋 useMetrics: Value === '':`, value === '');

  if (value === undefined || value === null || value === '') {
    console.warn(
      `⚠️ useMetrics: Environment variable ${varName} is missing or empty, using default: ${defaultValue}`,
    );
    return defaultValue;
  }

  const parsed = Number(value);
  console.log(`🔢 useMetrics: Parsed number for ${varName}:`, parsed);
  console.log(`🔢 useMetrics: isNaN(parsed):`, isNaN(parsed));

  if (isNaN(parsed)) {
    console.error(
      `❌ useMetrics: Environment variable ${varName} contains invalid number "${value}", using default: ${defaultValue}`,
    );
    return defaultValue;
  }

  console.log(`✅ useMetrics: Successfully parsed ${varName} = ${parsed}`);
  return parsed;
}

console.log('🚀 useMetrics: Initializing thresholds...');
console.log(
  '🔍 useMetrics: Available import.meta.env keys:',
  Object.keys(import.meta.env),
);

const THRESHOLDS = {
  MIN_USERS: getEnvNumber('VITE_MIN_USERS', 1000),
  MIN_COMPLETION_RATE: getEnvNumber('VITE_MIN_COMPLETION_RATE', 85),
  MIN_RATING: getEnvNumber('VITE_MIN_RATING', 4.0),
  MIN_COUNTRIES: getEnvNumber('VITE_MIN_COUNTRIES', 5),
};

console.log('📊 useMetrics: Final THRESHOLDS configuration:', THRESHOLDS);

export function useMetrics(): MetricsData {
  console.log('🎯 useMetrics: Hook initialized');

  const [data, setData] = useState<MetricsData>({
    stats: [],
    testimonials: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('🔄 useMetrics: useEffect triggered');
    let mounted = true;

    async function fetchMetrics(): Promise<void> {
      console.log('📡 useMetrics: Starting to fetch metrics...');
      console.log('📊 useMetrics: Using thresholds:', THRESHOLDS);

      try {
        console.log(
          '⏳ useMetrics: Fetching stats and testimonials in parallel...',
        );

        // Fetch both stats and testimonials in parallel
        const [statsData, testimonialsData] = await Promise.all([
          getPlatformStats(),
          getTestimonials(3),
        ]);

        console.log('📈 useMetrics: Raw stats data:', statsData);
        console.log('💬 useMetrics: Raw testimonials data:', testimonialsData);

        if (!mounted) {
          console.log(
            '🚫 useMetrics: Component unmounted, skipping data update',
          );
          return;
        }

        const visibleStats: MetricItem[] = [];

        if (statsData) {
          console.log('🔍 useMetrics: Processing stats data...');

          // Only show user count if above threshold
          console.log(
            `👥 useMetrics: Checking users - ${statsData.totalUsers} >= ${THRESHOLDS.MIN_USERS}?`,
            statsData.totalUsers >= THRESHOLDS.MIN_USERS,
          );
          if (statsData.totalUsers >= THRESHOLDS.MIN_USERS) {
            const userStat = {
              number: formatMetricNumber(statsData.totalUsers),
              label: 'Happy Learners',
              raw: statsData.totalUsers,
            };
            console.log('✅ useMetrics: Adding user stat:', userStat);
            visibleStats.push(userStat);
          }

          // Only show completion rate if above threshold
          console.log(
            `📚 useMetrics: Checking completion - ${statsData.avgCompletion} >= ${THRESHOLDS.MIN_COMPLETION_RATE}?`,
            statsData.avgCompletion >= THRESHOLDS.MIN_COMPLETION_RATE,
          );
          if (statsData.avgCompletion >= THRESHOLDS.MIN_COMPLETION_RATE) {
            const completionStat = {
              number: `${statsData.avgCompletion}%`,
              label: 'Course Completion',
              raw: statsData.avgCompletion,
            };
            console.log(
              '✅ useMetrics: Adding completion stat:',
              completionStat,
            );
            visibleStats.push(completionStat);
          }

          // Only show rating if above threshold and we have testimonials
          console.log(
            `⭐ useMetrics: Checking rating - ${statsData.avgRating} >= ${THRESHOLDS.MIN_RATING} AND testimonials.length = ${testimonialsData.length} > 0?`,
            statsData.avgRating >= THRESHOLDS.MIN_RATING &&
              testimonialsData.length > 0,
          );
          if (
            statsData.avgRating >= THRESHOLDS.MIN_RATING &&
            testimonialsData.length > 0
          ) {
            const ratingStat = {
              number: `${statsData.avgRating}/5`,
              label: 'Average Rating',
              raw: statsData.avgRating,
            };
            console.log('✅ useMetrics: Adding rating stat:', ratingStat);
            visibleStats.push(ratingStat);
          }

          // Only show countries if above threshold
          console.log(
            `🌍 useMetrics: Checking countries - ${statsData.countriesCount} >= ${THRESHOLDS.MIN_COUNTRIES}?`,
            statsData.countriesCount >= THRESHOLDS.MIN_COUNTRIES,
          );
          if (statsData.countriesCount >= THRESHOLDS.MIN_COUNTRIES) {
            const countriesStat = {
              number: `${statsData.countriesCount}+`,
              label: 'Countries Reached',
              raw: statsData.countriesCount,
            };
            console.log('✅ useMetrics: Adding countries stat:', countriesStat);
            visibleStats.push(countriesStat);
          }
        } else {
          console.warn('⚠️ useMetrics: No stats data received');
        }

        console.log('📊 useMetrics: Final visible stats:', visibleStats);
        console.log(
          '💬 useMetrics: Final testimonials count:',
          testimonialsData.length,
        );

        const newData = {
          stats: visibleStats,
          testimonials: testimonialsData,
          isLoading: false,
          error: null,
        };

        console.log('✅ useMetrics: Setting final data:', newData);
        setData(newData);
      } catch (error) {
        console.error('❌ useMetrics: Error fetching metrics:', error);

        if (!mounted) {
          console.log(
            '🚫 useMetrics: Component unmounted, skipping error update',
          );
          return;
        }

        const errorData = {
          stats: [],
          testimonials: [],
          isLoading: false,
          error: 'Failed to load metrics',
        };

        console.log('🔴 useMetrics: Setting error data:', errorData);
        setData(errorData);
      }
    }

    void fetchMetrics();

    return (): void => {
      console.log('🧹 useMetrics: Cleanup - setting mounted to false');
      mounted = false;
    };
  }, []);

  console.log('📤 useMetrics: Returning data:', data);
  return data;
}

// Hook for checking if we should show the stats section at all
export function useShouldShowStats(): boolean {
  console.log('📊 useShouldShowStats: Hook called');
  const { stats, isLoading } = useMetrics();
  const shouldShow = !isLoading && stats.length > 0;
  console.log(
    `📊 useShouldShowStats: isLoading=${isLoading}, stats.length=${stats.length}, shouldShow=${shouldShow}`,
  );
  return shouldShow;
}

// Hook for checking if we should show testimonials section
export function useShouldShowTestimonials(): boolean {
  console.log('💬 useShouldShowTestimonials: Hook called');
  const { testimonials, isLoading } = useMetrics();
  const shouldShow = !isLoading && testimonials.length > 0;
  console.log(
    `💬 useShouldShowTestimonials: isLoading=${isLoading}, testimonials.length=${testimonials.length}, shouldShow=${shouldShow}`,
  );
  return shouldShow;
}
