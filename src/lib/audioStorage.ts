/**
 * Audio Storage Module for Vercel Blob
 * Handles all audio file operations with Vercel Blob Storage
 */

import { put, del, list, head } from '@vercel/blob';

import { errorHandler } from './errorHandler';

// Use compile-time environment variable
const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN as string;

/**
 * Get the public URL for an audio file
 * This generates the URL synchronously without API calls
 */
export function getAudioUrlSync(filename: string): string {
  // Vercel Blob URLs follow this pattern:
  // https://[random-id].public.blob.vercel-storage.com/[filename]
  // Since we need synchronous access, we'll construct the URL
  // Note: In production, you should store the blob URLs after upload
  return `https://store_VWi2DhqIB5x7LguH.public.blob.vercel-storage.com/${encodeURIComponent(filename)}`;
}

/**
 * Upload an audio file to Vercel Blob
 */
export async function uploadAudioFile(
  filename: string,
  file: File | Buffer | ReadableStream | ArrayBuffer,
  options?: {
    onProgress?: (event: { loaded: number; total: number; percentage: number }) => void;
  },
): Promise<{ url: string; downloadUrl: string; pathname: string }> {
  try {
    const blob = await put(filename, file, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: false, // Keep original filename
      contentType: 'audio/mpeg',
      cacheControlMaxAge: 31536000, // 1 year cache
      onUploadProgress: options?.onProgress,
    });

    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
    };
  } catch (error) {
    errorHandler.logError(
      'Failed to upload audio file to Vercel Blob',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'audioStorage',
        action: 'upload',
        metadata: { filename },
      },
    );
    throw error;
  }
}

/**
 * Check if an audio file exists in Vercel Blob
 */
export async function audioFileExists(filename: string): Promise<boolean> {
  try {
    const result = await head(filename, {
      token: BLOB_TOKEN,
    });
    return !!result;
  } catch {
    // File doesn't exist or other error
    return false;
  }
}

/**
 * Delete an audio file from Vercel Blob
 */
export async function deleteAudioFile(filename: string): Promise<void> {
  try {
    await del(filename, {
      token: BLOB_TOKEN,
    });
  } catch (error) {
    errorHandler.logError(
      'Failed to delete audio file from Vercel Blob',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'audioStorage',
        action: 'delete',
        metadata: { filename },
      },
    );
    throw error;
  }
}

/**
 * List all audio files in Vercel Blob
 */
export async function listAudioFiles(): Promise<
  Array<{
    pathname: string;
    url: string;
    size: number;
    uploadedAt: Date;
  }>
> {
  try {
    const { blobs } = await list({
      token: BLOB_TOKEN,
    });

    return blobs
      .filter((blob) => blob.pathname.endsWith('.mp3'))
      .map((blob) => ({
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt),
      }));
  } catch (error) {
    errorHandler.logError(
      'Failed to list audio files from Vercel Blob',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'audioStorage',
        action: 'list',
      },
    );
    return [];
  }
}

/**
 * Storage for blob URLs after initial upload
 * In production, store these in a database or config file
 */
const AUDIO_BLOB_URLS: Record<string, string> = {
  'IntroAudio.mp3': 'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/IntroAudio.mp3',
  'Module 1.1 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%201.1%20Part%201.mp3',
  'Module 1.1 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%201.1%20Part%202.mp3',
  'Module 1.2 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%201.2%20Part%201.mp3',
  'Module 1.2 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%201.2%20Part%202.mp3',
  'Module 1.3 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%201.3%20Part%201.mp3',
  'Module 1.3 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%201.3%20Part%202.mp3',
  'Module 2.1 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%202.1%20Part%201.mp3',
  'Module 2.1 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%202.1%20Part%202.mp3',
  'Module 2.2 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%202.2%20Part%201.mp3',
  'Module 2.2 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%202.2%20Part%202.mp3',
  'Module 2.3 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%202.3%20Part%201.mp3',
  'Module 2.3 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%202.3%20Part%202.mp3',
  'Module 3.1 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.1%20Part%201.mp3',
  'Module 3.1 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.1%20Part%202.mp3',
  'Module 3.2 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.2%20Part%201.mp3',
  'Module 3.2 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.2%20Part%202.mp3',
  'Module 3.3 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.3%20Part%201.mp3',
  'Module 3.3 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.3%20Part%202.mp3',
  'Module 3.3 Part 3.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%203.3%20Part%203.mp3',
  'Module 4.1 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%204.1%20Part%201.mp3',
  'Module 4.1 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%204.1%20Part%202.mp3',
  'Module 4.2 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%204.2%20Part%201.mp3',
  'Module 4.2 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%204.2%20Part%202.mp3',
  'Module 4.3 Part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%204.3%20Part%201.mp3',
  'Module 4.3 Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Module%204.3%20Part%202.mp3',
  'Conclusion part 1.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Conclusion%20part%201.mp3',
  'Conclusion Part 2.mp3':
    'https://vwi2dhqib5x7lguh.public.blob.vercel-storage.com/Conclusion%20Part%202.mp3',

  // These will be populated after initial upload
  // Example: 'IntroAudio.mp3': 'https://abc123.public.blob.vercel-storage.com/IntroAudio.mp3'
};

/**
 * Get audio URL with fallback to local files during migration
 */
export function getAudioUrl(filename: string): string {
  // Check if we have a stored Blob URL
  if (AUDIO_BLOB_URLS[filename]) {
    return AUDIO_BLOB_URLS[filename];
  }

  // Fallback to local files during migration
  if (import.meta.env.DEV) {
    return `/audio/${filename}`;
  }

  // In production, all files should be in Blob storage
  // Use errorHandler instead of console.warn for production
  if (!import.meta.env.DEV) {
    errorHandler.logWarning(`Audio file ${filename} not found in Blob storage mapping`, {
      component: 'audioStorage',
      action: 'getAudioUrl',
      metadata: { filename },
    });
  }
  return getAudioUrlSync(filename);
}
