# Signature Pad

## Overview

The Signature Pad fragment allows users to digitally sign a form using a mouse, stylus, or touch input. It captures the signature drawn on a canvas element and converts it into a Base64 encoded image string, which is then submitted along with the form data.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Stroke Color** (`strokeColor`): A color picker to define the color of the signature ink. Default is `#000000` (black).
- **Pen Width** (`penWidth`): The thickness of the drawing stroke. Default is `2`.
- **Pad Height** (`padHeight`): The CSS height of the signature canvas (e.g., `200px`).
- **Clear Button Text** (`clearButtonText`): The label for the button that erases the canvas. Default is "Clear Signature" (localizable).

## Usage & Behavior

- **Drawing**: Users can click and drag (or touch and drag) inside the canvas area to draw their signature.
- **Data Capture**: When drawing stops (`mouseup` or `touchend`), the canvas content is converted to a Data URL (`canvas.toDataURL()`) and stored in a hidden input field.
- **Clear Canvas**: Clicking the "Clear Signature" button wipes the canvas and clears the hidden input value.
- **Responsive**: The canvas automatically resizes to fit its container, and redrawing handles resolution adjustments (`window.addEventListener('resize', ...)`).
- **Hydration**: If the form is reloaded with a previously saved signature value, the Base64 image is drawn back onto the canvas on initialization.
- **Read-Only Mode**: If configured as readonly, drawing interactions and the clear button are disabled.
- **Edit Mode**: Drawing is disabled in the Liferay page editor to prevent unintended inputs while building the form.

## Dependencies

- **JavaScript**: Uses the HTML5 Canvas 2D context API to capture coordinates (`mousemove`, `touchmove`, etc.) and draw paths. Converts the canvas to a Data URL and handles resize debouncing using `Liferay.Fragment.Commons.debounce`.
- **FreeMarker**: Maps form inputs and applies inline CSS variables (`--pad-height`).
- **CSS**: Uses Bootstrap/Clay classes (`btn-outline-secondary`) and custom CSS (assumed in `index.css`) for the canvas borders and layout.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_
