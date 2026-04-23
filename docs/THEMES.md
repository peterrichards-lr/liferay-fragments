# Liferay Theme Tokens & Spritemaps

This document serves as a high-fidelity reference for the CSS variables (tokens)
and icon spritemaps used across Liferay's primary themes.

## 1. Theme Spritemaps

| Theme    | Spritemap Path                                                                               |
| :------- | :------------------------------------------------------------------------------------------- |
| Classic  | `http://localhost:8080/o/classic-theme/images/clay/icons.svg`                                |
| Dialect  | `http://localhost:8080/o/classic-theme/images/clay/icons.svg`                                |
| Meridian | `/o/liferay-meridian-theme-spritemap/spritemap.8307d7990251156eda9756f23c14476cdae64be3.svg` |

## 2. Theme Detection

### FreeMarker

```freemarker
<#assign themeName = themeDisplay.getTheme().getName() />
<#if themeName == "Meridian">
  <!-- Meridian specific logic -->
</#if>
```

### JavaScript

```javascript
const themeId = Liferay.ThemeDisplay.getThemeId();
if (themeId === 'liferay-meridian-theme') {
  // Meridian specific logic
}
```

### CSS (Body Classes)

Liferay DXP injects theme-specific classes into the `<html>` or `<body>`
element.

- `.meridian-theme`
- `.liferay-dialect-theme`
- `.classic-theme`

## 3. Cross-Theme CSS Intersect (Safe Tokens)

Use these variables to ensure your fragment looks good across Classic, Dialect,
and Meridian.

| Variable             | Description        | Classic   | Dialect   | Meridian  |
| :------------------- | :----------------- | :-------- | :-------- | :-------- |
| `--primary`          | Main brand color   | `#0b5fff` | `#5924eb` | `#007dad` |
| `--body-bg`          | Page background    | `#fff`    | `#fff`    | `#fff`    |
| `--body-color`       | Main text color    | `#1c1c24` | `#1d1c21` | `#272833` |
| `--secondary`        | Secondary color    | `#6b6c7e` | `#ffc124` | `#6b6c7e` |
| `--success`          | Success state      | `#28a745` | `#4aab3b` | `#28a745` |
| `--warning`          | Warning state      | `#ffc107` | `#ffc124` | `#ffc107` |
| `--danger`           | Error/Danger state | `#dc3545` | `#da1414` | `#dc3545` |
| `--white`            | Plain white        | `#fff`    | `#fff`    | `#fff`    |
| `--black`            | Plain black        | `#000`    | `#000`    | `#000`    |
| `--font-family-base` | Primary font       | System    | System    | Inter     |

### Spacing & Layout Tokens

Meridian provides a standardized spacer scale that should be used for margins
and padding.

| Variable      | Value (Default) |
| :------------ | :-------------- |
| `--spacer-1`  | `0.25rem`       |
| `--spacer-2`  | `0.5rem`        |
| `--spacer-3`  | `1rem`          |
| `--spacer-4`  | `1.5rem`        |
| `--spacer-5`  | `2rem`          |
| `--spacer-6`  | `2.5rem`        |
| `--spacer-7`  | `3rem`          |
| `--spacer-8`  | `4rem`          |
| `--spacer-10` | `6rem`          |

### Typography Scale

| Variable               | Description         |
| :--------------------- | :------------------ |
| `--font-size-base`     | Base text size      |
| `--font-size-sm`       | Small text          |
| `--font-size-lg`       | Large text          |
| `--h1-font-size`       | Heading 1 size      |
| `--h2-font-size`       | Heading 2 size      |
| `--font-weight-bold`   | Bold weight (700)   |
| `--font-weight-normal` | Normal weight (400) |

### Gray Scale

| Variable     | Meridian Value |
| :----------- | :------------- |
| `--gray-100` | `#f7f8f9`      |
| `--gray-200` | `#f1f2f5`      |
| `--gray-300` | `#e7e7ed`      |
| `--gray-900` | `#272833`      |

### Theme-Specific Variable Mapping

If a variable is missing in one theme, it will fallback to the second value
provided in the `var()` function.

```css
.card {
  /* Dialect uses --color-brand-primary, others use --primary */
  background-color: var(--color-brand-primary, var(--primary));

  /* Meridian uses specific border-radius tokens */
  border-radius: var(--border-radius-lg, 0.5rem);
}
```
