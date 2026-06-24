# Liferay Configuration Compatibility Transformations Guide

This document outlines the build-time configuration compatibility architecture used in this project to support different Liferay DXP tag releases. It serves as a guide for developers to maintain and extend the configuration transformations for future Liferay releases.

---

## 1. Why We Use Build-Time Transformations

Liferay DXP has undergone several changes in how it validates and parses fragment `configuration.json` schemas:
- **Liferay 2026.Q1+ (Latest)**: Expects `"dataType": "number"` on numeric fields and strict boolean literals (e.g. `true`/`false`) for checkbox default values.
- **Pre-2026.Q1**: Expects boolean defaults to be string representations (`"true"`/`"false"`).
- **Pre-2025.Q3 (Legacy)**: Does not support `"dataType": "number"` (expects `"int"` instead), does not support condition dependencies, and expects all default values to be string representations.

To avoid duplicate code, we maintain **a single source of truth** in the codebase (the modern schema) and run a pipeline to transform the configuration metadata dynamically when building target zip packages.

---

## 2. Target ZIP Suffixes

The build script `create-fragment-zips.sh` compiles three distinct zip suffix packages per collection:

| Target Suffix | Liferay Version Compatibility | Key Transformations |
|---|---|---|
| `-collection-min.zip` | Liferay 2026.Q1+ (Latest) | Converts string default values on numeric fields into actual JSON numbers. |
| `-pre2026q1-min.zip` | Intermediate DXP Releases | Converts checkbox boolean defaults into string representations. |
| `-pre2025q3-min.zip` | Legacy DXP Releases | Converts `"number"` → `"int"`, converts all defaults to string, and strips conditional dependencies. |

---

## 3. How Transformations Work (The build pipeline)

The compatibility transformations are performed inside [create-fragment-zips.sh](file:///D:/repos/liferay-fragments/create-fragment-zips.sh) using **`jq`**, a command-line JSON processor. 

Runtime code (JS and FreeMarker FTL) is **never modified** by the build pipeline. All fragments are written defensively using type coercions (`?number` in FTL and `parseInt()`/`parseFloat()` in JS) to work regardless of which zip variant is deployed.

---

## 4. How to Support a New Liferay Release

Follow this step-by-step process if a future release (e.g., `2027.Q1`) introduces a breaking change to the configuration metadata requirements:

### Step 1: Define a Build Directory
In `create-fragment-zips.sh`, copy the source directory into a new temporary directory block for the release:
```bash
# --- E. Future Release (2027.Q1) ---
BUILD_TEMP_2027="temp_post2027q1_${COLLECTION_NAME}"
mkdir -p "$BUILD_TEMP_2027/$COLLECTION_NAME"
cp -r "$COLLECTION_NAME/." "$BUILD_TEMP_2027/$COLLECTION_NAME/"
```

### Step 2: Implement the `jq` Transformation
Locate all `configuration.json` files and use a `jq` filter to apply the necessary transformations. 

```bash
find "$BUILD_TEMP_2027/$COLLECTION_NAME" -name "configuration.json" -print0 | while IFS= read -r -d '' config_file; do
    jq "<YOUR_JQ_FILTER_HERE>" "$config_file" > "$config_file.tmp" && mv "$config_file.tmp" "$config_file"
done
```

#### Common `jq` Snippet Recipes:
- **Rename a property**:
  ```jq
  "(.. | objects | select(.oldKey != null)) .newKey = .oldKey | del(.oldKey)"
  ```
- **Convert numbers to strings**:
  ```jq
  "(.. | objects | select(.dataType == \"number\" and .defaultValue != null)) .defaultValue |= tostring"
  ```
- **Delete conditional dependencies**:
  ```jq
  "del(.fieldSets[].fields[].typeOptions.dependency)"
  ```
- **Remove a deprecated field**:
  ```jq
  "del(.fieldSets[].fields[] | select(.name == \"legacyField\"))"
  ```

### Step 3: Zip and Cleanup
Compress the directory and target the new suffix name, then clean up the temporary directory:
```bash
OUTPUT_ZIP_2027_ABS="$ZIPS_ROOT/fragments/${COLLECTION_NAME}-post2027q1${BUILD_SUFFIX}.zip"
(cd "$BUILD_TEMP_2027" && zip -qr "../$OUTPUT_ZIP_2027_ABS" . -x "*.DS_Store" -x "*/fragment-build.json" -x "*/collection-build.json")
rm -rf "$BUILD_TEMP_2027"
```

---

## 5. Verification and Testing

After implementing a new compatibility transformation:
1. Run `./create-fragment-zips.sh` to generate the new zip package.
2. Inspect the generated ZIP to ensure that `configuration.json` has the expected schema format.
3. Test deployment in a targeted container using the test runner:
   ```powershell
   $env:PORT="8081"; & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -f <fragment-name>
   ```
