#!/bin/bash
# list-directories.sh - List only directories in given path
# Usage: ./list-directories.sh <path>
# Output: JSON array of directory names

set -euo pipefail

TARGET_PATH="${1:-.}"

# Check if path exists
if [ ! -d "$TARGET_PATH" ]; then
  echo "{\"error\": \"Directory does not exist: $TARGET_PATH\"}"
  exit 1
fi

# List directories only, output as JSON array
cd "$TARGET_PATH" || exit 1

# Find directories, exclude hidden ones, format as JSON
dirs=$(find . -maxdepth 1 -mindepth 1 -type d ! -name '.*' -printf '%f\n' | sort)

# Build JSON array
echo -n '{"directories":['
first=true
while IFS= read -r dir; do
  if [ -n "$dir" ]; then
    if [ "$first" = true ]; then
      first=false
    else
      echo -n ','
    fi
    # Escape quotes in directory names
    escaped_dir=$(echo "$dir" | sed 's/"/\\"/g')
    echo -n "\"$escaped_dir\""
  fi
done <<< "$dirs"
echo ']}'
