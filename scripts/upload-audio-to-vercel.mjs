#!/usr/bin/env node

/**
 * Script to upload all audio files to Vercel Blob Storage
 * Run with: node scripts/upload-audio-to-vercel.mjs
 */

import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
  console.error('Please add it to your .env.local file');
  process.exit(1);
}

// List of all audio files to upload
const AUDIO_FILES = [
  'IntroAudio.mp3',
  'Module 1.1 Part 1.mp3',
  'Module 1.1 Part 2.mp3',
  'Module 1.2 Part 1.mp3',
  'Module 1.2 Part 2.mp3',
  'Module 1.3 Part 1.mp3',
  'Module 1.3 Part 2.mp3',
  'Module 2.1 Part 1.mp3',
  'Module 2.1 Part 2.mp3',
  'Module 2.2 Part 1.mp3',
  'Module 2.2 Part 2.mp3',
  'Module 2.3 Part 1.mp3',
  'Module 2.3 Part 2.mp3',
  'Module 3.1 Part 1.mp3',
  'Module 3.1 Part 2.mp3',
  'Module 3.2 Part 1.mp3',
  'Module 3.2 Part 2.mp3',
  'Module 3.3 Part 1.mp3',
  'Module 3.3 Part 2.mp3',
  'Module 3.3 Part 3.mp3',
  'Module 4.1 Part 1.mp3',
  'Module 4.1 Part 2.mp3',
  'Module 4.2 Part 1.mp3',
  'Module 4.2 Part 2.mp3',
  'Module 4.3 Part 1.mp3',
  'Module 4.3 Part 2.mp3',
  'Conclusion part 1.mp3',
  'Conclusion Part 2.mp3',
];

async function checkExistingFiles() {
  console.log('🔍 Checking existing files in Vercel Blob...');
  
  try {
    const { blobs } = await list({ token: BLOB_TOKEN });
    const existingFiles = blobs.map(blob => blob.pathname);
    console.log(`Found ${existingFiles.length} existing files`);
    return existingFiles;
  } catch (error) {
    console.log('No existing files found or error accessing storage');
    return [];
  }
}

async function uploadAudioFiles() {
  const audioDir = path.join(__dirname, '..', 'public', 'audio');
  const existingFiles = await checkExistingFiles();
  const results = { success: [], failed: [], skipped: [] };
  const urlMappings = {};

  console.log(`\n📁 Audio directory: ${audioDir}`);
  console.log(`📊 Total files to process: ${AUDIO_FILES.length}\n`);

  for (const filename of AUDIO_FILES) {
    // Check if already uploaded
    if (existingFiles.includes(filename)) {
      console.log(`⏭️  Skipping ${filename} (already exists)`);
      results.skipped.push(filename);
      continue;
    }

    const filePath = path.join(audioDir, filename);
    
    // Check if file exists locally
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filename}`);
      results.failed.push({ filename, error: 'File not found' });
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    
    console.log(`📤 Uploading ${filename} (${fileSizeMB} MB)...`);
    
    try {
      const startTime = Date.now();
      
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        token: BLOB_TOKEN,
        addRandomSuffix: false, // Keep original filename
        contentType: 'audio/mpeg',
        cacheControlMaxAge: 31536000, // 1 year cache
        onUploadProgress: (event) => {
          const percentage = Math.round(event.percentage);
          process.stdout.write(`\r   Progress: ${percentage}%`);
        },
      });
      
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\r✅ Uploaded ${filename} in ${uploadTime}s`);
      console.log(`   URL: ${blob.url}`);
      
      results.success.push(filename);
      urlMappings[filename] = blob.url;
      
    } catch (error) {
      console.error(`\r❌ Failed to upload ${filename}:`, error.message);
      results.failed.push({ filename, error: error.message });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${results.success.length} files`);
  console.log(`⏭️  Skipped (existing): ${results.skipped.length} files`);
  console.log(`❌ Failed: ${results.failed.length} files`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed uploads:');
    results.failed.forEach(({ filename, error }) => {
      console.log(`  - ${filename}: ${error}`);
    });
  }

  // Save URL mappings to a file
  if (Object.keys(urlMappings).length > 0) {
    const mappingPath = path.join(__dirname, 'audio-blob-urls.json');
    fs.writeFileSync(mappingPath, JSON.stringify(urlMappings, null, 2));
    console.log(`\n💾 URL mappings saved to: ${mappingPath}`);
    console.log('Copy these mappings to src/lib/audioStorage.ts');
  }

  console.log('='.repeat(60));
}

// Run the upload
uploadAudioFiles().catch(console.error);