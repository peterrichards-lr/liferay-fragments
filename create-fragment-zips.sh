#!/bin/sh
COLLECTIONS=$(find . -type d -maxdepth 1 -exec test -e "{}"/collection.json \; -print)
FRAGMENTS=$(find . -type d -maxdepth 1 -exec test -e "{}"/fragment.json \; -print)

rm -rf zips
mkdir zips

# 1. Standard Build (2025.Q3+)
echo "Building standard fragments..."
for FRAGMENT in $FRAGMENTS; do
   NAME=$(basename "$FRAGMENT")
   zip -q -r ./zips/"$NAME".zip "$NAME"
done

for COLLECTION in $COLLECTIONS; do
   NAME=$(basename "$COLLECTION")
   zip -q -r ./zips/"$NAME"-collection.zip "$NAME"
done

# 2. Legacy Build (Pre-2025.Q3)
echo "Building legacy fragments (stripping field dependencies)..."
TEMP_DIR="legacy_build"
rm -rf "$TEMP_DIR"
mkdir "$TEMP_DIR"

# Copy source to temp
for DIR in $COLLECTIONS $FRAGMENTS; do
    cp -r "$DIR" "$TEMP_DIR/"
done

# Process configuration.json files in temp
find "$TEMP_DIR" -name "configuration.json" -exec sh -c '
    # Use jq to remove dependency key from any field inside typeOptions
    jq "walk(if type == \"object\" then del(.dependency) else . end)" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
' _ {} \;

# Zip legacy versions
cd "$TEMP_DIR"
for FRAGMENT in $FRAGMENTS; do
   NAME=$(basename "$FRAGMENT")
   zip -q -r ../zips/"$NAME"-legacy.zip "$NAME"
done

for COLLECTION in $COLLECTIONS; do
   NAME=$(basename "$COLLECTION")
   zip -q -r ../zips/"$NAME"-collection-legacy.zip "$NAME"
done
cd ..

rm -rf "$TEMP_DIR"
echo "Build complete. Zips are in ./zips"
