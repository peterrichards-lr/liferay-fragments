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
- `cap1` to `cap4` (text): The bold captions below each respective image. They default to the colourway names `Blue`, `Burgundy`, `Plum`, and `Rose`.

## Dependencies

- Leverages the `aura-container` class and a `grid grid-4` layout.
- The gallery items use the `<figure>` and `<figcaption>` elements styled with `aura-card` and `img-soft` classes.
- The root `<section>` carries the `aura-gallery` class, which activates the image-sizing rules in `aura.css`. These normalise every slot to `--aura-gallery-aspect` (4/3) with `object-fit: contain` over a white backdrop, so source photography of differing dimensions and aspect ratios still yields a uniform grid. Removing the class leaves each `<img>` at its intrinsic size and breaks the layout.
- Uses the `var(--aura-heading-color)` CSS token for the heading, maintaining Theme Tokens compliance.

## E2E Test Data

`test/test-data.json` seeds the four image slots from local assets in `e2e-tests/assets/aura/`, uploaded to Documents & Media and resolved by external reference code:

| Editable | ERC | Asset |
| --- | --- | --- |
| `img1` | `AURA-FRAME-BLUE` | `aura-frame-blue.jpeg` |
| `img2` | `AURA-FRAME-BURGUNDY` | `aura-frame-burgundy.jpeg` |
| `img3` | `AURA-FRAME-PLUM` | `aura-frame-plum.jpeg` |
| `img4` | `AURA-FRAME-ROSE` | `aura-frame-rose.jpeg` |

<!-- markdownlint-disable MD049 -->

---

_Last Updated: 2026-08-14_ | _Last Reviewed: 2026-08-13_
