# Course Progress Card

## Overview

The Course Progress Card fragment displays a summary of a course or training module. It features a course thumbnail image, title, description, a visual progress bar indicating completion percentage, and a primary call-to-action button to resume or start the course.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Button Label** (`buttonLabel`): The text displayed on the primary action button. Default is "Continue".
- **Button URL** (`buttonURL`): The URL destination when the primary action button is clicked.

## Mappable Fields (Content Mapping)

The fragment utilizes Liferay's inline editing and mapping capabilities (`data-lfr-editable-id` and `data-lfr-editable-type`):

- `course-image`: Maps the thumbnail image (Type: `image`).
- `course-title`: Maps the heading text (Type: `text`). Default: "Q3 Product Strategy".
- `course-description`: Maps the descriptive text (Type: `text`).
- `course-progress-text`: Maps the textual display of the progress percentage (Type: `text`). Default: "30%".
- **Progress Percentage Value** (`course-progress-value`): A hidden, mappable field inside `.meta-editor-mappable-fields` that provides the numeric value (0-100) to dynamically size the progress bar.

## Usage & Behavior

- **Progress Visualization**: A JavaScript initialized script reads the `course-progress-value` text, parses it as an integer, and sets the `width` of the Bootstrap `.progress-bar` inline style. It also updates the `aria-valuenow` attribute for accessibility.
- **Responsive Layout**: Uses Bootstrap grid classes (`row`, `col-md-2`, `col-sm-3`, `col-md-6`, `col-md-4`) to stack elements correctly on smaller screens.
- **Edit Mode Reactivity**: In the Liferay page editor (`layoutMode === 'edit'`), a `MutationObserver` watches the hidden `course-progress-value` for changes. If a user edits or maps a new value, the visual progress bar updates immediately.

## Dependencies

- **JavaScript**: A single initialization function handles the logic for the progress bar rendering and sets up a `MutationObserver` for real-time authoring feedback.
- **FreeMarker**: Basic layout generation pulling in the URL and label configurations.
- **CSS**: Depends heavily on Bootstrap grid/utility classes (`d-flex`, `justify-content-between`, `progress`, `progress-bar`, `btn-primary`, `border-left`). Specific component styles are assumed to be in `index.css` (e.g., `.course-card-image-container`, `.course-card-title`).
