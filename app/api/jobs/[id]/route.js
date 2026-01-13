import { NextResponse } from 'next/server';
import { getJob } from '@/app/lib/jobManager';

/**
 * GET /api/jobs/[id]
 * Returns detailed information about a specific job
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const job = getJob(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job: {
        id: job.id,
        directories: job.directories,
        outputDirectory: job.outputDirectory,
        profile: job.profile,
        status: job.status,
        progress: job.progress,
        errors: job.errors,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
