import { useKV } from './kv';
import {
  upsertCourseProgress,
  upsertModuleProgress,
  addUserActivity as dbAddActivity,
} from './db';
import type { Course, Module } from './courseData';
import { courseData } from './courseData';

import { useAuth } from '@/contexts/AuthContext';

export interface ModuleProgress {
  moduleId: string;
  courseId: string;
  completedAt: string;
  timeSpent: number; // in minutes
  rating?: number;
  attempts: number;
  notes?: string;
}

export interface CourseProgress {
  courseId: string;
  startedAt: string;
  lastAccessedAt: string;
  completedModules: string[];
  currentModuleId?: string;
  totalTimeSpent: number;
  completionPercentage: number;
  completed: boolean;
  completedAt?: string;
}

export interface UserActivity {
  id: string;
  type:
    | 'module_completed'
    | 'course_started'
    | 'course_completed'
    | 'rating_given';
  title: string;
  description: string;
  timestamp: string;
  courseId?: string;
  moduleId?: string;
  metadata?: Record<string, unknown>;
}

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastLearningDate: string;
  startDate: string;
}

export interface LearningStats {
  totalTimeSpent: number; // in minutes
  modulesCompleted: number;
  coursesCompleted: number;
  averageRating: number;
  streak: LearningStreak;
  favoriteTopics: string[];
  weeklyGoal: number; // minutes per week
  weeklyProgress: number; // minutes this week
}

interface LearningRecommendations {
  continueModule?: { courseId: string; module: Module };
  startCourse?: Course;
  reviewModule?: { courseId: string; module: Module };
}

interface DashboardSummary {
  totalCourses: number;
  startedCourses: number;
  completedCourses: number;
  totalModules: number;
  completedModules: number;
  recentActivity: UserActivity[];
  recommendations: LearningRecommendations;
  weeklyProgress: number;
  weeklyGoal: number;
  currentStreak: number;
}

export interface UseProgressReturn {
  moduleProgress: ModuleProgress[];
  courseProgress: CourseProgress[];
  userActivity: UserActivity[];
  learningStats: LearningStats;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  getModuleProgress: (
    courseId: string,
    moduleId: string,
  ) => ModuleProgress | null;
  isModuleCompleted: (courseId: string, moduleId: string) => boolean;
  completeModule: (
    courseId: string,
    moduleId: string,
    timeSpent: number,
    rating?: number,
  ) => void;
  startCourse: (courseId: string) => void;
  setCurrentModule: (courseId: string, moduleId: string) => void;
  addActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void;
  getNextModule: (courseId: string) => Module | null;
  getLearningRecommendations: () => LearningRecommendations;
  rateModule: (courseId: string, moduleId: string, rating: number) => void;
  setWeeklyGoal: (minutes: number) => void;
  getDashboardSummary: () => DashboardSummary;
}

