import { spawn } from 'child_process';
import path from 'path';

const BASH_SCRIPTS_DIR = path.join(process.cwd(), 'bash');

/**
 * Execute a bash script and return parsed JSON result
 * @param {string} scriptName - Name of the script file (e.g., 'list-directories.sh')
 * @param {string[]} args - Array of arguments to pass to the script
 * @param {number} timeout - Optional timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} Parsed JSON response from script
 */
export async function executeScript(scriptName, args = [], timeout = 30000) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(BASH_SCRIPTS_DIR, scriptName);
    
    let stdout = '';
    let stderr = '';

    const child = spawn(scriptPath, args, {
      cwd: process.cwd(),
      env: process.env,
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      child.kill();
      reject(new Error(`Script ${scriptName} timed out after ${timeout}ms`));
    }, timeout);

    // Collect stdout
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        reject(new Error(`Script ${scriptName} exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Parse JSON response
        const result = JSON.parse(stdout.trim());
        
        // Check if result contains error
        if (result.error) {
          reject(new Error(result.error));
          return;
        }

        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse JSON from ${scriptName}: ${error.message}. Output: ${stdout}`));
      }
    });

    // Handle spawn errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to execute ${scriptName}: ${error.message}`));
    });
  });
}

/**
 * List directories in given path
 * @param {string} targetPath - Path to list directories from
 * @returns {Promise<string[]>} Array of directory names
 */
export async function listDirectories(targetPath) {
  const result = await executeScript('list-directories.sh', [targetPath]);
  return result.directories || [];
}

/**
 * List audio files recursively in directory
 * @param {string} directory - Directory to scan
 * @param {string[]} extensions - Audio extensions to match
 * @returns {Promise<string[]>} Array of absolute file paths
 */
export async function listAudioFiles(directory, extensions) {
  const extensionsArg = extensions.join(',');
  const result = await executeScript('list-audio-files.sh', [directory, extensionsArg]);
  return result.files || [];
}

/**
 * Copy non-audio files from source to destination
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 * @param {string[]} audioExtensions - Extensions to exclude
 * @returns {Promise<Object>} Result with success status
 */
export async function copyNonAudioFiles(source, destination, audioExtensions) {
  const extensionsArg = audioExtensions.join(',');
  const result = await executeScript('copy-non-audio.sh', [source, destination, extensionsArg]);
  return result;
}

/**
 * Transcode audio file with ffmpeg
 * @param {string} inputFile - Input file path
 * @param {string} outputFile - Output file path
 * @param {string[]} ffmpegArgs - Array of ffmpeg arguments
 * @returns {Promise<Object>} Result with success status
 */
export async function transcodeFile(inputFile, outputFile, ffmpegArgs) {
  // Convert array to comma-separated string for bash script
  const argsString = ffmpegArgs.map(arg => `"${arg}"`).join(',');
  const result = await executeScript('transcode-file.sh', [inputFile, outputFile, argsString], 600000); // 10 min timeout
  return result;
}

/**
 * Check if directory exists and is empty
 * @param {string} dirPath - Directory path to check
 * @returns {Promise<{exists: boolean, empty: boolean}>} Directory status
 */
export async function checkDirectoryEmpty(dirPath) {
  const result = await executeScript('check-directory-empty.sh', [dirPath]);
  return result;
}

/**
 * Validate ffmpeg installation
 * @returns {Promise<{installed: boolean, version?: string}>} ffmpeg status
 */
export async function validateFFmpeg() {
  try {
    const result = await executeScript('validate-ffmpeg.sh', []);
    return result;
  } catch (error) {
    return { installed: false, error: error.message };
  }
}

/**
 * Split track from audio file using cue timestamps
 * @param {string} inputFile - Input audio file
 * @param {string} outputFile - Output track file
 * @param {number} startTime - Start time in seconds
 * @param {number|null} endTime - End time in seconds (null for last track)
 * @param {string[]} ffmpegArgs - FFmpeg encoding arguments
 * @param {Object} metadata - Track metadata {title, artist, album, track, date}
 * @returns {Promise<Object>} Result with success status
 */
export async function splitCueTrack(inputFile, outputFile, startTime, endTime, ffmpegArgs, metadata) {
  const argsString = ffmpegArgs.map(arg => `"${arg}"`).join(',');
  const endTimeStr = endTime !== null ? String(endTime) : 'end';
  const metadataJson = JSON.stringify(metadata);
  
  const result = await executeScript(
    'split-cue-track.sh',
    [inputFile, outputFile, String(startTime), endTimeStr, argsString, metadataJson],
    600000 // 10 min timeout
  );
  return result;
}
