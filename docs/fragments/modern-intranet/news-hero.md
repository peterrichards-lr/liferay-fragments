# News Hero

## Overview

The **News Hero** fragment provides a large, featured article display for the intranet homepage. It pairs an eye-catching image with key article details such as category, title, summary, date, and read time.

## Configuration Options

The fragment can be configured via standard Liferay fragment configuration properties:

| Name         | Type  | Default | Description                                    |
| ------------ | ----- | ------- | ---------------------------------------------- |
| `viewAllURL` | `url` | `#`     | The destination URL for the full news archive. |

## Usage/Behavior

- **Layout**: Features a two-column layout on larger screens (image on the left, text on the right) and stacks vertically on mobile devices.
- **Editable Fields**:
  - `news-image` (image)
  - `news-category` (text)
  - `news-title` (text)
  - `news-summary` (rich-text)
  - `news-date` (text)
  - `news-read-time` (text)
- **Mappable Fields**: The fragment provides `news-url` and `news-author` mapped fields. These fields are hidden during normal view mode via the `.meta-editor-mappable-fields` CSS class, only showing in `edit` layout mode, which provides a clean editing experience.
- **Header**: Includes a "Company News" title (localized) and a conditional "View All" link if the `viewAllURL` is configured.

## Dependencies

### Javascript

- No specific Javascript dependencies. The fragment relies purely on HTML/CSS and Liferay's standard editables.

### CSS

- **Responsive Design**: Uses a media query (`max-width: 767.98px`) to scale down the hero title font size and image container height for mobile devices.
- **Theme Variables**: Utilizes standard CSS Custom Properties for typography, colors, and spacing (e.g., `var(--primary)`, `var(--h2-font-size)`, `var(--spacer-5)`).
- **Mappable Field Ergonomics**: Contains CSS rules to ensure `[data-layout-mode='edit']` correctly displays the mapped metadata fields in a dashboard-like layout while hiding them in live view.
