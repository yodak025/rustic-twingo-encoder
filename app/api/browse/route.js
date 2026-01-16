import { NextResponse } from 'next/server';
import path from 'path';
import { getOutputRootDirectory } from '@/app/lib/config';
import { listDirectories } from '@/app/lib/bashExecutor';

/**
 * GET /api/browse?path=/relative/path
 * Lists subdirectories within outputRootDirectory (for output directory selection)
 * Validates that requested path doesn't escape outputRootDirectory
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path') || '';

    const outputRootDirectory = getOutputRootDirectory();
    
    // Build absolute path and normalize it
    const requestedPath = path.join(outputRootDirectory, relativePath);
    const normalizedPath = path.normalize(requestedPath);
    const normalizedRoot = path.normalize(outputRootDirectory);

    // Security check: prevent path traversal outside outputRootDirectory
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return NextResponse.json(
        { error: 'Access denied: path outside output root directory' },
        { status: 403 }
      );
    }

    // List directories at requested path
    const directories = await listDirectories(normalizedPath);

    return NextResponse.json({
      path: relativePath,
      directories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
