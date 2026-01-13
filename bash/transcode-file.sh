#!/bin/bash
# transcode-file.sh - Transcode audio file with ffmpeg
# Usage: ./transcode-file.sh <input> <output> <ffmpeg-args-json>
# ffmpeg-args-json: JSON string with ffmpeg arguments array
# Output: JSON with success status and message

set -euo pipefail

INPUT_FILE="${1}"
OUTPUT_FILE="${2}"
FFMPEG_ARGS="${3}"

# Validate input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "{\"success\": false, \"error\": \"Input file does not exist: $INPUT_FILE\"}"
  exit 1
fi

# Create output directory if it doesn't exist
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"

# Parse JSON array of ffmpeg arguments
# Expected format: '"-codec:a","libmp3lame","-b:a","192k"'
# Convert to bash array
IFS=',' read -ra ARGS_ARRAY <<< "$FFMPEG_ARGS"
FFMPEG_PARAMS=()
for arg in "${ARGS_ARRAY[@]}"; do
  # Remove quotes and whitespace
  clean_arg=$(echo "$arg" | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//')
  FFMPEG_PARAMS+=("$clean_arg")
done

# Run ffmpeg transcode
ffmpeg -i "$INPUT_FILE" "${FFMPEG_PARAMS[@]}" "$OUTPUT_FILE" -y -v error 2>&1

if [ $? -eq 0 ]; then
  echo "{\"success\": true, \"message\": \"Transcoded successfully\", \"output\": \"$OUTPUT_FILE\"}"
else
  echo "{\"success\": false, \"error\": \"ffmpeg transcode failed for $INPUT_FILE\"}"
  exit 1
fi
