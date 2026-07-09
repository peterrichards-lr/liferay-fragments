# Aura - Product Gallery

## Overview

The `aura-product-gallery` fragment provides a simple, 4-column grid for displaying products, options, or categories. It features a heading and four individual items, each with an image and a caption.

## Configuration

There are no configuration fields defined in `configuration.json` for this fragment.

## Usage & Behavior

The fragment employs a `grid-4` class to display 4 equally-spaced image/caption cards.
Editable elements:

- `title` (text): The main gallery heading.
- `img1` to `img4` (image): The images for the 4 product slots.
- `cap1` to `cap4` (text): The bold captions below each respective image.

## Dependencies

- Leverages the `aura-container` class and a `grid grid-4` layout.
- The gallery items use the `<figure>` and `<figcaption>` elements styled with `aura-card` and `img-soft` classes.
- Uses the `var(--aura-heading-color)` CSS token for the heading, maintaining Theme Tokens compliance.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
