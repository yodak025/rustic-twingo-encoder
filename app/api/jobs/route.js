import { NextResponse } from 'next/server';
import { createJob, getCurrentJob, isEncodingActive } from '@/app/lib/jobManager';
import { startEncoding } from '@/app/lib/encodingService';
import { checkDirectoryEmpty } from '@/app/lib/bashExecutor';

/**
 * GET /api/jobs
 * Returns the current job status (for polling)
 */
export async function GET() {
  try {
    const currentJob = getCurrentJob();

    if (!currentJob) {
      return NextResponse.json({
        job: null,
        message: 'No active job',
      });
    }

    return NextResponse.json({
      job: {
        id: currentJob.id,
        status: currentJob.status,
        progress: currentJob.progress,
        errors: currentJob.errors,
        createdAt: currentJob.createdAt,
        startedAt: currentJob.startedAt,
        completedAt: currentJob.completedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Creates a new encoding job and starts the process
 * Body: {
 *   directories: string[],    // Relative paths from rootDirectory
 *   outputDirectory: string,  // Absolute path
 *   profile: string          // Profile key (e.g., 'mp3', 'opus')
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { directories, outputDirectory, profile } = body;

    // Validate request
    if (!directories || !Array.isArray(directories) || directories.length === 0) {
      return NextResponse.json(
        { error: 'directories array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!outputDirectory) {
      return NextResponse.json(
        { error: 'outputDirectory is required' },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'profile is required' },
        { status: 400 }
      );
    }

    // Check if another job is already running
    if (isEncodingActive()) {
      return NextResponse.json(
        { error: 'A job is already running. Only one job at a time is allowed.' },
        { status: 409 }
      );
    }

    // Validate output directory is empty
    const dirCheck = await checkDirectoryEmpty(outputDirectory);
    if (!dirCheck.exists) {
      return NextResponse.json(
        { error: 'Output directory does not exist' },
        { status: 400 }
      );
    }
    if (!dirCheck.empty) {
      return NextResponse.json(
        { error: 'Output directory must be empty before starting encoding' },
        { status: 400 }
      );
    }

    // Create job
    const job = createJob(directories, outputDirectory, profile);

    // Start encoding in background (don't await)
    startEncoding(job).catch(error => {
      console.error('Encoding error:', error);
    });

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        directories: job.directories,
        outputDirectory: job.outputDirectory,
        profile: job.profile,
        createdAt: job.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
