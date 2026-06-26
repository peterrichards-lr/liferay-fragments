# Aura Collection

A high-fidelity design system for lifestyle and product-focused pages, featuring
a scoped container architecture and clean, modern aesthetics.

## Fragments

### 1. Aura - Scoped Container

The foundation of any Aura-based page. This component injects the `aura.css`
design tokens and provides a scoped `.aura-scope` wrapper.

- **Usage**: Must wrap all other Aura fragments to ensure design fidelity.

### 2. Aura - Lookbook

A classic "split" layout with a focus image and descriptive text.

- **Editable Fields**: Image, Slogan, Body (Rich Text), Primary CTA, Secondary
  CTA.

### 3. Aura - USP Grid

A responsive 4-column grid for highlighting key features or Unique Selling
Points.

- **Editable Fields**: 4x Titles, 4x Text descriptions.

### 4. Aura - Product Gallery

A grid-based showcase for product variations or gallery images.

- **Editable Fields**: Gallery Title, 4x Images, 4x Captions.

### 5. Aura - Final CTA

A high-impact call-to-action banner for the bottom of pages.

- **Editable Fields**: Slogan, Primary CTA, Inverted CTA.

## Design Tokens (aura.css)

The Aura collection uses a specific palette of custom CSS variables:

- `--aura-color-primary-default`: Deep Navy (#0d2c54)
- `--aura-color-secondary-default`: Warm Copper (#c8742e)
- `--aura-radius-base`: 16px
- `--aura-font-family-base`: Poppins
