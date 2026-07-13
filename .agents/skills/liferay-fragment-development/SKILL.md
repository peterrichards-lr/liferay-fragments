---
name: liferay-fragment-development
description: Guidelines and workflows for creating, structuring, developing, and mapping properties for page fragments in Liferay DXP.
---

# Liferay Fragment Development Skill

This skill guides AI agents and developers in creating, styling, structuring, and localizing Liferay page fragments according to the repository's rules.

## Configuration Gate Check — Do This First

> This configuration check needs to happen first.

**First step**: Before scaffolding any fragment, verify if the current collection directory requires any specific theme-aware HTML or configuration setup. Stop and ask the user for clarification if the target collection path is not specified.

## 1. Creating a Fragment

To bootstrap a new fragment with standard scaffolding, run the following command from the workspace root:

```bash
npm run create-fragment "[Collection Name]" "[Fragment Name]"
```

This runs `scripts/create-fragment.js`, which does the following:

- If the collection directory is new, creates `collection.json` at `<Collection Name>/main/collection.json` with a display name and description. **This file is required** — the build script (`create-fragment-zips.sh`) discovers collections by looking for this file, and without it the collection is silently excluded from all ZIP builds.
- Scaffolds a directory at `<Collection Name>/main/<safe-fragment-name>/`.
- Creates `fragment.json` with explicit paths.
- Creates `fragment-build.json` linking `commons.js` by default.
- Creates boilerplate configuration (`configuration.json`), HTML (`index.html`), JS (`index.js`), CSS (`index.css`), and metadata (`test/metadata.json`).
- Automatically inserts default labels and descriptions into `<Collection Name>/main/Language_en_US.properties`.

### 1.1 Configuration Schema Data Types

**Load:** `references/configuration-schema.md` when defining `configuration.json`.

## 2. Structure & Metadata

Every fragment must follow these structural guidelines:

- **Explicit Paths**: `fragment.json` must explicitly define `htmlPath`, `jsPath`, `cssPath`, and `configurationPath`. Do not rely on Liferay's implicit folder naming defaults.
- **JavaScript Encapsulation**:
  - All client-side JavaScript must be encapsulated within an initialization function (e.g. `initMyFragment()`).
  - Top-level `return` statements are strictly prohibited.
  - To prevent collision with other fragments on the page, always query internal elements using `fragmentElement.querySelector` instead of the global `document.querySelector`.
- **Template Extension Rule (FTL vs HTML)**:
  - Use `.ftl` if the fragment contains ANY FreeMarker logic (e.g., conditional checks `[#if]`, loops `[#list]`, `[#assign]`) or references Liferay variables (e.g., `${siteSpritemap}`).
  - Use `.html` ONLY for strictly static HTML or basic `data-lfr-editable` fields.
- **Input Type Fragments & Context Variables**:
  - Any fragment designed to capture user inputs (e.g. form fields, rating components, date/signature selectors) must have `"type": "input"` (instead of `"type": "component"`) and a `typeOptions` mapping in `fragment.json` (e.g., `"typeOptions": { "fieldTypes": ["text", "number"] }`).
  - Specifying `"type": "input"` instructs Liferay DXP to inject the `input` context map (containing `input.label`, `input.required`, `input.errorMessage`, `input.readOnly`, `input.name`) into the FreeMarker template context.
  - When referencing the `input` context map in your template code, always declare a defensive fallback (e.g. `[#assign lfrInput = input!{}]`) to prevent Liferay DXP from raising compile-time `NullPointerException` errors during import and saving it in `DRAFT` status.

## 3. Theme & Styling Fidelity

- **Safe Tokens**: Fragments must be theme-aware and use CSS variable tokens defined in [THEMES.md](file:///D:/repos/liferay-fragments/docs/THEMES.md).
- **No Hardcoded Hex Values**: Hardcoded hex values (e.g. `#ffffff`, `#333333`) are prohibited in `index.css` and will fail the linter. Always use `var()` tokens (e.g. `var(--primary)`, `var(--body-bg)`).
- **Targeted Overrides**: If theme-specific overrides are needed, scope the CSS selectors with theme-specific body classes (e.g., `.meridian-theme`, `.liferay-dialect-theme`, `.classic-theme`).

## 4. Localization (i18n)

- **Comprehensive Coverage**: ALL labels and descriptions in `configuration.json` (including those within `validValues` arrays) MUST have a corresponding entry in the collection's `Language_en_US.properties` file.
- **Root-level Localization**: Some collections (such as `form-fragments`) consolidate all per-fragment properties into a single root-level `Language_en_US.properties` file. Check if the collection root has this file.
- **No Lazy Keys**: Property entries where the key equals the value (e.g. `lfr.key=lfr.key`) are prohibited.
- **Descriptions**: Every field in `configuration.json` must have a meaningful description to assist content creators.

## 5. Site-Scoped Object Discovery

**Load:** `references/site-scoped-discovery.md` when the fragment interacts with custom objects to use the Dynamic Discovery Pattern.

## 6. Mappable Field Ergonomics

- **Requirements**: Non-title mappable fields (`data-lfr-editable`) MUST be wrapped in a `.meta-editor-mappable-fields` container.
- **Behavior**: This container should be styled to be hidden during runtime but visible/editable within the page editor.

## 7. Documentation

- **Sync Rule**: Whenever a fragment is created or updated, its corresponding markdown documentation in `docs/fragments/` must be created or updated.
- **Layout**: The documentation file name must match either the name property (slugified) or the folder name of the fragment. It must contain the following sections:
  - **Overview**: Description of what the fragment does.
  - **Configuration**: Explanation of all `configuration.json` fieldSets and fields.
  - **Usage**: Guidelines on how to add and configure it in the page editor.
