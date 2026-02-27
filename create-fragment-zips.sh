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
   # We create a nested structure to ensure the zip contains the folder, not just the contents
   echo "Creating pre-2025.Q3 version for $COLLECTION_NAME..."
   BUILD_TEMP="temp_build_${COLLECTION_NAME}"
   mkdir -p "$BUILD_TEMP/$COLLECTION_NAME"
   cp -r "$COLLECTION_NAME/." "$BUILD_TEMP/$COLLECTION_NAME/"
   
   # Find all configuration.json files and strip dependency using jq
   find "$BUILD_TEMP/$COLLECTION_NAME" -name "configuration.json" -exec sh -c '
       jq "del(.fieldSets[].fields[].typeOptions.dependency)" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
   ' -- {} \;
   
   # Zip pre-2025.Q3 version (Including the directory, matching standard structure)
   (cd "$BUILD_TEMP" && zip -qr ../zips/"$COLLECTION_NAME"-pre2025q3.zip "$COLLECTION_NAME")
   
   # Cleanup
   rm -rf "$BUILD_TEMP"
done

echo "Build complete. Zips located in ./zips/"
