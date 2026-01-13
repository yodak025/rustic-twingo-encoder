import { NextResponse } from 'next/server';
import { listDirectories } from '@/app/lib/bashExecutor';

/**
 * GET /api/browse?path=/absolute/path
 * Lists subdirectories at any system path (for output directory selection)
 * No restrictions on path (user needs to select output freely)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path') || '/';

    // List directories at requested path
    const directories = await listDirectories(targetPath);

    return NextResponse.json({
      path: targetPath,
      directories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
