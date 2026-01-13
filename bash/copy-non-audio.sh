#!/bin/bash
# copy-non-audio.sh - Copy all non-audio files and directories preserving structure
# Usage: ./copy-non-audio.sh <source> <destination> <extensions-json>
# Extensions JSON: comma-separated audio extensions to exclude
# Output: JSON with status and message

set -euo pipefail

SOURCE_DIR="${1}"
DEST_DIR="${2}"
AUDIO_EXTS="${3:-".mp3,.flac,.wav,.m4a,.aac,.ogg,.opus"}"

# Validate inputs
if [ ! -d "$SOURCE_DIR" ]; then
  echo "{\"success\": false, \"error\": \"Source directory does not exist: $SOURCE_DIR\"}"
  exit 1
fi

if [ ! -d "$DEST_DIR" ]; then
  mkdir -p "$DEST_DIR"
fi

# Build exclude pattern for rsync
# Convert ".mp3,.flac" to "--exclude=*.mp3 --exclude=*.flac"
IFS=',' read -ra EXT_ARRAY <<< "$AUDIO_EXTS"
EXCLUDE_ARGS=()
for ext in "${EXT_ARRAY[@]}"; do
  ext=$(echo "$ext" | tr -d ' "')
  EXCLUDE_ARGS+=("--exclude=*${ext}")
done

# Use rsync to copy everything except audio files
rsync -av "${EXCLUDE_ARGS[@]}" "$SOURCE_DIR/" "$DEST_DIR/" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "{\"success\": true, \"message\": \"Non-audio files copied successfully\"}"
else
  echo "{\"success\": false, \"error\": \"Failed to copy non-audio files\"}"
  exit 1
fi
