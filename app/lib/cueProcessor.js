import path from 'path';
import { readdir, stat } from 'fs/promises';
import { parseCueFile, sanitizeFilename } from './cueParser.js';

/**
 * Find all .cue files with matching audio in directory (recursive)
 * @param {string} directory - Directory to scan
 * @param {string[]} audioExtensions - Valid audio extensions (e.g., ['.flac', '.mp3'])
 * @returns {Promise<Array>} Array of {cueFile, audioFile} pairs
 */
export async function findCueFilesWithAudio(directory, audioExtensions) {
  const results = [];

  async function scanDir(dir) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.cue')) {
          // Found a .cue file, look for matching audio
          const baseName = entry.name.slice(0, -4); // Remove .cue extension
          const baseDir = path.dirname(fullPath);

          // Search for audio file with same base name
          for (const ext of audioExtensions) {
            // Skip .cue itself
            if (ext.toLowerCase() === '.cue') continue;

            const audioPath = path.join(baseDir, baseName + ext);
            try {
              await stat(audioPath);
              // Audio file exists!
              results.push({
                cueFile: fullPath,
                audioFile: audioPath,
              });
              break; // Found match, stop searching
            } catch (err) {
              // Audio file doesn't exist, try next extension
              continue;
            }
          }
        }
      }
    } catch (error) {
      // Ignore directories we can't read
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }

  await scanDir(directory);
  return results;
}

/**
 * Process single CUE file: extract all tracks
 * @param {string} cueFilePath - Path to .cue file
 * @param {string} audioFilePath - Path to associated audio file
 * @param {string} outputDir - Output directory for tracks
 * @param {Object} profile - Encoding profile
 * @param {Function} splitTrackFn - Function to split tracks (injected for testability)
 * @returns {Promise<string[]>} Array of generated track file paths
 */
export async function processCueFile(cueFilePath, audioFilePath, outputDir, profile, splitTrackFn) {
  try {
    // Parse .cue file
    const cueData = await parseCueFile(cueFilePath);

    if (!cueData.tracks || cueData.tracks.length === 0) {
      console.error(`No tracks found in CUE file: ${cueFilePath}`);
      return [];
    }

    const generatedFiles = [];

    // Extract each track
    for (const track of cueData.tracks) {
      try {
        // Build output filename: "01-TrackTitle.ext"
        const trackNum = String(track.number).padStart(2, '0');
        const baseName = sanitizeFilename(track.title || `Track ${track.number}`);
        const outputFileName = `${trackNum}-${baseName}.${profile.extension}`;
        const outputPath = path.join(outputDir, outputFileName);

        // Prepare metadata
        const metadata = {
          title: track.title || `Track ${track.number}`,
          artist: track.performer || cueData.albumArtist || 'Unknown Artist',
          album: cueData.albumTitle || 'Unknown Album',
          track: String(track.number),
          date: cueData.date || '',
        };

        // Extract track using injected function
        await splitTrackFn(
          audioFilePath,
          outputPath,
          track.startTime,
          track.endTime,
          profile.ffmpegArgs,
          metadata
        );

        generatedFiles.push(outputPath);
      } catch (error) {
        // Silent fail for individual track
        console.error(`Failed to extract track ${track.number} from ${cueFilePath}:`, error.message);
      }
    }

    return generatedFiles;
  } catch (error) {
    // Silent fail for entire .cue file
    console.error(`Failed to process CUE file ${cueFilePath}:`, error.message);
    return [];
  }
}

/**
 * Process all CUE files in directory
 * @param {string} sourceDir - Source directory
 * @param {string} outputDir - Output directory
 * @param {Object} profile - Encoding profile
 * @param {string[]} audioExtensions - Valid audio extensions
 * @param {Function} splitTrackFn - Function to split tracks
 * @returns {Promise<Object>} Results with extracted tracks and processed files
 */
export async function processCueFilesInDirectory(sourceDir, outputDir, profile, audioExtensions, splitTrackFn) {
  const cuePairs = await findCueFilesWithAudio(sourceDir, audioExtensions);

  const extractedTracks = [];
  const processedAudioFiles = [];

  for (const { cueFile, audioFile } of cuePairs) {
    // Calculate relative path within source directory for output structure
    const relativeCuePath = path.relative(sourceDir, cueFile);
    const relativeOutputDir = path.join(outputDir, path.dirname(relativeCuePath));

    const tracks = await processCueFile(cueFile, audioFile, relativeOutputDir, profile, splitTrackFn);
    
    if (tracks.length > 0) {
      extractedTracks.push(...tracks);
      processedAudioFiles.push(audioFile);
    }
  }

  return { extractedTracks, processedAudioFiles };
}
