import { NextResponse } from 'next/server';
import { getProfiles, getRootDirectory, getOutputRootDirectory, getDarkMode } from '@/app/lib/config';

/**
 * GET /api/config
 * Returns configuration data needed by the frontend
 */
export async function GET() {
  try {
    const profiles = getProfiles();
    const rootDirectory = getRootDirectory();
    const outputRootDirectory = getOutputRootDirectory();
    const darkMode = getDarkMode();

    return NextResponse.json({
      profiles,
      rootDirectory,
      outputRootDirectory,
      darkMode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
