# Rustic Twingo Encoder

A minimalist audio transcoding application built with Next.js and ffmpeg. Transform your audio files with elegant simplicity.

![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)

## Features

- **Batch Audio Transcoding**: Process multiple directories of audio files simultaneously
- **CUE Sheet Support**: Automatically detect and split audio files with .cue sheets into individual tracks with correct metadata
- **Multiple Profiles**: Choose between MP3 (high compatibility) or Opus (maximum compression)
- **Configurable Paths**: Define source and output root directories for secure, sandboxed browsing
- **Tree Navigation**: Browse and select directories with an intuitive file explorer (restricted to configured paths)
- **Real-time Progress**: Monitor encoding progress with live updates
- **Dark Mode**: Elegant monochromatic design with pistachio green accents
- **Error Handling**: Best-effort processing continues even when individual files fail
- **Docker Ready**: Full containerization support for easy deployment

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 with custom monospace design system
- **Backend**: Next.js API Routes + Node.js 20+
- **Audio Processing**: ffmpeg via atomic bash scripts
- **Architecture**: SOLID principles with clean separation of concerns

## Prerequisites

### Native Installation
- **Node.js** 20.9.0 or higher (use `nvm` if needed)
- **ffmpeg** installed and available in PATH
- **npm** 10+ or compatible package manager

### Docker Installation (Recommended)
- **Docker** 20.10+ and **Docker Compose** 1.29+
- See [DOCKER.md](DOCKER.md) for complete Docker deployment guide

## Installation

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd rustic-twingo-encoder

# 2. Adjust paths in docker-compose.yml to match your setup
# Edit volumes section to point to your music directories

# 3. Start the application
docker-compose up -d

# 4. Access at http://localhost:3000
```

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

### Native Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd rustic-twingo-encoder
```

2. Install dependencies:
```bash
npm install
```

3. Configure the application:

Edit `config/config.json` to set your directories and preferences:

```json
{
  "rootDirectory": "/path/to/your/music",
  "outputRootDirectory": "/path/to/output/directory",
  "darkMode": true,
  "profiles": { ... },
  "audioExtensions": [ ... ]
}
```

**Configuration fields:**
- `rootDirectory`: Base directory for browsing source audio files (you can only browse subdirectories within this path)
- `outputRootDirectory`: Base directory for output selection (you can only browse subdirectories within this path)
- `darkMode`: Enable/disable dark mode (default: true)
- `profiles`: Available encoding profiles (MP3, Opus, or custom)
- `audioExtensions`: List of supported audio file extensions (includes `.cue` for automatic sheet processing)

4. Verify ffmpeg installation:
```bash
ffmpeg -version
```

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

Build and start the production server:
```bash
npm run build
npm start
```

### Workflow

1. **Select Output Directory**: Choose an empty directory within your configured `outputRootDirectory` where transcoded files will be saved
2. **Select Source Directories**: Navigate within your configured `rootDirectory` and select one or more directories containing audio files
3. **Choose Profile**: Select between MP3 (car-friendly, 192 kbps) or Opus (audiophile, 96 kbps VBR)
4. **Monitor Encoding**: Watch real-time progress as files are transcoded

**Special Features:**
- Files with matching `.cue` sheets are automatically detected and split into individual tracks with proper metadata (TITLE, ARTIST, ALBUM, TRACK NUMBER)
- Non-audio files (artwork, logs, etc.) are automatically copied to maintain directory structure
- Directory structure is preserved in output

## Configuration

The application is configured through `config/config.json` (or `config/config.docker.json` for Docker deployments).

### Configuration File Structure

```json
{
  "rootDirectory": "/home/user/Music",
  "outputRootDirectory": "/home/user/Music/outputs",
  "darkMode": true,
  "profiles": {
    "mp3": { ... },
    "opus": { ... }
  },
  "audioExtensions": [".mp3", ".flac", ".wav", ".cue", ...]
}
```

### Path Security

Both `rootDirectory` and `outputRootDirectory` act as sandboxes:
- Users can only browse subdirectories **within** these paths
- Path traversal attacks (e.g., `../../../etc/passwd`) are prevented
- This ensures safe operation even on shared systems

### Audio Profiles

**MP3 High Compatibility**
- Codec: libmp3lame
- Bitrate: 192 kbps CBR
- Channels: Stereo (forced)
- Use case: Car audio systems, maximum device compatibility

**Opus Maximum Compression**
- Codec: libopus
- Bitrate: 96 kbps VBR
- Compression: Level 10 (maximum)
- Channels: Stereo (forced)
- Use case: High-quality portable audio with minimal file size

### Supported Formats

