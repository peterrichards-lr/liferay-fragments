---
name: backward-compat-build
description: >
  Activate this skill whenever you are building, packaging, or releasing
  fragment ZIP collections. It defines the mandatory three-target build
  strategy that produces separate ZIPs for Liferay 2026.Q1+, pre-2026.Q1,
  and pre-2025.Q3, and specifies the exact dataType and checkbox default-value
  transformation rules for each target.
---

# Backward-Compatibility Build Rules

## Overview

The build script `scripts/create-fragment-zips.sh` packages every fragment
collection into **three distinct ZIP files** to support different Liferay DXP
version profiles. Source `configuration.json` files use the **2026.Q1+**
schema as the canonical source of truth; the build script transforms them
as required for older targets.

> [!CAUTION]
> **ACTIVE CONSTRAINT — Script Verification Before Any Build**
>
> **TRIGGER**: Before running `create-fragment-zips.sh` or any build/packaging
> command for fragment collections.
>
> **MANDATORY**: Execute the following tool call NOW to confirm you are using
> the correct script and that it has not changed:
> ```bash
> head -60 scripts/create-fragment-zips.sh
> ```
>
> **BLOCK**: End your turn after the tool call. You are FORBIDDEN from
> running the build until the script header is in your context in the next
> turn and you have confirmed the correct profile flags (`-collection-min`,
> `-pre2026q1-min`, `-pre2025q3-min`) exist.

> [!IMPORTANT]
> Never manually edit the intermediate or output ZIPs. All transformations are
> applied exclusively by `create-fragment-zips.sh` using `jq`. Source files
> must always conform to the 2026.Q1+ schema.

## Build Profiles

### Profile 1 — Latest DXP (`-collection-min.zip`)

**Target**: Liferay DXP 2026.Q1 LTS and later.

| Field type | Source value | Output value |
|---|---|---|
| Numeric fields (`dataType`) | `"number"` | `"number"` *(no change)* |
| Checkbox default values | `true` / `false` (boolean literals) | `true` / `false` *(no change)* |
| Numeric field default values | `"42"` (string) | `"42"` *(no change)* |

### Profile 2 — pre-2026.Q1 DXP (`-pre2026q1-min.zip`)

**Target**: Liferay DXP versions between 2025.Q3 and 2026.Q1 (exclusive).

| Field type | Source value | Output value |
|---|---|---|
| Numeric fields (`dataType`) | `"number"` | `"number"` *(no change)* |
| Checkbox default values | `true` / `false` (boolean literals) | `"true"` / `"false"` (strings) |
| Numeric field default values | `"42"` (string) | `"42"` *(no change)* |

### Profile 3 — pre-2025.Q3 DXP (`-pre2025q3-min.zip`)

**Target**: Liferay DXP versions before 2025.Q3.

| Field type | Source value | Output value |
|---|---|---|
| Numeric fields (`dataType`) | `"number"` | `"int"` |
| Checkbox default values | `true` / `false` (boolean literals) | `"true"` / `"false"` (strings) |
| Numeric field default values | `"42"` (string) | `"42"` *(no change)* |

## Running the Build

```bash
# Build all three ZIP profiles for all collections
bash scripts/create-fragment-zips.sh

# Output locations (relative to repo root)
dist/<collection-name>-collection-min.zip         # Latest DXP
dist/<collection-name>-pre2026q1-min.zip          # pre-2026.Q1
dist/<collection-name>-pre2025q3-min.zip          # pre-2025.Q3
```

## Key Constraints

- `"dataType": "boolean"` is **prohibited** for checkbox fields in all
  profiles. Liferay 2026.Q1 rejects it with a validation error on deployment.
- `"type": "number"` inside `typeOptions.validation` is **prohibited** in all
  profiles. It causes a `ClassCastException` (HTTP 500) during page creation.
- Numeric field `defaultValue` must always be a **string representation** of
  the number (e.g. `"3"` not `3`) in all profiles, because Liferay parses
  these as strings via the Headless Delivery API.

<!-- markdownlint-disable MD049 -->
---
*Last Updated: 2026-07-21* | *Last Reviewed: 2026-07-21*
