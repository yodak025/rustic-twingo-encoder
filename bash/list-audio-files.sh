#!/bin/bash
# list-audio-files.sh - List all audio files recursively in directory
# Usage: ./list-audio-files.sh <directory> <extensions-json>
# Extensions JSON format: '".mp3",".flac",".wav"'
# Output: JSON array of absolute file paths

set -euo pipefail

TARGET_DIR="${1:-.}"
EXTENSIONS="${2:-".mp3,.flac,.wav,.m4a,.aac,.ogg,.opus"}"

# Check if directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "{\"error\": \"Directory does not exist: $TARGET_DIR\"}"
  exit 1
fi

# Convert comma-separated extensions to find arguments
# Example: ".mp3,.flac" -> -iname "*.mp3" -o -iname "*.flac"
IFS=',' read -ra EXT_ARRAY <<< "$EXTENSIONS"
FIND_ARGS=()
for i in "${!EXT_ARRAY[@]}"; do
  ext="${EXT_ARRAY[$i]}"
  ext=$(echo "$ext" | tr -d ' "')  # Remove spaces and quotes
  if [ $i -gt 0 ]; then
    FIND_ARGS+=("-o")
  fi
  FIND_ARGS+=("-iname" "*${ext}")
done

# Find all audio files recursively
files=$(find "$TARGET_DIR" -type f \( "${FIND_ARGS[@]}" \) 2>/dev/null | sort)

# Filter out audio files that have matching .cue file
# (these will be processed separately by the CUE processor)
filtered_files=""
while IFS= read -r file; do
  if [ -n "$file" ]; then
    # Get base name without extension
    base="${file%.*}"
    # Check if .cue exists with same base name
    if [ ! -f "${base}.cue" ] && [ ! -f "${base}.CUE" ]; then
      filtered_files="${filtered_files}${file}"$'\n'
    fi
  fi
done <<< "$files"

# Remove empty lines
files=$(echo -n "$filtered_files" | grep -v '^$')

# Build JSON array
echo -n '{"files":['
first=true
while IFS= read -r file; do
  if [ -n "$file" ]; then
    if [ "$first" = true ]; then
      first=false
    else
      echo -n ','
    fi
    # Escape quotes and backslashes in file paths
    escaped_file=$(echo "$file" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
    echo -n "\"$escaped_file\""
  fi
done <<< "$files"
echo ']}'