**Input formats**: `.mp3`, `.flac`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wma`, `.aiff`, `.ape`, `.alac`, `.tta`, `.wv`, `.mpc`, `.ac3`, `.dts`, `.mp2`, `.amr`, `.au`, `.ra`, `.cue`

**CUE Sheet Processing**:
- Audio files with matching `.cue` sheets are automatically detected
- Each track is extracted as a separate file with correct metadata:
  - Track title from `TITLE` field
  - Artist from `PERFORMER` field (track-level or album-level)
  - Album from album `TITLE`
  - Track number and date/genre if available
- Output files named as: `01-TrackTitle.ext`, `02-TrackTitle.ext`, etc.
- Original large audio file is not transcoded (only the split tracks)

## Architecture

### Backend Structure

```
app/
├── api/                 # REST API routes
│   ├── config/         # Configuration endpoint
│   ├── directories/    # Restricted directory browsing
│   ├── browse/         # Free directory browsing
│   └── jobs/           # Job creation and status
├── lib/                # Business logic modules
│   ├── config.js       # Configuration management
│   ├── bashExecutor.js # Script execution wrapper
│   ├── jobManager.js   # Job state management
│   └── encodingService.js # Encoding orchestration
└── components/         # React components (Atomic Design)
```

### Bash Scripts

Located in `bash/`, each script is atomic and returns JSON:

- `validate-ffmpeg.sh` - Verify ffmpeg installation
- `list-directories.sh` - List subdirectories
- `list-audio-files.sh` - Find audio files recursively (excludes files with matching .cue)
- `check-directory-empty.sh` - Validate output directory
- `copy-non-audio.sh` - Preserve non-audio files
- `transcode-file.sh` - Transcode single audio file with ffmpeg
- `split-cue-track.sh` - Extract individual track from CUE sheet with metadata

## Design Philosophy

### SOLID Principles

- **Single Responsibility**: Each module has one clear purpose
- **Open/Closed**: Easy to add new profiles without modifying code
- **Liskov Substitution**: Bash scripts are interchangeable with consistent JSON interface
- **Interface Segregation**: API routes are specific to resources
- **Dependency Inversion**: High-level modules depend on abstractions

### KISS (Keep It Simple, Stupid)

- In-memory job state (no database)
- Simple polling instead of WebSockets
- One job at a time (no queue complexity)
- Atomic bash scripts for system operations
- Minimalist UI with clear purpose

## Development

### Project Structure

```
rustic-twingo-encoder/
├── app/                # Next.js App Router
├── bash/               # Atomic bash scripts
├── config/             # Configuration files
│   ├── config.json           # Local/development config
│   └── config.docker.json    # Docker container config
├── public/             # Static assets
├── Dockerfile          # Production container
├── Dockerfile.dev      # Development container
├── docker-compose.yml  # Production orchestration
├── docker-compose.dev.yml    # Development orchestration
├── DOCKER.md           # Docker deployment guide
├── AGENTS.md           # Development guidelines
└── LICENSE             # GPL-3.0 License
```

### Adding New Encoding Profiles

Edit `config/config.json` and add a new profile:

```json
{
  "profiles": {
    "your-profile": {
      "name": "Your Profile Name",
      "description": "Profile description",
      "extension": "ext",
      "ffmpegArgs": ["-codec:a", "codec", "-b:a", "bitrate"]
    }
  }
}
```

The UI will automatically detect and display new profiles.

## Troubleshooting

### "ffmpeg not found"
Ensure ffmpeg is installed and in your PATH:
```bash
which ffmpeg
```
**Docker**: ffmpeg is automatically installed in the container.

### "Output directory must be empty"
The application requires an empty output directory to prevent accidental overwrites. Either:
- Choose a different directory
- Empty the current directory
- Create a new directory

### "Access denied: path outside root directory"
This is a security feature. You can only browse directories within your configured `rootDirectory` or `outputRootDirectory`. Update `config/config.json` if you need access to different paths.

### CUE files not being processed
Ensure:
- The `.cue` file and audio file have the same base name (e.g., `album.cue` and `album.flac`)
- Both files are in the same directory
- The audio file referenced in the CUE sheet matches the actual filename

### Node version issues
Use nvm to switch to Node 20+:
```bash
nvm install 20
nvm use 20
```

### Docker permission issues
If encoded files have wrong ownership, update the `user:` field in `docker-compose.yml`:
```bash
id -u  # Get your UID
id -g  # Get your GID
# Then update docker-compose.yml: user: "UID:GID"
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please follow the guidelines in [AGENTS.md](AGENTS.md) for code style and architecture decisions.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Audio processing powered by [ffmpeg](https://ffmpeg.org/)
- Design inspired by terminal aesthetics and modern dev tools
