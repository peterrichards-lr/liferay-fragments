# Multi-Theme Integration Standards

Fragments must be developed to support Liferay's primary themes: **Classic**, **Dialect**, and **Meridian**. This is achieved by using semantic CSS tokens instead of hardcoded values.

## Design Principles

- **Semantic First**: Use tokens like `--primary` or `--card-background-color` which are redefined per theme.
- **Graceful Fallbacks**: Provide a sensible default for tokens that might not be present in older themes.
- **Spritemap Consistency**: Use the theme-specific spritemap for all `clay:icon` rendering to ensure high-fidelity icons.

## High-Fidelity Tokens (Reference `docs/THEMES.md`)

### 1. Color Palette

| Token                | Purpose                            |
| :------------------- | :--------------------------------- |
| `--primary`          | Main brand action color.           |
| `--secondary`        | Subtle supporting color.           |
| `--body-bg`          | Main background color of the page. |
| `--body-color`       | Main text color.                   |
| `--color-neutral-0`  | White / pure background.           |
| `--color-neutral-10` | Black / maximum contrast text.     |

### 2. Spacing & Layout

- Use `--spacer-0` through `--spacer-10` for margins and padding.
- For Meridian, use `--border-radius-lg` (0.5rem) and `--border-radius-xl` (1rem).

### 3. Typography

- `--font-family-base`: System-native or Inter (depending on theme).
- `--h1-font-size` through `--h6-font-size`.

## Implementation Strategy

### 1. Variable Bridging

If a fragment requires a custom variable that depends on a theme color, define it in `index.css`:

```css
.my-fragment-header {
  /* Bridges to theme primary with a fallback */
  background-color: var(--primary, #0b5fff);
  color: var(--color-neutral-0, #fff);
  padding: var(--spacer-4, 1.5rem);
}
```

### 2. Testing Theme Fidelity

Always verify fragment rendering across all three themes using the test-bed:

```bash
# Test in Meridian
node test-bed/runner.js [path] view meridian

# Test in Dialect
node test-bed/runner.js [path] view dialect

# Test in Classic
node test-bed/runner.js [path] view classic
```
