# Liferay Theme Tokens & Spritemaps

This document serves as a high-fidelity reference for the CSS variables (tokens) and icon spritemaps used across Liferay's primary themes.

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
if (themeId === "liferay-meridian-theme") {
  // Meridian specific logic
}
```

### CSS (Body Classes)

Liferay DXP injects theme-specific classes into the `<html>` or `<body>` element.

- `.meridian-theme`
- `.liferay-dialect-theme`
- `.classic-theme`

## 3. Cross-Theme CSS Intersect (Safe Tokens)

Use these variables to ensure your fragment looks good across Classic, Dialect, and Meridian.

| Variable             | Description        | Classic   | Dialect   | Meridian  |
| :------------------- | :----------------- | :-------- | :-------- | :-------- |
| `--primary`          | Main brand color   | `#0b5fff` | `#5924eb` | `#007dad` |
| `--body-bg`          | Page background    | `#fff`    | `#fff`    | `#fff`    |
| `--body-color`       | Main text color    | `#1c1c24` | `#1d1c21` | `#272833` |
| `--secondary`        | Secondary color    | `#6b6c7e` | `#ffc124` | `#6b6c7e` |
| `--success`          | Success state      | `#28a745` | `#4aab3b` | `#28a745` |
| `--danger`           | Error/Danger state | `#dc3545` | `#da1414` | `#dc3545` |
| `--font-family-base` | Primary font       | System    | System    | Inter     |

### Theme-Specific Variable Mapping

If a variable is missing in one theme, it will fallback to the second value provided in the `var()` function.

```css
.card {
  /* Dialect uses --color-brand-primary, others use --primary */
  background-color: var(--color-brand-primary, var(--primary));

  /* Meridian uses specific border-radius tokens */
  border-radius: var(--border-radius-lg, 0.5rem);
}
```
