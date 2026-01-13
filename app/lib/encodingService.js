import path from 'path';
import { getProfile, getAudioExtensions, getRootDirectory } from './config.js';
import {
  listAudioFiles,
  copyNonAudioFiles,
  transcodeFile,
  checkDirectoryEmpty,
} from './bashExecutor.js';
import {
  updateJobStatus,
  updateJobProgress,
  addJobError,
  getJob,
} from './jobManager.js';

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

      // Copy non-audio files first (preserves structure)
      try {
        await copyNonAudioFiles(sourceDir, outputDir, audioExtensions);
      } catch (error) {
        const errorMsg = `Failed to copy non-audio files from ${relativeDir}: ${error.message}`;
        addJobError(jobId, errorMsg);
        // Continue with other directories (best effort)
      }

      // List all audio files in this directory
      try {
        const audioFiles = await listAudioFiles(sourceDir, audioExtensions);
        allAudioFiles.push(...audioFiles.map(file => ({
          sourcePath: file,
          sourceDir,
          outputDir,
          relativeDir,
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
      const { sourcePath, sourceDir, outputDir } = fileInfo;

      // Calculate relative path within source directory
      const relativePath = path.relative(sourceDir, sourcePath);
      const baseName = path.basename(relativePath, path.extname(relativePath));
      const dirName = path.dirname(relativePath);
      
      // Build output path with new extension
      const outputFileName = `${baseName}.${profile.extension}`;
      const outputPath = path.join(outputDir, dirName, outputFileName);

      // Update progress
      updateJobProgress(jobId, {
        currentFile: relativePath,
        processedFiles: totalFilesProcessed,
        totalFiles,
      });

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
