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
- Uses the `var(--aura-heading-color)` CSS token for theming the heading text.
- Standard Liferay button classes (`btn`, `btn-primary`, `btn-secondary lighten`).

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
