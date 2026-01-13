import { NextResponse } from 'next/server';
import path from 'path';
import { getRootDirectory } from '@/app/lib/config';
import { listDirectories } from '@/app/lib/bashExecutor';

/**
 * GET /api/directories?path=/relative/path
 * Lists subdirectories within rootDirectory
 * Validates that requested path doesn't escape rootDirectory
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path') || '';

    const rootDirectory = getRootDirectory();
    
    // Build absolute path and normalize it
    const requestedPath = path.join(rootDirectory, relativePath);
    const normalizedPath = path.normalize(requestedPath);
    const normalizedRoot = path.normalize(rootDirectory);

    // Security check: prevent path traversal outside rootDirectory
    if (!normalizedPath.startsWith(normalizedRoot)) {
      return NextResponse.json(
        { error: 'Access denied: path outside root directory' },
        { status: 403 }
      );
    }

    // List directories
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
