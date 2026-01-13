#!/bin/bash
# validate-ffmpeg.sh - Check if ffmpeg is installed and get version
# Usage: ./validate-ffmpeg.sh
# Output: JSON with installed status and version

set -euo pipefail

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
  echo "{\"installed\": false, \"error\": \"ffmpeg is not installed or not in PATH\"}"
  exit 1
fi

# Get ffmpeg version
version=$(ffmpeg -version 2>/dev/null | head -n 1 | cut -d' ' -f3)

if [ -n "$version" ]; then
  echo "{\"installed\": true, \"version\": \"$version\"}"
else
  echo "{\"installed\": true, \"version\": \"unknown\"}"
fi
