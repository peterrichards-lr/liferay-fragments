---
name: fragment-screenshot-creation
description: Guidelines and step-by-step instructions for generating, capturing, verifying, and committing updated visual screenshots of Liferay page fragments.
---

# Liferay Fragment Screenshot Creation & Capture Skill

This skill provides step-by-step instructions and quality gates for developers and AI agents to capture, regenerate, and verify visual screenshots of Liferay page fragments across responsive viewports.

## 1. Visual Verification Quality Checklist

When capturing or updating fragment screenshots, you must ensure the captured images represent a production-ready, clean user experience. Follow this checklist:

- **Unauthenticated Guest Context**: Visual screenshots must be captured in a guest context to prevent Liferay's admin headers, edit mode borders, and floating control menus from cluttering the layout.
  - Playwright tests must use:
    ```javascript
    test.use({ storageState: { cookies: [], origins: [] } });
    ```
- **Device Viewports**: Every fragment must be captured and verified across three target viewports:
  - **Desktop**: 1920x1080 (landscape)
  - **Tablet**: 768x1024 (portrait)
  - **Mobile**: 375x812 (portrait)
- **Container / Grid Screenshotting**: If a fragment displays multiple items side-by-side (e.g., product cards, slider columns), Playwright must screenshot the parent layout row or container (`.lfr-layout-structure-item-row, .row, #wrapper`) instead of only the first fragment child node to demonstrate grid responsiveness.
- **Seeded Mock Data (No Placeholders)**: Screenshots must show realistic content. Do not capture loading spinners, empty lists, or broken image icons:
  - Seed mock database records (e.g., custom objects, commerce products, structured content) during the E2E setup phase.
  - Reference mock files/images in `test-data.json` using local assets that are uploaded programmatically and mapped to real URLs.
- **Guest View Permissions**: Explicitly configure guest permissions for all seeded mock assets (e.g. `viewableBy: "Anyone"`, SAP policy `SYSTEM_DEFAULT` wildcard access) to avoid unauthenticated visitor `403 Forbidden` error states in the screenshots.

## 2. Screenshot Generation Workflow

Follow these steps to update or create screenshots:

### Step 2.1: Define Page Layout (`test-data.json`)

Ensure the target fragment folder contains a valid `test-data.json` file configuring its layout structure, mock data mappings, and any dependent assets (like Document & Media images).

### Step 2.2: Execute the Test Runner

In Windows environments, run the test-runner from PowerShell via Git Bash. Hook into the active project container (`e2e-test-env`) and target the specific fragment or collection:

```powershell
$env:PORT="8081"; & "C:\Program Files\Git\bin\bash.exe" scripts/test-runner.sh -p e2e-test-env -k -f "<Fragment/Collection Name>"
```

_Note: The script automatically generates visual snapshots under `docs/images/live/`._

### Step 2.3: Recompile the Visual Gallery

After capturing new snapshots, run the gallery compilation script to update the unified documentation page and avoid gallery drift warnings:

```bash
node scripts/generate-gallery.js
```

### Step 2.4: Version Control Commit

Verify that the generated PNG files are successfully staged and not ignored. Commit both the gallery markdown and the live images:

```bash
git add docs/images/live/ docs/gallery.md
git commit -m "docs: regenerate visual screenshots and gallery for <Fragment Name>"
```

## 3. Troubleshooting Common Failure Modes

### 3.1 Infinite Loading Spinners / Blank Records

- **Cause**: Liferay is failing to fetch custom object records because Guest API access is restricted.
- **Fix**: Check `e2e-tests/tests/global-setup.js` and verify that the custom object's permissions are updated to grant read access to the Guest role, and that the object definition itself exists in the database.

### 3.2 403 Session Mismatch in Playwright

- **Cause**: Playwright's emulated browser user-agents trigger CSRF session security checks.
- **Fix**: Override the user-agent string for mobile and tablet configurations in `playwright.config.js` to match the Desktop Chrome user-agent.

### 3.3 Fragment Page Seeding Fails (500 Internal Server Error)

- **Cause**: The fragment's FreeMarker template (`index.ftl`) evaluated a missing configuration key or an incorrect type (such as applying logical NOT `!` to a string representation of a boolean).
- **Fix**: Guard all `configuration` calls in `index.ftl` using parenthesis and default values (e.g. `(configuration.myProperty)!""`), and convert checkbox/boolean variables to true boolean types first:
  ```ftl
  [#assign myCheckbox = ((configuration.myCheckbox!"")?string == "true") /]
  ```
