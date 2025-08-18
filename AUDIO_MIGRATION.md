# Audio Migration to Vercel Blob Storage

## Overview
This guide provides a complete, step-by-step implementation for migrating 28.8MB of MP3 audio files from the `/public/audio/` folder to Vercel Blob Storage. This migration will reduce deployment size, improve performance through Vercel's global CDN, and provide 100GB/month free bandwidth (50x more than Supabase's 2GB).

## Benefits of Migration
- **Generous Bandwidth**: 100GB/month free tier (vs 2GB with Supabase)
- **Native Integration**: Seamless integration with Vercel hosting platform
- **CDN Performance**: Global edge caching for faster audio delivery
- **Reduced Deployment Size**: Audio files won't be included in deployments
- **Better Management**: Easy file updates via Vercel dashboard or API
- **Cost Effective**: Free tier covers typical educational platform usage

## Prerequisites
- Vercel account with project deployed
- Node.js 18+ installed locally
- `pnpm` package manager installed
- Environment variables configured

## Step 1: Install Vercel Blob SDK

Install the Vercel Blob client library:

```bash
pnpm add @vercel/blob
```

For development tools (optional but recommended):
```bash
pnpm add -D dotenv dotenv-expand
```

## Step 2: Setup Vercel Blob Storage

### 2.1 Enable Blob Storage in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** → Select **Blob**
4. Choose a name for your store (e.g., `audio-files`)
5. Select your preferred region (choose closest to your users)
6. Click **Create**

### 2.2 Get Environment Variables

After creation, Vercel will provide you with:
- `BLOB_READ_WRITE_TOKEN` - For server-side operations

Copy these to your `.env.local`:

```env
# Add to .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx
```

### 2.3 Pull Environment Variables (if using Vercel CLI)

```bash
vercel env pull .env.local
```

## Step 3: Create Audio Storage Module

Create `src/lib/audioStorage.ts` with comprehensive Vercel Blob integration:

```typescript
/**
 * Audio Storage Module for Vercel Blob
 * Handles all audio file operations with Vercel Blob Storage
 */

import { put, del, list, head } from '@vercel/blob';
import { errorHandler } from './errorHandler';

// Use compile-time environment variable
const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN;

/**
 * Get the public URL for an audio file
 * This generates the URL synchronously without API calls
 */
export function getAudioUrlSync(filename: string): string {
  // Vercel Blob URLs follow this pattern:
  // https://[random-id].public.blob.vercel-storage.com/[filename]
  // Since we need synchronous access, we'll construct the URL
  // Note: In production, you should store the blob URLs after upload
  return `https://[store-id].public.blob.vercel-storage.com/${encodeURIComponent(filename)}`;
}

/**
 * Upload an audio file to Vercel Blob
 */
export async function uploadAudioFile(
  filename: string,
  file: File | Buffer | ReadableStream | ArrayBuffer,
  options?: {
    onProgress?: (event: { loaded: number; total: number; percentage: number }) => void;
  }
): Promise<{ url: string; downloadUrl: string; pathname: string; size: number }> {
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
      size: blob.size,
    };
  } catch (error) {
    errorHandler.logError(
      'Failed to upload audio file to Vercel Blob',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'audioStorage',
        action: 'upload',
        metadata: { filename },
      }
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
  } catch (error) {
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
      }
    );
    throw error;
  }
}

/**
 * List all audio files in Vercel Blob
 */
