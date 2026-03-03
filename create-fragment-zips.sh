#!/bin/bash

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. It is required for build."
    exit 1
fi

# Variables mimicking your Gradle properties
COMPANY_WEB_ID="${COMPANY_WEB_ID:-*}"
GROUP_KEY="${GROUP_KEY:-}"

COLLECTIONS=$(find . -type d -maxdepth 1 -exec test -e '{}'/collection.json \; -print)
FRAGMENTS=$(find . -type d -maxdepth 1 -exec test -e '{}'/fragment.json \; -print)

rm -rf zips
mkdir zips

# Helper function to generate descriptor
# Returns 0 if it created a file, 1 if it skipped
ensure_descriptor() {
    local TARGET_DIR=$1
    local DESCRIPTOR_PATH="$TARGET_DIR/liferay-deploy-fragments.json"

    if [ ! -f "$DESCRIPTOR_PATH" ]; then
        echo "  -> Generating temporary descriptor for $(basename "$TARGET_DIR")"
        
        local JSON_CONTENT
        JSON_CONTENT=$(jq -n --arg id "$COMPANY_WEB_ID" '{companyWebId: $id}')

        if [[ -n "$GROUP_KEY" && "$COMPANY_WEB_ID" != "*" ]]; then
            JSON_CONTENT=$(echo "$JSON_CONTENT" | jq --arg gk "$GROUP_KEY" '. + {groupKey: $gk}')
        fi

        echo "$JSON_CONTENT" > "$DESCRIPTOR_PATH"
        return 0 # Signifies we created the file
    fi
    return 1 # Signifies the file already existed
}

# 1. Standard Fragment Zips
for FRAGMENT in $FRAGMENTS; do
   FRAGMENT_NAME=$(basename "$FRAGMENT")
   echo "Processing fragment: $FRAGMENT_NAME"
   
   ensure_descriptor "$FRAGMENT_NAME"
   CREATED=$?
   
   zip -qr ./zips/"$FRAGMENT_NAME".zip "$FRAGMENT_NAME"
   
   # Cleanup if we generated it
   [[ $CREATED -eq 0 ]] && rm "$FRAGMENT_NAME/liferay-deploy-fragments.json"
done

# 2. Collection Zips
for COLLECTION in $COLLECTIONS; do
   COLLECTION_NAME=$(basename "$COLLECTION")
   echo "Processing collection: $COLLECTION_NAME"
   
   ensure_descriptor "$COLLECTION_NAME"
   CREATED=$?
   
   # Standard zip
   zip -qr ./zips/"$COLLECTION_NAME"-collection.zip "$COLLECTION_NAME"
   
   # Legacy zip (Uses BUILD_TEMP, so the descriptor is already copied there)
   echo "Creating pre-2025.Q3 version for $COLLECTION_NAME..."
   BUILD_TEMP="temp_build_${COLLECTION_NAME}"
   mkdir -p "$BUILD_TEMP/$COLLECTION_NAME"
   cp -r "$COLLECTION_NAME/." "$BUILD_TEMP/$COLLECTION_NAME/"
   
   find "$BUILD_TEMP/$COLLECTION_NAME" -name "configuration.json" -exec sh -c '
       jq "del(.fieldSets[].fields[].typeOptions.dependency)" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
   ' -- {} \;
   
   (cd "$BUILD_TEMP" && zip -qr ../zips/"$COLLECTION_NAME"-pre2025q3.zip "$COLLECTION_NAME")
   
   # Cleanup temp build folder
   rm -rf "$BUILD_TEMP"
   
   # Cleanup source descriptor if we generated it
   [[ $CREATED -eq 0 ]] && rm "$COLLECTION_NAME/liferay-deploy-fragments.json"
done

echo "Build complete. Zips located in ./zips/"