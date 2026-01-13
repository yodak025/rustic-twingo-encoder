import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'config.json');

let cachedConfig = null;

/**
 * Load and validate configuration from config.json
 * @returns {Object} Configuration object
 */
export function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);

    // Validate required fields
    if (!config.rootDirectory) {
      throw new Error('rootDirectory is required in config.json');
    }

    if (!config.profiles || Object.keys(config.profiles).length === 0) {
      throw new Error('At least one profile is required in config.json');
    }

    if (!config.audioExtensions || config.audioExtensions.length === 0) {
      throw new Error('audioExtensions array is required in config.json');
    }

    cachedConfig = config;
    return config;
  } catch (error) {
    throw new Error(`Failed to load config.json: ${error.message}`);
  }
}

/**
 * Get available encoding profiles
 * @returns {Object} Profiles object
 */
export function getProfiles() {
  const config = loadConfig();
  return config.profiles;
}

/**
 * Get root directory for source browsing
 * @returns {string} Root directory path
 */
export function getRootDirectory() {
  const config = loadConfig();
  return config.rootDirectory;
}

/**
 * Get supported audio file extensions
 * @returns {string[]} Array of extensions (e.g., ['.mp3', '.flac'])
 */
export function getAudioExtensions() {
  const config = loadConfig();
  return config.audioExtensions;
}

/**
 * Get dark mode preference
 * @returns {boolean} Dark mode enabled
 */
export function getDarkMode() {
  const config = loadConfig();
  return config.darkMode ?? true;
}

/**
 * Get specific profile by key
 * @param {string} profileKey - Profile key (e.g., 'mp3', 'opus')
 * @returns {Object|null} Profile object or null if not found
 */
export function getProfile(profileKey) {
  const profiles = getProfiles();
  return profiles[profileKey] || null;
}