export async function listAudioFiles(): Promise<Array<{
  pathname: string;
  url: string;
  size: number;
  uploadedAt: Date;
}>> {
  try {
    const { blobs } = await list({
      token: BLOB_TOKEN,
    });
    
    return blobs
      .filter(blob => blob.pathname.endsWith('.mp3'))
      .map(blob => ({
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
      }
    );
    return [];
  }
}

/**
 * Storage for blob URLs after initial upload
 * In production, store these in a database or config file
 */
const AUDIO_BLOB_URLS: Record<string, string> = {
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
  console.warn(`Audio file ${filename} not found in Blob storage mapping`);
  return getAudioUrlSync(filename);
}
```

## Step 4: Create Upload Script

Create `scripts/upload-audio-to-vercel.mjs`:

```javascript
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
```

## Step 5: Create Verification Script

Create `scripts/verify-audio-vercel.mjs`:

```javascript
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
```

## Step 6: Update Audio Mapping

Update `src/lib/audioMapping.ts` to use Vercel Blob URLs:

```typescript
/**
 * Get the full path to an audio file
 */
export function getAudioFilePath(filename: string): string {
  // Import the new audio storage module
  // During migration, this will handle both Blob and local files
  return getAudioUrl(filename);
}

// Or directly use Blob URLs after migration is complete:
export function getAudioFilePath(filename: string): string {
  // Replace [store-id] with your actual Blob store ID from Vercel dashboard
  return `https://[store-id].public.blob.vercel-storage.com/${encodeURIComponent(filename)}`;
}
```

## Step 7: Update Audio Player Hook

Update `src/hooks/useMP3AudioPlayer.ts`:

```typescript
// At the top of the file
import { getAudioUrl } from '@/lib/audioStorage';

// In the component where audio.src is set, replace:
// audio.src = `/audio/${filename}`;
// or
// audio.src = getAudioFilePath(filename);

// With:
audio.src = getAudioUrl(filename);
```

## Step 8: Add Package.json Scripts

Add these helper scripts to `package.json`:

```json
{
  "scripts": {
    "audio:upload": "node scripts/upload-audio-to-vercel.mjs",
    "audio:verify": "node scripts/verify-audio-vercel.mjs",
    "audio:list": "node -e \"import('@vercel/blob').then(({list}) => list({token: process.env.BLOB_READ_WRITE_TOKEN}).then(r => console.log(JSON.stringify(r.blobs, null, 2))))\"",
    "audio:migrate": "pnpm run audio:upload && pnpm run audio:verify"
  }
}
```

## Step 9: Configure Vite (if needed)

If environment variables aren't loading, update `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from 'vite';
import dotenvExpand from 'dotenv-expand';

export default defineConfig(({ mode }) => {
  // Load env files in development
  if (mode === 'development') {
    const env = loadEnv(mode, process.cwd(), '');
    dotenvExpand.expand({ parsed: env });
  }

  return {
    // your config
  };
});
```

## Step 10: Migration Execution

### Manual Steps to Execute:

1. **Install dependencies:**
   ```bash
   pnpm add @vercel/blob
   pnpm add -D dotenv dotenv-expand
   ```

2. **Set up Vercel Blob in Dashboard:**
   - Go to Vercel Dashboard → Your Project → Storage
   - Create a new Blob store
   - Copy the `BLOB_READ_WRITE_TOKEN` to `.env.local`

3. **Upload audio files:**
   ```bash
   pnpm run audio:upload
   ```

4. **Verify migration:**
   ```bash
   pnpm run audio:verify
   ```

5. **Update URL mappings:**
   - Copy URLs from `scripts/audio-blob-urls.json`
   - Update `src/lib/audioStorage.ts` with actual blob URLs

6. **Test locally:**
   ```bash
   pnpm run dev
   ```
   - Navigate to modules with audio
   - Verify audio plays correctly from Blob URLs

7. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

8. **Clean up (after verification):**
   ```bash
   # Backup first
   tar -czf audio-backup.tar.gz public/audio/
   
   # Remove local files
   rm -rf public/audio/
   ```

## Troubleshooting

### CORS Issues
Vercel Blob automatically handles CORS for public files. If you encounter issues:
1. Ensure files are uploaded with `access: 'public'`
2. Check that your domain is properly configured in Vercel

### Environment Variables Not Loading
1. Ensure `.env.local` exists with correct values
2. Restart your dev server after changing env files
3. Use the Vite config provided above if using Vite

### File Not Found
1. Run `pnpm run audio:list` to see all uploaded files
2. Check that filenames match exactly (case-sensitive)
3. Verify the blob store ID in your URLs

### Upload Failures
1. Check your token has write permissions
2. Ensure file sizes are under 500MB (Vercel Blob limit)
3. Verify network connectivity

## Security Considerations

1. **Token Security:**
   - Never commit `BLOB_READ_WRITE_TOKEN` to git
   - Use environment variables only
   - In production, use Vercel's environment variable system

2. **Access Control:**
   - Files are public read-only by default
   - Write operations require authentication token
   - Consider implementing server-side upload endpoints for user uploads

3. **URL Validation:**
   - Always encode filenames in URLs
   - Validate file types before upload
   - Implement rate limiting for upload endpoints

## Performance Optimizations

1. **Caching:**
   - Blob files are cached at edge locations globally
   - Set appropriate cache headers (1 year for static audio)
   - Consider service worker caching for offline support

2. **Streaming:**
   - Audio files stream automatically
   - Use `preload="metadata"` for better performance
   - Implement progressive loading for large files

3. **Compression:**
   - Consider compressing audio files before upload
   - Use appropriate bitrates (64-128kbps for speech)
   - Balance quality vs file size

## Expected Results

After migration:
- ✅ Deployment size reduced by 28.8MB
- ✅ 100GB monthly bandwidth available
- ✅ Global CDN delivery with ~50ms latency
- ✅ Easy file management via Vercel dashboard
- ✅ Automatic HTTPS and caching
- ✅ No additional costs on free tier

## Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob SDK Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [Vercel Blob Quickstart](https://vercel.com/docs/storage/vercel-blob/quickstart)
- [Vercel Storage Pricing](https://vercel.com/docs/storage/vercel-blob/limits-and-pricing)