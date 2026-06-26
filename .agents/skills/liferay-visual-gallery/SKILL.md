---
name: liferay-visual-gallery
description: Instructions for capturing responsive screenshots of page fragments and updating the project's visual gallery markdown.
---

# Liferay Visual Gallery & Screenshot Capture Skill

This skill provides step-by-step instructions for developers and AI agents to capture E2E visual snapshots of Liferay page fragments across viewports and generate the unified documentation gallery.

## 1. Capturing Screenshots

To capture screenshots of page fragments, run the automated test suite. Visual snapshots are captured across three viewports:

- **Desktop**: 1920x1080
- **Tablet**: 768x1024
- **Mobile**: 375x812

### Command Examples

In Windows environments, run these commands from the workspace root using Git Bash:

- **Capture All Fragments**:
  ```powershell
  $env:PORT="8081"; & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k
  ```
- **Capture Specific Fragment or Collection**:
  ```powershell
  $env:PORT="8081"; & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k -f "<Fragment/Collection Name>"
  ```

> [!NOTE]
>
> - `-p e2e-test-env` hooks into the active running container, bypassing long container boot times.
> - `-k` or `--keep-alive` keeps the Liferay Docker container running after execution for debugging.

## 2. Compiling the Visual Gallery

After executing the tests, you must synchronize the visual gallery documentation to prevent linter errors due to "gallery drift":

1.  **Regenerate Gallery Markdown**:
    ```bash
    node scripts/generate-gallery.js
    ```
    This script searches for fragment metadata and compiles snapshot links into `docs/gallery.md` in side-by-side tables.
2.  **Verify Layout & Links**:
    Check that the generated file contains valid relative links to local images under `docs/images/live/`.

## 3. Git Management of Snapshots

To track visual regression across commits, the captured screenshots under `docs/images/live/` must be committed to the repository:

- Ensure `.gitignore` does not exclude the generated pngs. The override pattern in `.gitignore` must be:
  ```
  !/docs/images/live/**/*.png
  ```
- After capturing screenshots and generating the gallery, stage and commit the images:
  ```bash
  git add docs/images/live/ docs/gallery.md
  ```

## 4. Troubleshooting Common Errors

### 4.1 Broken Images / Blank Snapshots

- **Cause**: Liferay failed to seed mock assets or custom objects before browser rendering.
- **Fix**: Verify Liferay's custom objects are deployed successfully. Check `e2e-tests/tests/global-setup.js` for proper Guest API permissions configurations.

### 4.2 Gallery Drift Warnings

- **Cause**: Fragment collections were created, modified, or deleted without updating `docs/gallery.md`.
- **Fix**: Re-run `node scripts/generate-gallery.js` to compile the visual table structures again.
