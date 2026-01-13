#!/bin/bash
# check-directory-empty.sh - Check if directory exists and is empty
# Usage: ./check-directory-empty.sh <path>
# Output: JSON with exists and empty status

set -euo pipefail

TARGET_PATH="${1}"

# Check if path exists
if [ ! -e "$TARGET_PATH" ]; then
  echo "{\"exists\": false, \"empty\": false}"
  exit 0
fi

# Check if it's a directory
if [ ! -d "$TARGET_PATH" ]; then
  echo "{\"exists\": true, \"empty\": false, \"error\": \"Path exists but is not a directory\"}"
  exit 0
fi

# Check if directory is empty
if [ -z "$(ls -A "$TARGET_PATH")" ]; then
  echo "{\"exists\": true, \"empty\": true}"
else
  echo "{\"exists\": true, \"empty\": false}"
fi
