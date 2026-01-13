import { randomUUID } from 'crypto';

// In-memory job storage (single job at a time for MVP)
let currentJob = null;

/**
 * Job structure:
 * {
 *   id: string,
 *   directories: string[],
 *   outputDirectory: string,
 *   profile: string,
 *   status: 'pending' | 'running' | 'completed' | 'error',
 *   createdAt: number,
 *   startedAt?: number,
 *   completedAt?: number,
 *   errors: string[],
 *   progress?: {
 *     currentFile: string,
 *     processedFiles: number,
 *     totalFiles: number
 *   }
 * }
 */

/**
 * Create a new encoding job
 * @param {string[]} directories - Array of source directories (relative to rootDirectory)
 * @param {string} outputDirectory - Absolute output directory path
 * @param {string} profile - Profile key (e.g., 'mp3', 'opus')
 * @returns {Object} Created job
 * @throws {Error} If a job is already running
 */
export function createJob(directories, outputDirectory, profile) {
  if (currentJob && (currentJob.status === 'pending' || currentJob.status === 'running')) {
    throw new Error('A job is already running. Only one job at a time is allowed.');
  }

  const job = {
    id: randomUUID(),
    directories,
    outputDirectory,
    profile,
    status: 'pending',
    createdAt: Date.now(),
    errors: [],
  };

  currentJob = job;
  return job;
}

/**
 * Get the current job
 * @returns {Object|null} Current job or null
 */
export function getCurrentJob() {
  return currentJob;
}

/**
 * Get job by ID
 * @param {string} jobId - Job ID
 * @returns {Object|null} Job or null if not found
 */
export function getJob(jobId) {
  if (currentJob && currentJob.id === jobId) {
    return currentJob;
  }
  return null;
}

/**
 * Update job status
 * @param {string} jobId - Job ID
 * @param {string} status - New status
 * @returns {Object} Updated job
 * @throws {Error} If job not found
 */
export function updateJobStatus(jobId, status) {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  job.status = status;

  if (status === 'running' && !job.startedAt) {
    job.startedAt = Date.now();
  }

  if ((status === 'completed' || status === 'error') && !job.completedAt) {
    job.completedAt = Date.now();
  }

  return job;
}

/**
 * Update job progress
 * @param {string} jobId - Job ID
 * @param {Object} progress - Progress object
 * @returns {Object} Updated job
 */
export function updateJobProgress(jobId, progress) {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  job.progress = {
    ...job.progress,
    ...progress,
  };

  return job;
}

/**
 * Add error to job
 * @param {string} jobId - Job ID
 * @param {string} error - Error message
 * @returns {Object} Updated job
 */
export function addJobError(jobId, error) {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  job.errors.push(error);
  return job;
}

/**
 * Clear completed job (allows creating new job)
 * @returns {void}
 */
export function clearJob() {
  if (currentJob && (currentJob.status === 'completed' || currentJob.status === 'error')) {
    currentJob = null;
  }
}

/**
 * Check if encoding is currently running
 * @returns {boolean} True if a job is running
 */
export function isEncodingActive() {
  return currentJob && (currentJob.status === 'pending' || currentJob.status === 'running');
}

/**
 * Force clear current job (use with caution)
 * @returns {void}
 */
export function forceCleanJob() {
  currentJob = null;
}
