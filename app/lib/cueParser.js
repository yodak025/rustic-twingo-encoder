import { readFile } from 'fs/promises';

/**
 * Parse CUE file and extract metadata and track information
 * @param {string} cueFilePath - Absolute path to .cue file
 * @returns {Promise<Object>} Parsed CUE data with album info and tracks
 * @throws {Error} If file cannot be read or parsed
 */
export async function parseCueFile(cueFilePath) {
  try {
    const content = await readFile(cueFilePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim());

    const result = {
      albumArtist: null,
      albumTitle: null,
      date: null,
      genre: null,
      audioFile: null,
      tracks: [],
    };

    let currentTrack = null;
    let inTrackSection = false;

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line || line.startsWith('REM')) {
        // Check for REM metadata
        if (line.startsWith('REM DATE')) {
          const match = line.match(/REM DATE (\d+)/);
          if (match) result.date = match[1];
        } else if (line.startsWith('REM GENRE')) {
          const match = line.match(/REM GENRE (.+)/);
          if (match) result.genre = match[1].trim();
        }
        continue;
      }

      // Global PERFORMER (album artist)
      if (line.startsWith('PERFORMER') && !inTrackSection) {
        const match = line.match(/PERFORMER "(.+)"/);
        if (match) result.albumArtist = match[1];
      }

      // Global TITLE (album title)
      if (line.startsWith('TITLE') && !inTrackSection) {
        const match = line.match(/TITLE "(.+)"/);
        if (match) result.albumTitle = match[1];
      }

      // FILE directive (audio file reference)
      if (line.startsWith('FILE')) {
        const match = line.match(/FILE "(.+)" \w+/);
        if (match) result.audioFile = match[1];
      }

      // TRACK directive
      if (line.match(/^\s*TRACK\s+(\d+)\s+AUDIO/)) {
        inTrackSection = true;
        
        // Save previous track
        if (currentTrack) {
          result.tracks.push(currentTrack);
        }

        const match = line.match(/TRACK\s+(\d+)\s+AUDIO/);
        currentTrack = {
          number: parseInt(match[1], 10),
          title: null,
          performer: null,
          startTime: null,
          endTime: null,
        };
      }

      // Track TITLE
      if (inTrackSection && line.match(/^\s*TITLE/)) {
        const match = line.match(/TITLE "(.+)"/);
        if (match && currentTrack) {
          currentTrack.title = match[1];
        }
      }

      // Track PERFORMER
      if (inTrackSection && line.match(/^\s*PERFORMER/)) {
        const match = line.match(/PERFORMER "(.+)"/);
        if (match && currentTrack) {
          currentTrack.performer = match[1];
        }
      }

      // INDEX 01 (start time)
      if (inTrackSection && line.match(/^\s*INDEX\s+01/)) {
        const match = line.match(/INDEX\s+01\s+(\d+:\d+:\d+)/);
        if (match && currentTrack) {
          currentTrack.startTime = cueTimestampToSeconds(match[1]);
        }
      }
    }

    // Save last track
    if (currentTrack) {
      result.tracks.push(currentTrack);
    }

    // Calculate endTime for each track
    for (let i = 0; i < result.tracks.length - 1; i++) {
      result.tracks[i].endTime = result.tracks[i + 1].startTime;
    }
    // Last track has no endTime (goes to end of file)
    if (result.tracks.length > 0) {
      result.tracks[result.tracks.length - 1].endTime = null;
    }

    // Validate we have at least one track
    if (result.tracks.length === 0) {
      throw new Error('No tracks found in CUE file');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to parse CUE file: ${error.message}`);
  }
}

/**
 * Convert CUE timestamp (MM:SS:FF) to seconds
 * Frames (FF) are 1/75th of a second
 * @param {string} timestamp - Format: "MM:SS:FF"
 * @returns {number} Time in seconds
 */
export function cueTimestampToSeconds(timestamp) {
  const parts = timestamp.split(':').map(p => parseInt(p, 10));
  
  if (parts.length !== 3) {
    throw new Error(`Invalid CUE timestamp format: ${timestamp}`);
  }

  const [minutes, seconds, frames] = parts;
  return minutes * 60 + seconds + frames / 75;
}

/**
 * Sanitize filename for filesystem compatibility
 * Replaces invalid characters and limits length
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename) return 'track';

  // Replace invalid filesystem characters
  let sanitized = filename
    .replace(/[/\\:*?"<>|]/g, '-')  // Replace invalid chars with dash
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();                         // Remove leading/trailing whitespace

  // Limit length (reserve space for extension and track number)
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized || 'track';
}