// Main progress tracking hook
export function useProgress(): UseProgressReturn {
  const { user } = useAuth();
  const [moduleProgress, setModuleProgress] = useKV<ModuleProgress[]>(
    'user-module-progress',
    [],
  );
  const [courseProgress, setCourseProgress] = useKV<CourseProgress[]>(
    'user-course-progress',
    [],
  );
  const [userActivity, setUserActivity] = useKV<UserActivity[]>(
    'user-activity',
    [],
  );
  const [learningStats, setLearningStats] = useKV<LearningStats>(
    'user-learning-stats',
    {
      totalTimeSpent: 0,
      modulesCompleted: 0,
      coursesCompleted: 0,
      averageRating: 0,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastLearningDate: '',
        startDate: new Date().toISOString(),
      },
      favoriteTopics: [],
      weeklyGoal: 120, // 2 hours per week default
      weeklyProgress: 0,
    },
  );

  // Get progress for a specific course
  const getCourseProgress = (courseId: string): CourseProgress | null => {
    return courseProgress.find((cp) => cp.courseId === courseId) ?? null;
  };

  // Get progress for a specific module
  const getModuleProgress = (
    courseId: string,
    moduleId: string,
  ): ModuleProgress | null => {
    return (
      moduleProgress.find(
        (mp) => mp.courseId === courseId && mp.moduleId === moduleId,
      ) ?? null
    );
  };

  // Check if a module is completed
  const isModuleCompleted = (courseId: string, moduleId: string): boolean => {
    return moduleProgress.some(
      (mp) => mp.courseId === courseId && mp.moduleId === moduleId,
    );
  };

  // Mark a module as completed
  const completeModule = (
    courseId: string,
    moduleId: string,
    timeSpent: number,
    rating?: number,
  ): void => {
    const course = courseData[courseId];
    const module = course?.modules.find((m) => m.id === moduleId);

    if (!course || !module) return;

    // Add or update module progress
    setModuleProgress((current) => {
      const existing = current.find(
        (mp) => mp.courseId === courseId && mp.moduleId === moduleId,
      );
      if (existing) {
        // Update existing progress
        return current.map((mp) =>
          mp.courseId === courseId && mp.moduleId === moduleId
            ? {
                ...mp,
                completedAt: new Date().toISOString(),
                timeSpent,
                rating,
                attempts: mp.attempts + 1,
              }
            : mp,
        );
      } else {
        // Add new progress
        const newProgress: ModuleProgress = {
          moduleId,
          courseId,
          completedAt: new Date().toISOString(),
          timeSpent,
          rating,
          attempts: 1,
        };
        return [...current, newProgress];
      }
    });

    // Persist module progress
    if (user) {
      upsertModuleProgress({
        user_id: user.id,
        module_id: moduleId,
        course_id: courseId,
        completed_at: new Date().toISOString(),
        time_spent: timeSpent,
        rating: rating ?? null,
        attempts: 1,
        notes: null,
      }).catch(() => {});
    }

    // Update course progress
    setCourseProgress((current) => {
      const existing = current.find((cp) => cp.courseId === courseId);
      const completedModules = moduleProgress
        .filter((mp) => mp.courseId === courseId)
        .map((mp) => mp.moduleId);

      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId);
      }

      const completionPercentage = Math.round(
        (completedModules.length / course.totalModules) * 100,
      );
      const isCompleted = completionPercentage >= 100;

      if (existing) {
        const nextState = current.map((cp) =>
          cp.courseId === courseId
            ? {
                ...cp,
                lastAccessedAt: new Date().toISOString(),
                completedModules,
                totalTimeSpent: cp.totalTimeSpent + timeSpent,
                completionPercentage,
                completed: isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : undefined,
              }
            : cp,
        );
        // Persist
        if (user) {
          const row = nextState.find((c) => c.courseId === courseId);
          if (row) {
            upsertCourseProgress({
              user_id: user.id,
              course_id: row.courseId,
              started_at: row.startedAt,
              last_accessed_at: row.lastAccessedAt,
              completed_modules: row.completedModules,
              current_module_id: row.currentModuleId ?? null,
              total_time_spent: row.totalTimeSpent,
              completion_percentage: row.completionPercentage,
              completed: row.completed,
              completed_at: row.completedAt ?? null,
            }).catch(() => {});
          }
        }
        return nextState;
      } else {
        const newCourseProgress: CourseProgress = {
          courseId,
          startedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          completedModules,
          totalTimeSpent: timeSpent,
          completionPercentage,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
        const next = [...current, newCourseProgress];
        if (user) {
          upsertCourseProgress({
            user_id: user.id,
            course_id: newCourseProgress.courseId,
            started_at: newCourseProgress.startedAt,
            last_accessed_at: newCourseProgress.lastAccessedAt,
            completed_modules: newCourseProgress.completedModules,
            current_module_id: newCourseProgress.currentModuleId ?? null,
            total_time_spent: newCourseProgress.totalTimeSpent,
            completion_percentage: newCourseProgress.completionPercentage,
            completed: newCourseProgress.completed,
            completed_at: newCourseProgress.completedAt ?? null,
          }).catch(() => {});
        }
        return next;
      }
    });

    // Add activity
    addActivity({
      type: 'module_completed',
      title: `Completed "${module.title}"`,
      description: `Finished module in ${Math.round(timeSpent)} minutes`,
      courseId,
      moduleId,
      metadata: { timeSpent, rating },
    });
    if (user) {
      dbAddActivity({
        user_id: user.id,
        type: 'module_completed',
        title: `Completed "${module.title}"`,
        description: `Finished module in ${Math.round(timeSpent)} minutes`,
        timestamp: new Date().toISOString(),
        course_id: courseId,
        module_id: moduleId,
        metadata: { timeSpent, rating },
      }).catch(() => {});
    }

    // Update learning stats
    updateLearningStats(timeSpent, module.tags, rating);

    // Check if course is completed
    const updatedCompletedModules = moduleProgress
      .filter((mp) => mp.courseId === courseId)
      .map((mp) => mp.moduleId);

    if (!updatedCompletedModules.includes(moduleId)) {
      updatedCompletedModules.push(moduleId);
    }

    if (updatedCompletedModules.length === course.totalModules) {
      addActivity({
        type: 'course_completed',
        title: `Completed "${course.title}"`,
        description: `Finished all ${course.totalModules} modules`,
        courseId,
      });
      if (user) {
        dbAddActivity({
          user_id: user.id,
          type: 'course_completed',
          title: `Completed "${course.title}"`,
          description: `Finished all ${course.totalModules} modules`,
          timestamp: new Date().toISOString(),
          course_id: courseId,
          module_id: null,
          metadata: null,
        }).catch((err) => {
          console.error('Failed to add course_completed activity to DB:', err);
        });
      }
    }
  };

  // Start or resume a course
  const startCourse = (courseId: string): void => {
    const course = courseData[courseId];
    if (!course) return;

    setCourseProgress((current) => {
      const existing = current.find((cp) => cp.courseId === courseId);
      if (existing) {
        return current.map((cp) =>
          cp.courseId === courseId
            ? { ...cp, lastAccessedAt: new Date().toISOString() }
            : cp,
        );
      } else {
        const newCourseProgress: CourseProgress = {
          courseId,
          startedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          completedModules: [],
          totalTimeSpent: 0,
          completionPercentage: 0,
          completed: false,
        };

        addActivity({
          type: 'course_started',
          title: `Started "${course.title}"`,
          description: 'Begin your learning journey',
          courseId,
        });

        return [...current, newCourseProgress];
      }
    });
  };

  // Update current module for a course
  const setCurrentModule = (courseId: string, moduleId: string): void => {
    setCourseProgress((current) =>
      current.map((cp) =>
        cp.courseId === courseId
          ? {
              ...cp,
              currentModuleId: moduleId,
              lastAccessedAt: new Date().toISOString(),
            }
          : cp,
      ),
    );
  };

  // Add user activity
  const addActivity = (
    activity: Omit<UserActivity, 'id' | 'timestamp'>,
  ): void => {
    const newActivity: UserActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setUserActivity((current) => [newActivity, ...current].slice(0, 50)); // Keep last 50 activities
  };

  // Update learning statistics
  const updateLearningStats = (
    timeSpent: number,
    tags: string[],
    rating?: number,
  ): void => {
    setLearningStats((current) => {
      const today = new Date().toISOString().split('T')[0];
      const lastLearningDate = current.streak.lastLearningDate.split('T')[0];

      // Update streak
      let newStreak = current.streak;
      if (lastLearningDate === today) {
        // Same day, don't update streak
        newStreak = current.streak;
      } else if (
        lastLearningDate ===
        new Date(Date.now() - 86400000).toISOString().split('T')[0]
      ) {
        // Yesterday, increment streak
        newStreak = {
          ...current.streak,
          currentStreak: current.streak.currentStreak + 1,
          longestStreak: Math.max(
            current.streak.longestStreak,
            current.streak.currentStreak + 1,
          ),
          lastLearningDate: new Date().toISOString(),
        };
      } else {
        // Streak broken, reset
        newStreak = {
          ...current.streak,
          currentStreak: 1,
          lastLearningDate: new Date().toISOString(),
        };
      }

      // Update favorite topics
      const updatedTopics = [...current.favoriteTopics];
      tags.forEach((tag) => {
        if (!updatedTopics.includes(tag)) {
          updatedTopics.push(tag);
        }
      });

      // Calculate new average rating
      let newAverageRating = current.averageRating;
      if (rating && rating > 0) {
        const currentModules = current.modulesCompleted;
        newAverageRating =
          (current.averageRating * currentModules + rating) /
          (currentModules + 1);
      }

      // Calculate weekly progress
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      weekStart.setHours(0, 0, 0, 0);

      const thisWeekActivity = moduleProgress
        .filter((mp) => new Date(mp.completedAt) >= weekStart)
        .reduce((total, mp) => total + mp.timeSpent, 0);

      return {
        ...current,
        totalTimeSpent: current.totalTimeSpent + timeSpent,
        modulesCompleted: current.modulesCompleted + 1,
        averageRating: newAverageRating,
        streak: newStreak,
        favoriteTopics: updatedTopics.slice(0, 10), // Keep top 10 topics
        weeklyProgress: thisWeekActivity + timeSpent,
      };
    });
  };

  // Get next recommended module
  const getNextModule = (courseId: string): Module | null => {
    const course = courseData[courseId];
    if (!course) return null;

    const progress = getCourseProgress(courseId);
    const completedModules = progress?.completedModules ?? [];

    // Find first incomplete module
    return (
      course.modules.find((module) => !completedModules.includes(module.id)) ??
      null
    );
  };

  // Get learning recommendations
  const getLearningRecommendations = (): LearningRecommendations => {
    // Find course to continue
    const inProgressCourse = courseProgress.find(
      (cp) => !cp.completed && cp.completedModules.length > 0,
    );
    if (inProgressCourse) {
      const nextModule = getNextModule(inProgressCourse.courseId);
      if (nextModule) {
        return {
          continueModule: {
            courseId: inProgressCourse.courseId,
            module: nextModule,
          },
        };
      }
    }

    // Find new course to start
    const availableCourses = Object.values(courseData).filter(
      (course) => !courseProgress.some((cp) => cp.courseId === course.id),
    );
    if (availableCourses.length > 0) {
      return {
        startCourse: availableCourses[0],
      };
    }

    // Find module to review (low rating)
    const lowRatedModule = moduleProgress.find(
      (mp) => mp.rating && mp.rating <= 3,
    );
    if (lowRatedModule) {
      const course = courseData[lowRatedModule.courseId];
      const module = course?.modules.find(
        (m) => m.id === lowRatedModule.moduleId,
      );
      if (module) {
        return {
          reviewModule: {
            courseId: lowRatedModule.courseId,
            module,
          },
        };
      }
    }

    return {};
  };

  // Rate a module
  const rateModule = (
    courseId: string,
    moduleId: string,
    rating: number,
  ): void => {
    setModuleProgress((current) =>
      current.map((mp) =>
        mp.courseId === courseId && mp.moduleId === moduleId
          ? { ...mp, rating }
          : mp,
      ),
    );

    const course = courseData[courseId];
    const module = course?.modules.find((m) => m.id === moduleId);

    if (module) {
      addActivity({
        type: 'rating_given',
        title: `Rated "${module.title}"`,
        description: `Gave ${rating} star${rating !== 1 ? 's' : ''}`,
        courseId,
        moduleId,
        metadata: { rating },
      });
    }
  };

  // Set weekly learning goal
  const setWeeklyGoal = (minutes: number): void => {
    setLearningStats((current) => ({
      ...current,
      weeklyGoal: minutes,
    }));
  };

  // Get dashboard summary
  const getDashboardSummary = (): DashboardSummary => {
    const totalCourses = Object.keys(courseData).length;
    const startedCourses = courseProgress.length;
    const completedCourses = courseProgress.filter((cp) => cp.completed).length;
    const totalModules = Object.values(courseData).reduce(
      (sum, course) => sum + course.totalModules,
      0,
    );
    const recentActivity = userActivity.slice(0, 5);
    const recommendations = getLearningRecommendations();

    return {
      totalCourses,
      startedCourses,
      completedCourses,
      totalModules,
      completedModules: learningStats.modulesCompleted,
      recentActivity,
      recommendations,
      weeklyProgress: learningStats.weeklyProgress,
      weeklyGoal: learningStats.weeklyGoal,
      currentStreak: learningStats.streak.currentStreak,
    };
  };

  return {
    moduleProgress,
    courseProgress,
    userActivity,
    learningStats,
    getCourseProgress,
    getModuleProgress,
    isModuleCompleted,
    completeModule,
    startCourse,
    setCurrentModule,
    addActivity,
    getNextModule,
    getLearningRecommendations,
    rateModule,
    setWeeklyGoal,
    getDashboardSummary,
  };
}
