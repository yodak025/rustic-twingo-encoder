# Rustic Twingo Encoder

A minimalist audio transcoding application built with Next.js and ffmpeg. Transform your audio files with elegant simplicity.

![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)

## Features

- **Batch Audio Transcoding**: Process multiple directories of audio files simultaneously
- **Multiple Profiles**: Choose between MP3 (high compatibility) or Opus (maximum compression)
- **Tree Navigation**: Browse and select source directories with an intuitive file explorer
- **Real-time Progress**: Monitor encoding progress with live updates
- **Dark Mode**: Elegant monochromatic design with pistachio green accents
- **Error Handling**: Best-effort processing continues even when individual files fail

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 with custom monospace design system
- **Backend**: Next.js API Routes + Node.js 20+
- **Audio Processing**: ffmpeg via atomic bash scripts
- **Architecture**: SOLID principles with clean separation of concerns

## Prerequisites

- **Node.js** 20.9.0 or higher (use `nvm` if needed)
- **ffmpeg** installed and available in PATH
- **npm** 10+ or compatible package manager

## Installation

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

Edit `config/config.json` to set your root directory and preferences:

```json
{
  "rootDirectory": "/path/to/your/music",
  "darkMode": true,
  "profiles": { ... }
}
```

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

1. **Select Output Directory**: Choose an empty directory where transcoded files will be saved
2. **Select Source Directories**: Navigate and select one or more directories containing audio files
3. **Choose Profile**: Select between MP3 (car-friendly, 192 kbps) or Opus (audiophile, 96 kbps VBR)
4. **Monitor Encoding**: Watch real-time progress as files are transcoded

## Configuration

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

Input formats: `.mp3`, `.flac`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wma`, `.aiff`, `.ape`, `.alac`, `.tta`, `.wv`, `.mpc`, `.ac3`, `.dts`, `.mp2`, `.amr`, `.au`, `.ra`

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
- `list-audio-files.sh` - Find audio files recursively
- `check-directory-empty.sh` - Validate output directory
- `copy-non-audio.sh` - Preserve non-audio files
- `transcode-file.sh` - Transcode with ffmpeg

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
├── public/             # Static assets
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

### "Output directory must be empty"
The application requires an empty output directory to prevent accidental overwrites. Either:
- Choose a different directory
- Empty the current directory
- Create a new directory

### Node version issues
Use nvm to switch to Node 20+:
```bash
nvm install 20
nvm use 20
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please follow the guidelines in [AGENTS.md](AGENTS.md) for code style and architecture decisions.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Audio processing powered by [ffmpeg](https://ffmpeg.org/)
- Design inspired by terminal aesthetics and modern dev tools
