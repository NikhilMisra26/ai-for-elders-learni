/**
 * Audio file mapping for MP3-based narration system
 * Maps module and part IDs to their corresponding audio files
 */

export interface AudioFile {
  id: string;
  filename: string;
  title: string;
  duration?: number; // Duration in seconds if known
}

export interface AudioPlaylist {
  moduleId: string;
  partId?: string;
  files: AudioFile[];
  autoAdvance: boolean; // Whether to auto-play next file in sequence
}

/**
 * Audio file mappings based on the files in the audio/ folder
 */
export const audioFileMap: Record<string, AudioFile[]> = {
  // Introduction module
  introduction: [
    {
      id: 'intro-1',
      filename: 'IntroAudio.mp3',
      title: 'Introduction to AI',
    },
  ],

  // Module 1 - Understanding AI parts
  'understanding-ai-ai-in-simple-terms': [
    {
      id: 'module-1-1-part-1',
      filename: 'Module 1.1 Part 1.mp3',
      title: 'AI in Simple Terms - Part 1',
    },
    {
      id: 'module-1-1-part-2',
      filename: 'Module 1.1 Part 2.mp3',
      title: 'AI in Simple Terms - Part 2',
    },
  ],

  'understanding-ai-everyday-ai-you-use': [
    {
      id: 'module-1-2-part-1',
      filename: 'Module 1.2 Part 1.mp3',
      title: 'Everyday AI You Use - Part 1',
    },
    {
      id: 'module-1-2-part-2',
      filename: 'Module 1.2 Part 2.mp3',
      title: 'Everyday AI You Use - Part 2',
    },
  ],

  'understanding-ai-what-ai-can-cant-do': [
    {
      id: 'module-1-3-part-1',
      filename: 'Module 1.3 Part 1.mp3',
      title: "What AI Can and Can't Do - Part 1",
    },
    {
      id: 'module-1-3-part-2',
      filename: 'Module 1.3 Part 2.mp3',
      title: "What AI Can and Can't Do - Part 2",
    },
  ],

  // Module 2 - Staying Safe with AI parts
  'staying-safe-ai-recognizing-ai-scams': [
    {
      id: 'module-2-1-part-1',
      filename: 'Module 2.1 Part 1.mp3',
      title: 'Recognizing AI Scams - Part 1',
    },
    {
      id: 'module-2-1-part-2',
      filename: 'Module 2.1 Part 2.mp3',
      title: 'Recognizing AI Scams - Part 2',
    },
  ],

  'staying-safe-ai-privacy-personal-information': [
    {
      id: 'module-2-2-part-1',
      filename: 'Module 2.2 Part 1.mp3',
      title: 'Privacy and Personal Information - Part 1',
    },
    {
      id: 'module-2-2-part-2',
      filename: 'Module 2.2 Part 2.mp3',
      title: 'Privacy and Personal Information - Part 2',
    },
  ],

  'staying-safe-ai-fact-checking-verification': [
    {
      id: 'module-2-3-part-1',
      filename: 'Module 2.3 Part 1.mp3',
      title: 'Fact-Checking and Verification - Part 1',
    },
    {
      id: 'module-2-3-part-2',
      filename: 'Module 2.3 Part 2.mp3',
      title: 'Fact-Checking and Verification - Part 2',
    },
  ],

  // Module 3 - First AI Conversation parts
  'first-ai-conversation-getting-started-chatgpt': [
    {
      id: 'module-3-1-part-1',
      filename: 'Module 3.1 Part 1.mp3',
      title: 'Getting Started with ChatGPT - Part 1',
    },
    {
      id: 'module-3-1-part-2',
      filename: 'Module 3.1 Part 2.mp3',
      title: 'Getting Started with ChatGPT - Part 2',
    },
  ],

  'first-ai-conversation-writing-effective-prompts': [
    {
      id: 'module-3-2-part-1',
      filename: 'Module 3.2 Part 1.mp3',
      title: 'Writing Effective Prompts - Part 1',
    },
    {
      id: 'module-3-2-part-2',
      filename: 'Module 3.2 Part 2.mp3',
      title: 'Writing Effective Prompts - Part 2',
    },
  ],

  'first-ai-conversation-practice-conversations': [
    {
      id: 'module-3-3-part-1',
      filename: 'Module 3.3 Part 1.mp3',
      title: 'Practice Conversations - Part 1',
    },
    {
      id: 'module-3-3-part-2',
      filename: 'Module 3.3 Part 2.mp3',
      title: 'Practice Conversations - Part 2',
    },
    {
      id: 'module-3-3-part-3',
      filename: 'Module 3.3 Part 3.mp3',
      title: 'Practice Conversations - Part 3',
    },
  ],

  // Module 4 - AI for Daily Life parts
  'ai-daily-life-health-wellness-support': [
    {
      id: 'module-4-1-part-1',
      filename: 'Module 4.1 Part 1.mp3',
      title: 'Health and Wellness Support - Part 1',
    },
    {
      id: 'module-4-1-part-2',
      filename: 'Module 4.1 Part 2.mp3',
      title: 'Health and Wellness Support - Part 2',
    },
  ],

  'ai-daily-life-family-social-connections': [
    {
      id: 'module-4-2-part-1',
      filename: 'Module 4.2 Part 1.mp3',
      title: 'Family and Social Connections - Part 1',
    },
    {
      id: 'module-4-2-part-2',
      filename: 'Module 4.2 Part 2.mp3',
      title: 'Family and Social Connections - Part 2',
    },
  ],

  'ai-daily-life-hobbies-personal-growth': [
    {
      id: 'module-4-3-part-1',
      filename: 'Module 4.3 Part 1.mp3',
      title: 'Hobbies and Personal Growth - Part 1',
    },
    {
      id: 'module-4-3-part-2',
      filename: 'Module 4.3 Part 2.mp3',
      title: 'Hobbies and Personal Growth - Part 2',
    },
  ],

  // Conclusion
  conclusion: [
    {
      id: 'conclusion-part-1',
      filename: 'Conclusion part 1.mp3',
      title: 'Conclusion - Part 1',
    },
    {
      id: 'conclusion-part-2',
      filename: 'Conclusion Part 2.mp3',
      title: 'Conclusion - Part 2',
    },
  ],
};

