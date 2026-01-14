#!/bin/bash
# split-cue-track.sh - Extract single track from audio file with metadata
# Usage: ./split-cue-track.sh <input> <output> <start> <end> <ffmpeg-args> <metadata-json>
# Output: JSON with success status

set -euo pipefail

INPUT_FILE="${1}"
OUTPUT_FILE="${2}"
START_TIME="${3}"
END_TIME="${4}"      # Can be "end" for last track
FFMPEG_ARGS="${5}"
METADATA="${6}"      # JSON: {"title":"...","artist":"...","album":"...","track":"1","date":"2024"}

# Validate input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "{\"success\": false, \"error\": \"Input file does not exist: $INPUT_FILE\"}"
  exit 1
fi

# Create output directory if needed
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"

# Parse metadata JSON using grep and sed (simple approach, no jq dependency)
TITLE=$(echo "$METADATA" | grep -oP '"title"\s*:\s*"\K[^"]*' || echo "")
ARTIST=$(echo "$METADATA" | grep -oP '"artist"\s*:\s*"\K[^"]*' || echo "")
ALBUM=$(echo "$METADATA" | grep -oP '"album"\s*:\s*"\K[^"]*' || echo "")
TRACK=$(echo "$METADATA" | grep -oP '"track"\s*:\s*"\K[^"]*' || echo "")
DATE=$(echo "$METADATA" | grep -oP '"date"\s*:\s*"\K[^"]*' || echo "")

# Build ffmpeg command
FFMPEG_CMD=(ffmpeg -i "$INPUT_FILE" -ss "$START_TIME")

# Add end time if not "end"
if [ "$END_TIME" != "end" ]; then
  FFMPEG_CMD+=(-to "$END_TIME")
fi

# Parse and add encoding args
IFS=',' read -ra ARGS_ARRAY <<< "$FFMPEG_ARGS"
for arg in "${ARGS_ARRAY[@]}"; do
  # Remove surrounding quotes and whitespace
  clean_arg=$(echo "$arg" | sed 's/^[[:space:]]*"//;s/"[[:space:]]*$//')
  FFMPEG_CMD+=("$clean_arg")
done

# Add metadata tags
[ -n "$TITLE" ] && FFMPEG_CMD+=(-metadata "title=$TITLE")
[ -n "$ARTIST" ] && FFMPEG_CMD+=(-metadata "artist=$ARTIST")
[ -n "$ALBUM" ] && FFMPEG_CMD+=(-metadata "album=$ALBUM")
[ -n "$TRACK" ] && FFMPEG_CMD+=(-metadata "track=$TRACK")
[ -n "$DATE" ] && FFMPEG_CMD+=(-metadata "date=$DATE")

# Output file and options
FFMPEG_CMD+=("$OUTPUT_FILE" -y -v error)

# Execute ffmpeg
"${FFMPEG_CMD[@]}" 2>&1

# Check result
if [ $? -eq 0 ]; then
  echo "{\"success\": true, \"message\": \"Track extracted successfully\", \"output\": \"$OUTPUT_FILE\"}"
else
  echo "{\"success\": false, \"error\": \"Failed to extract track from $INPUT_FILE\"}"
  exit 1
fi
