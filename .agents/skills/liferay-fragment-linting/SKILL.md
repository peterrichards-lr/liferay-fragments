---
name: liferay-fragment-linting
description: Instructions for running, analyzing, and satisfying the Liferay fragments quality gate and linter rules.
---

# Liferay Fragment Linting Skill

This skill guides AI agents and developers in running the quality gate, auditing fragment directories, and resolving issues identified by the linter.

## 1. Running the Linter

To execute the linting suite, run the following command from the workspace root:

```bash
npm run lint
```

This triggers `node scripts/lint-fragments.js`. The linter acts as a strict quality gate that must pass with **0 errors and 0 warnings** before committing changes.

## 2. Validation Rules & Troubleshooting

The linter enforces several categories of rules across all page fragments:

### 2.1 Metadata & Schema Validation

- **Requirement**: Validates `fragment.json` and `configuration.json` against the AJV-compiled JSON schemas.
- **Common Error**: `fragment.json schema mismatch` or `configuration.json schema mismatch`.
- **Fix**: Check that required properties (`htmlPath`, `jsPath`, `cssPath`, `configurationPath`, `name`, `type`) are defined. Verify field definitions contain `name`, `type`, and `label`.

### 2.2 Localization Validation

- **Requirement**: Verifies that every fieldset label, field label, field description, and validValues label in `configuration.json` exists as a key in `Language_en_US.properties`.
- **Common Error**: `Missing localization for label: lfr.my-fragment.title` or `Lazy localization found...`.
- **Fix**: Ensure corresponding entries exist in the collection's properties file (e.g. `Language_en_US.properties` or `form-fragments/Language_en_US.properties` for form components). Do not map a key to itself (e.g. `lfr.some-key=lfr.some-key`).

### 2.3 Strict Configuration Field Types

- **allowedDataTypes**: Fields can only use `"string"`, `"number"`, `"boolean"`, or `"object"`. Note that legacy `"int"` is NOT allowed in modern schema configurations (it is generated at build-time for older targets).
- **allowedTypes (UI inputs)**: Must be one of `text`, `textarea`, `select`, `checkbox`, `colorPicker`, `colorPalette`, `length`, `item`, `itemSelector`, `url`, or `navigationMenuSelector`.
- **Alignment Rules**:
  - A field with UI type `checkbox` must have `dataType: "boolean"` (or omit it).
  - A field with UI type `select` must have `dataType: "string"` (or omit it).

### 2.4 Default Value Typings

- **Numeric Fields**: If a field uses `dataType: "number"`, its `defaultValue` **must** be a string-based representation (e.g., `"10"` instead of `10`). This ensures backward compatibility during build-time transformations.
- **Boolean Fields**: If a field has a checkbox UI type or `dataType: "boolean"`, its `defaultValue` **must** be a strict boolean literal (`true` or `false`), not a string representation.
- **String Fields**: Any string/select fields must have string or object defaults.

### 2.5 Styling Compliance

- **Requirement**: Scans `index.css` files for hardcoded hex colors.
- **Common Warning**: `Hardcoded colors found in CSS: #ffffff. Use var() tokens.`
- **Fix**: Replace the hex color with theme variable tokens defined in [THEMES.md](file:///D:/repos/liferay-fragments/docs/THEMES.md).

### 2.6 FreeMarker Tag Balance Checks

- **Requirement**: Scans `.ftl` files to ensure all opening square-bracket directive tags (e.g. `[#if]`, `[#list]`) have matching closing tags (e.g., `[/#if]`, `[/#list]`).
- **Common Warning**: `Mismatched FreeMarker [#if] tags in index.ftl.`
- **Fix**: Review structure and close any dangling directives.

### 2.7 Markdown Reference Validation

- **Requirement**: Scans all `.md` files (excluding ignore list) for broken relative paths, missing local anchors, and broken image links.
- **Exceptions**: Missing live snapshots (under `docs/images/live/`) are reported as warnings since they depend on E2E test executions, but other broken relative links are treated as fatal errors.

### 2.8 Gallery Sync Audit

- **Requirement**: Compares `docs/gallery.md` with the latest generated structure.
- **Fix**: If out of sync, run the generation script to rebuild the markdown:
  ```bash
  node scripts/generate-gallery.js
  ```
