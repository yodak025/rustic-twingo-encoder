import path from 'path';
import { getProfile, getAudioExtensions, getRootDirectory } from './config.js';
import {
  listAudioFiles,
  copyNonAudioFiles,
  transcodeFile,
  checkDirectoryEmpty,
  splitCueTrack,
} from './bashExecutor.js';
import {
  updateJobStatus,
  updateJobProgress,
  addJobError,
  getJob,
} from './jobManager.js';
import { processCueFilesInDirectory } from './cueProcessor.js';

/**
 * Start encoding process for a job
 * This function orchestrates the entire encoding workflow:
 * 1. Validate output directory is empty
 * 2. For each selected directory:
 *    - Copy non-audio files
 *    - List audio files
 *    - Transcode each file
 * 3. Update job status throughout
 * 
 * @param {Object} job - Job object from jobManager
 * @returns {Promise<void>}
 */
export async function startEncoding(job) {
  const jobId = job.id;

  try {
    // Update status to running
    updateJobStatus(jobId, 'running');

    // Get profile configuration
    const profile = getProfile(job.profile);
    if (!profile) {
      throw new Error(`Profile ${job.profile} not found`);
    }

    const audioExtensions = getAudioExtensions();
    const rootDirectory = getRootDirectory();

    // Step 1: Validate output directory is empty
    const dirCheck = await checkDirectoryEmpty(job.outputDirectory);
    if (!dirCheck.exists || !dirCheck.empty) {
      throw new Error('Output directory must exist and be empty');
    }

    // Step 2: Process each selected directory
    let totalFilesProcessed = 0;
    const allAudioFiles = [];

    // First pass: collect all audio files and copy non-audio files
    for (const relativeDir of job.directories) {
      const sourceDir = path.join(rootDirectory, relativeDir);
      const outputDir = path.join(job.outputDirectory, relativeDir);

      // Copy non-audio files first (preserves structure, excludes .cue since it's in audioExtensions)
      try {
        await copyNonAudioFiles(sourceDir, outputDir, audioExtensions);
      } catch (error) {
        const errorMsg = `Failed to copy non-audio files from ${relativeDir}: ${error.message}`;
        addJobError(jobId, errorMsg);
        // Continue with other directories (best effort)
      }

      // Process CUE files: extract tracks
      let cueResults = { extractedTracks: [], processedAudioFiles: [] };
      try {
        cueResults = await processCueFilesInDirectory(
          sourceDir,
          outputDir,
          profile,
          audioExtensions,
          splitCueTrack
        );
      } catch (error) {
        const errorMsg = `Failed to process CUE files in ${relativeDir}: ${error.message}`;
        addJobError(jobId, errorMsg);
      }

      // List all audio files in this directory
      try {
        const audioFiles = await listAudioFiles(sourceDir, audioExtensions);
        
        // Filter out audio files that were processed by CUE
        const filteredAudioFiles = audioFiles.filter(
          file => !cueResults.processedAudioFiles.includes(file)
        );

        // Add regular audio files (not yet processed)
        allAudioFiles.push(...filteredAudioFiles.map(file => ({
          sourcePath: file,
          sourceDir,
          outputDir,
          relativeDir,
          alreadyProcessed: false,
        })));

        // Add extracted tracks from CUE (already processed/transcoded)
        allAudioFiles.push(...cueResults.extractedTracks.map(file => ({
          sourcePath: file,
          sourceDir,
          outputDir,
          relativeDir,
          alreadyProcessed: true,
        })));
      } catch (error) {
        const errorMsg = `Failed to list audio files in ${relativeDir}: ${error.message}`;
        addJobError(jobId, errorMsg);
      }
    }

    const totalFiles = allAudioFiles.length;

    // Update initial progress
    updateJobProgress(jobId, {
      processedFiles: 0,
      totalFiles,
      currentFile: null,
    });

    // Step 3: Transcode all audio files
    for (const fileInfo of allAudioFiles) {
      const { sourcePath, sourceDir, outputDir, alreadyProcessed } = fileInfo;

      // Calculate relative path within source directory
      const relativePath = path.relative(sourceDir, sourcePath);

      // Update progress
      updateJobProgress(jobId, {
        currentFile: relativePath,
        processedFiles: totalFilesProcessed,
        totalFiles,
      });

      // Skip transcoding if already processed (CUE tracks)
      if (alreadyProcessed) {
        totalFilesProcessed++;
        continue;
      }

      const baseName = path.basename(relativePath, path.extname(relativePath));
      const dirName = path.dirname(relativePath);
      
      // Build output path with new extension
      const outputFileName = `${baseName}.${profile.extension}`;
      const outputPath = path.join(outputDir, dirName, outputFileName);

      // Transcode file
      try {
        await transcodeFile(sourcePath, outputPath, profile.ffmpegArgs);
        totalFilesProcessed++;
      } catch (error) {
        const errorMsg = `Failed to transcode ${relativePath}: ${error.message}`;
        addJobError(jobId, errorMsg);
        // Continue with next file (best effort)
        totalFilesProcessed++;
      }
    }

    // Final progress update
    updateJobProgress(jobId, {
      currentFile: null,
      processedFiles: totalFiles,
      totalFiles,
    });

    // Mark as completed
    updateJobStatus(jobId, 'completed');

  } catch (error) {
    // Mark as error
    updateJobStatus(jobId, 'error');
    addJobError(jobId, error.message);
    throw error;
  }
}

/**
 * Get encoding progress for a job
 * @param {string} jobId - Job ID
 * @returns {Object|null} Progress information
 */
export function getEncodingProgress(jobId) {
  const job = getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    errors: job.errors,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}
