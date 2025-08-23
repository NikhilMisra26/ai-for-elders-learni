/**
 * Audio Storage Module for Vercel Blob
 * Handles audio file URL mapping from Vercel Blob Storage
 */

import { errorHandler } from './errorHandler';

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

  // In production, all files should be in Blob storage
  errorHandler.logWarning(`Audio file ${filename} not found in Blob storage mapping`, {
    component: 'audioStorage',
    action: 'getAudioUrl',
    metadata: { filename },
  });

  // Return empty string if not found
  return '';
}
