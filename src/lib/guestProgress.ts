import type {
  ModuleProgress,
  CourseProgress,
  UserActivity,
  LearningStats,
} from './progressTracking';
import { getFromGuestStorage, setToGuestStorage, removeFromGuestStorage } from './guestStorage';

export interface GuestProgressSnapshot {
  version: number;
  moduleProgress: ModuleProgress[];
  courseProgress: CourseProgress[];
  userActivity: UserActivity[];
  learningStats: LearningStats;
  lastUpdated: string;
}

const PROGRESS_KEY = 'progress';
const CURRENT_VERSION = 1;

function getDefaultSnapshot(): GuestProgressSnapshot {
  return {
    version: CURRENT_VERSION,
    moduleProgress: [],
    courseProgress: [],
    userActivity: [],
    learningStats: {
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
      weeklyGoal: 120,
      weeklyProgress: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export function loadGuestProgress(guestId: string): GuestProgressSnapshot {
  const snapshot = getFromGuestStorage<GuestProgressSnapshot>(
    guestId,
    PROGRESS_KEY,
    getDefaultSnapshot(),
  );

  // Handle version migration if needed
  if (snapshot.version !== CURRENT_VERSION) {
    // Future migration logic here
    snapshot.version = CURRENT_VERSION;
  }

  return snapshot;
}

export function saveGuestProgress(guestId: string, snapshot: GuestProgressSnapshot): void {
  snapshot.lastUpdated = new Date().toISOString();
  snapshot.version = CURRENT_VERSION;
  setToGuestStorage(guestId, PROGRESS_KEY, snapshot);
}

export function exportGuestProgress(guestId: string): string {
  const snapshot = loadGuestProgress(guestId);
  const json = JSON.stringify(snapshot);
  return btoa(json); // Base64 encode
}

export function importGuestProgress(guestId: string, base64Json: string): void {
  try {
    const json = atob(base64Json); // Base64 decode
    const snapshot = JSON.parse(json) as GuestProgressSnapshot;

    // Validate structure
    if (!snapshot.version || !Array.isArray(snapshot.moduleProgress)) {
      throw new Error('Invalid progress data structure');
    }

    saveGuestProgress(guestId, snapshot);
  } catch {
    throw new Error('Failed to import progress: Invalid data format');
  }
}

export function resetGuestProgress(guestId: string): void {
  removeFromGuestStorage(guestId, PROGRESS_KEY);
}