/**
 * Get audio playlist for a specific module and part
 */
export function getAudioPlaylist(moduleId: string, partId?: string): AudioPlaylist | null {
  // Generate the key based on module and part IDs
  const key = partId ? `${moduleId}-${partId}` : moduleId;

  // eslint-disable-next-line no-console
  console.log('[AudioMapping] Looking for audio with key:', key);
  // eslint-disable-next-line no-console
  console.log('[AudioMapping] Available keys:', Object.keys(audioFileMap));

  const files = audioFileMap[key];
  if (!files) {
    // eslint-disable-next-line no-console
    console.log('[AudioMapping] No audio files found for key:', key);
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(
    '[AudioMapping] Found audio files:',
    files.map((f) => f.filename),


  const files = audioFileMap[key];
  if (!files) {
    return null;
  }
  return {
    moduleId,
    partId,
    files,
    autoAdvance: true, // Auto-advance within the same module/part
  };
}

/**
 * Get the full path to an audio file
 */
export function getAudioFilePath(filename: string): string {
  return `/audio/${filename}`;
}

/**
 * Get all available audio files for a module (all parts combined)
 */
export function getModuleAudioFiles(moduleId: string): AudioFile[] {
  const allFiles: AudioFile[] = [];

  // Find all keys that start with this moduleId
  Object.keys(audioFileMap).forEach((key) => {
    if (key === moduleId || key.startsWith(`${moduleId}-`)) {
      allFiles.push(...audioFileMap[key]);
    }
  });

  return allFiles;
}

/**
 * Check if audio files exist for a given module/part combination
 */
export function hasAudioFiles(moduleId: string, partId?: string): boolean {
  const key = partId ? `${moduleId}-${partId}` : moduleId;
  return key in audioFileMap;
}

/**
 * Get estimated total duration for a playlist (if durations are available)
 */
export function getPlaylistDuration(playlist: AudioPlaylist): number {
  return playlist.files.reduce((total, file) => {
    return total + (file.duration ?? 0);
  }, 0);
}
