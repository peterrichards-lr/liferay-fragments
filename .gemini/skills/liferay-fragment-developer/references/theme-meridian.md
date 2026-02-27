# Meridian Theme Integration

## Design Principles
Fragments should inherit styles from the Meridian theme to ensure brand consistency and reduce configuration overhead.

## CSS Tokens
- **Colors**: Prefer `--primary`, `--secondary`, `--body-color`, `--body-background-color`, and their variants (`--primary-d1`, `--secondary-l3`).
- **Spacing**: Use `--spacer-0` through `--spacer-10` for margins and padding.
- **Typography**: Use `--font-family-base`, `--font-size-base`, and heading tokens (`--h1-font-size`).

## Implementation
- **Prefer Theme Tokens**: Use theme-provided CSS tokens over hardcoded hex codes or pixel values.
- **Variable Bridging**: Define dynamic values in the HTML root element's `style` attribute and reference them in `index.css` via `var(--my-var, default-token)`.
- **Responsive Sizing**: Use `rem` units or theme-provided sizing tokens for fluid layouts.
