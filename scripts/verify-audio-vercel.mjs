#!/usr/bin/env node

/**
 * Script to verify all audio files are accessible in Vercel Blob Storage
 * Run with: node scripts/verify-audio-vercel.mjs
 */

import { list, head } from '@vercel/blob';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not found');
  process.exit(1);
}

// Expected audio files
const EXPECTED_FILES = [
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

async function verifyAudioFiles() {
  console.log('🔍 Verifying audio files in Vercel Blob Storage...\n');
  
  const results = { found: [], missing: [], errors: [] };
  
  try {
    // List all files in storage
    const { blobs } = await list({ token: BLOB_TOKEN });
    const storedFiles = blobs.map(blob => blob.pathname);
    
    console.log(`📊 Found ${storedFiles.length} files in storage\n`);
    
    // Check each expected file
    for (const filename of EXPECTED_FILES) {
      process.stdout.write(`Checking ${filename}... `);
      
      try {
        // Check if file exists in list
        if (storedFiles.includes(filename)) {
          // Get file metadata to verify it's accessible
          const metadata = await head(filename, { token: BLOB_TOKEN });
          
          if (metadata) {
            const sizeMB = (metadata.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ Found (${sizeMB} MB)`);
            results.found.push(filename);
          } else {
            console.log(`⚠️  Listed but no metadata`);
            results.errors.push({ filename, error: 'No metadata' });
          }
        } else {
          console.log(`❌ Missing`);
          results.missing.push(filename);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.errors.push({ filename, error: error.message });
      }
    }
    
    // Check for unexpected files
    const unexpectedFiles = storedFiles.filter(
      file => file.endsWith('.mp3') && !EXPECTED_FILES.includes(file)
    );
    
    if (unexpectedFiles.length > 0) {
      console.log('\n⚠️  Unexpected audio files found:');
      unexpectedFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary:');
    console.log(`✅ Verified: ${results.found.length}/${EXPECTED_FILES.length} files`);
    console.log(`❌ Missing: ${results.missing.length} files`);
    console.log(`⚠️  Errors: ${results.errors.length} files`);
    
    if (results.missing.length > 0) {
      console.log('\nMissing files:');
      results.missing.forEach(file => console.log(`  - ${file}`));
    }
    
    if (results.errors.length > 0) {
      console.log('\nFiles with errors:');
      results.errors.forEach(({ filename, error }) => {
        console.log(`  - ${filename}: ${error}`);
      });
    }
    
    // Test URL accessibility
    if (results.found.length > 0) {
      console.log('\n🌐 Testing URL accessibility...');
      const testFile = results.found[0];
      const testBlob = blobs.find(b => b.pathname === testFile);
      
      if (testBlob) {
        console.log(`Testing: ${testBlob.url}`);
        
        try {
          const response = await fetch(testBlob.url, { method: 'HEAD' });
          if (response.ok) {
            console.log('✅ URLs are publicly accessible');
          } else {
            console.log(`⚠️  URL returned status: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Failed to access URL: ${error.message}`);
        }
      }
    }
    
    console.log('='.repeat(60));
    
    // Exit with error if not all files are found
    if (results.missing.length > 0 || results.errors.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyAudioFiles().catch(console.error);