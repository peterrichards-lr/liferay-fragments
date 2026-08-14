# Aura - Lookbook Row

## Overview

The `aura-lookbook` fragment displays an image alongside a rich-text block and call-to-action buttons. It uses a split-layout (grid) approach designed to feature a collection, product, or lifestyle image along with a descriptive paragraph and multiple actions.

## Configuration

This fragment has no custom configuration options in `configuration.json`.

## Usage & Behavior

The fragment is built upon a 2-column grid layout (`grid grid-2`) using native HTML structure and Liferay editables:

- `image` (image): The main featured image.
- `title` (rich-text): A heading for the featured content.
- `body` (rich-text): The main descriptive paragraph.
- `cta` (link): Primary action button.
- `cta2` (link): Secondary action button.

## Dependencies

- Utilizes CSS classes like `aura-container`, `grid`, and `grid-2` for layout.
- Uses `img-soft` for image styling.
- The root `<section>` carries the `aura-lookbook` class, which activates the image-sizing rules in `aura.css`. These constrain the featured image to `--aura-lookbook-aspect` with `object-fit: cover` — a 4/5 portrait crop on desktop, widening to 16/10 below 900px. Removing the class leaves the `<img>` at its intrinsic size and breaks the split layout.
- Uses the `var(--aura-heading-color)` CSS token for theming the heading text.
- Standard Liferay button classes (`btn`, `btn-primary`, `btn-secondary lighten`).

## E2E Test Data

`test/test-data.json` seeds the `image` editable from `e2e-tests/assets/aura/aura-lookbook-hero.webp`, uploaded to Documents & Media under the ERC `AURA-LOOKBOOK-HERO`.

Because the desktop slot crops to a 4/5 portrait via `object-fit: cover`, the asset is pre-padded to 4:5 on its native background colour. A source at any other aspect ratio would have its edges cropped away — for a branded hero, that means losing wordmark or price detail.

<!-- markdownlint-disable MD049 -->

---

_Last Updated: 2026-08-14_ | _Last Reviewed: 2026-08-13_
