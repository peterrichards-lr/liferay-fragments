#!/bin/bash

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. It is required for legacy build."
    exit 1
fi

COLLECTIONS=$(find . -type d -maxdepth 1 -exec test -e '{}'/collection.json \; -print)
FRAGMENTS=$(find . -type d -maxdepth 1 -exec test -e '{}'/fragment.json \; -print)

rm -rf zips
mkdir zips

# 1. Standard Fragment Zips (Standalone)
for FRAGMENT in $FRAGMENTS; do
   FRAGMENT_NAME=$(basename "$FRAGMENT")
   echo "Processing fragment: $FRAGMENT_NAME"
   zip -qr ./zips/"$FRAGMENT_NAME".zip "$FRAGMENT_NAME"
done

# 2. Collection Zips (Standard and Pre-2025.Q3)
for COLLECTION in $COLLECTIONS; do
   COLLECTION_NAME=$(basename "$COLLECTION")
   echo "Processing collection: $COLLECTION_NAME"
   
   # Standard zip (2025.Q3+)
   zip -qr ./zips/"$COLLECTION_NAME"-collection.zip "$COLLECTION_NAME"
   
   # Legacy zip (Pre 2025.Q3 - strip 'dependency' blocks)
   echo "Creating pre-2025.Q3 version for $COLLECTION_NAME..."
   TEMP_DIR="temp_pre2025q3_$COLLECTION_NAME"
   cp -r "$COLLECTION_NAME" "$TEMP_DIR"
   
   # Find all configuration.json files and strip dependency using jq
   # Note: Liferay 2025.Q3+ supports 'dependency'. Older versions fail to import if present.
   find "$TEMP_DIR" -name "configuration.json" -exec sh -c '
       jq "del(.fieldSets[].fields[].typeOptions.dependency)" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
   ' -- {} \;
   
   # Zip pre-2025.Q3 version
   (cd "$TEMP_DIR" && zip -qr ../zips/"$COLLECTION_NAME"-pre2025q3.zip .)
   
   # Cleanup
   rm -rf "$TEMP_DIR"
done

echo "Build complete. Zips located in ./zips/"
