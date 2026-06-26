---
name: liferay-compat-transform
description: Instructions on building, maintaining, and extending the Liferay DXP build-time configuration compatibility transformations (create-fragment-zips.sh) using jq.
---

# Liferay Configuration Compatibility Transformations Skill

This skill allows the agent to build, maintain, and extend the fragment configuration transformation pipeline (`create-fragment-zips.sh`) to support different Liferay DXP releases.

## Core Concepts

Liferay DXP validates `configuration.json` properties (dataType, defaultValue, dependencies) differently across versions:

- **2026.Q1+ (Latest)**: Expects `"dataType": "number"` on numeric fields and strict boolean literals for checkbox defaults.
- **Pre-2026.Q1**: Expects checkbox defaults to be string representations.
- **Pre-2025.Q3**: Expects `"dataType": "int"` instead of `"number"`, deletes conditional dependencies, and expects string defaults everywhere.

To avoid duplicate code, we maintain the single modern schema source in the repository and run a pipeline in `create-fragment-zips.sh` using `jq` to build target ZIPs.

## How to Extend Transformations for a New Release

If a future Liferay release (e.g., `2027.Q1`) introduces a breaking change to the configuration metadata requirements:

1. **Define a Build Directory**:
   In `create-fragment-zips.sh`, copy the collection source into a new temp directory:

   ```bash
   BUILD_TEMP_2027="temp_post2027q1_${COLLECTION_NAME}"
   mkdir -p "$BUILD_TEMP_2027/$COLLECTION_NAME"
   cp -r "$COLLECTION_NAME/." "$BUILD_TEMP_2027/$COLLECTION_NAME/"
   ```

2. **Apply the jq Transformation**:
   Transform `configuration.json` using a `jq` filter:

   ```bash
   find "$BUILD_TEMP_2027/$COLLECTION_NAME" -name "configuration.json" -print0 | while IFS= read -r -d '' config_file; do
       jq "<YOUR_JQ_FILTER>" "$config_file" > "$config_file.tmp" && mv "$config_file.tmp" "$config_file"
   done
   ```

   _Common JQ Recipes:_
   - Rename property: `"(.. | objects | select(.oldKey != null)) .newKey = .oldKey | del(.oldKey)"`
   - Convert numbers to strings: `"(.. | objects | select(.dataType == \"number\" and .defaultValue != null)) .defaultValue |= tostring"`
   - Remove dependency block: `"del(.fieldSets[].fields[].typeOptions.dependency)"`

3. **Zip and Clean up**:
   Zip the directory using the new suffix target:

   ```bash
   OUTPUT_ZIP_2027_ABS="$ZIPS_ROOT/fragments/${COLLECTION_NAME}-post2027q1${BUILD_SUFFIX}.zip"
   (cd "$BUILD_TEMP_2027" && zip -qr "../$OUTPUT_ZIP_2027_ABS" . -x "*.DS_Store")
   rm -rf "$BUILD_TEMP_2027"
   ```

4. **Verify Locally**:
   Run the local E2E suite targeting the matching tag:
   ```powershell
   $env:PORT="8081"; & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -f <collection-name>
   ```
