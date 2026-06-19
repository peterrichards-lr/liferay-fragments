# Aura - Final CTA Banner

## Overview

The `aura-final-cta` fragment is a clean, centered call-to-action banner intended for the final conversion section of a page. It features an editable slogan and two editable links (primary and secondary/inverted) within an Aura-styled card.

## Configuration

This fragment has no custom configuration options in `configuration.json`. It is purely driven by static HTML and inline editable elements.

## Usage & Behavior

The fragment is a static component utilizing the `data-lfr-editable-id` and `data-lfr-editable-type` properties to enable Liferay inline editing.
Editable elements include:

- `title` (text): The main slogan heading.
- `cta` (link): The primary call to action button (`btn-primary`).
- `ctaAlt` (link): The secondary call to action button (`btn-primary inverted`).

## Dependencies

- Relies on `aura-container` and `aura-card` CSS classes for the main structural styling.
- Uses `var(--aura-body-background)` CSS token for the background color, ensuring fidelity with the Aura theme.
- Uses Liferay core utility classes such as `btn` and `btn-primary`.
