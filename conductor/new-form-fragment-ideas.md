# Liferay Form Fragment Expansion Plan

This plan details the implementation strategy for a suite of new Form Fragments
designed to expand the capabilities of Liferay Form Containers. Each fragment
targets specific UX improvements and data types.

## Task List

- [ ] **Phase 1: Visual & Interactive Selection**
  - [ ] Implement `Image Choice` fragment.
  - [ ] Implement `Visual Color Swatches` fragment.
- [ ] **Phase 2: Specialized Data Capture**
  - [ ] Implement `Signature Pad` fragment.
  - [ ] Implement `Currency Masked Input` fragment.
- [ ] **Phase 3: Enhanced UX & Security**
  - [ ] Implement `OTP / Verification Code` fragment.
  - [ ] Implement `Password Strength & Validation` fragment.
- [ ] **Phase 4: Advanced Integration**
  - [ ] Implement `Address Autocomplete` fragment.
  - [ ] Implement `File Drop Zone` fragment.

---

## Detailed Implementation Strategies

### Phase 1: Visual & Interactive Selection

#### 1. Image Choice

- **Description**: A visual alternative to standard radio buttons or checkboxes.
  Users select from a grid of images.
- **Field Mapping**: `text` (Single Choice) or `multiselect` (Multiple Choice).
- **Implementation**:
  - **Configuration**: Include a `text` field (to hold a JSON array) or a
    repeating fieldset (if supported in future versions) defining `imageUrl`,
    `label`, and `value`. Alternatively, use Liferay's itemSelector to pick from
    the Document Library.
  - **HTML (`.ftl`)**: Iterate through the configured options. Render them as
    `<label>` elements wrapping a hidden `<input type="radio|checkbox">` and an
    `<img>` tag.
  - **CSS**: Style the `<label>` to look like a card. Use `:checked + img` to
    apply a prominent border or overlay to indicate selection.
  - **JS**: Optional. If complex dynamic loading is needed, parse the
    configuration JSON and render the DOM dynamically. Otherwise, rely on native
    radio/checkbox behavior.

#### 2. Visual Color Swatches

- **Description**: A predefined palette of brand-approved colors, replacing a
  free-form color picker.
- **Field Mapping**: `text`.
- **Implementation**:
  - **Configuration**: A `text` field containing a comma-separated list of hex
    codes (e.g., `#FF0000,#00FF00,#0000FF`).
  - **HTML (`.ftl`)**: A hidden `<input type="text" name="${input.name}">`.
    Render a container for the swatches.
  - **CSS**: Style individual swatch `div` or `button` elements as circles or
    squares. Add an `.active` class for the selected state (e.g., a checkmark
    overlay or thicker border).
  - **JS**: Read the comma-separated list. Generate the swatch DOM elements.
    Attach click listeners to update the hidden input's value and update the
    `.active` class. On init, if `input.value` exists, highlight the
    corresponding swatch.

---

### Phase 2: Specialized Data Capture

#### 3. Signature Pad

- **Description**: Captures handwritten signatures using HTML5 Canvas.
- **Field Mapping**: `long-text` (stores the Base64 data URI).
- **Implementation**:
  - **HTML (`.ftl`)**: A hidden `<input type="hidden" name="${input.name}">`. A
    `<canvas>` element. A "Clear" `<button type="button">`.
  - **CSS**: Style the canvas with a border and background to clearly delineate
    the drawing area.
  - **JS**: Implement mouse/touch event listeners (mousedown, mousemove,
    mouseup, touchstart, touchmove, touchend) to draw paths on the canvas
    context (`ctx.lineTo`, `ctx.stroke`). On `mouseup`/`touchend`, extract the
    image data using `canvas.toDataURL()` and set it as the value of the hidden
    input. Trigger a `change` event for Liferay form validation. If
    `input.value` exists on load, draw the Base64 image back onto the canvas.

#### 4. Currency Masked Input

- **Description**: A numeric input that formats values as currency (e.g.,
  `$1,234.56`) while typing, but submits raw numbers.
- **Field Mapping**: `decimal` or `integer`.
- **Implementation**:
  - **Configuration**: `currencySymbol` (e.g., $, €, £), `thousandsSeparator`
    (e.g., `,` or `.`), `decimalSeparator` (e.g., `.` or `,`).
  - **HTML (`.ftl`)**: A visible `<input type="text">` for user interaction. A
    hidden `<input type="hidden" name="${input.name}">` for actual submission.
  - **JS**: Add an `input` event listener to the visible input. Strip all
    non-numeric characters (except the intended decimal separator). Format the
    string adding the currency symbol and separators. Update the visible input
    with the formatted string. Update the hidden input with the raw float/int
    value and trigger the `change` event.

---

### Phase 3: Enhanced UX & Security

#### 5. OTP / Verification Code

- **Description**: Segmented input boxes optimized specifically for pasting and
  auto-advancing security codes.
- **Field Mapping**: `text` or `integer`.
- **Implementation**:
  - **Configuration**: `numberOfDigits` (usually 4 or 6).
  - **HTML (`.ftl`)**: A hidden `<input type="hidden" name="${input.name}">`. A
    container with `numberOfDigits` visible `<input type="text" maxlength="1">`
    elements.
  - **JS**:
    - **Input**: On typing a number, auto-focus the next box.
    - **Backspace**: If empty, focus the previous box and clear it.
    - **Paste**: Intercept paste events. Split the pasted string across the
      individual boxes.
    - **Update**: After any change, concatenate all boxes and update the hidden
      input.

#### 6. Password Strength & Validation

- **Description**: A password input with visual feedback on strength and a
  checklist of requirements.
- **Field Mapping**: `text`. (Note: Liferay forms typically don't map directly
  to a "password" object field type, but this is useful for custom user
  registration forms).
- **Implementation**:
  - **HTML (`.ftl`)**: An `<input type="password" name="${input.name}">`. A
    strength meter `<div class="progress-bar">`. A `<ul>` listing requirements
    (e.g., 8+ chars, 1 uppercase).
  - **CSS**: Style the progress bar to change color (red -> yellow -> green) and
    width based on a data attribute.
  - **JS**: On `input`, evaluate the string against regex patterns (e.g.,
    `/[A-Z]/`, `/[0-9]/`, `/.{8,}/`). Update the list items (e.g., change an
    icon from `times` to `check`). Calculate an overall score and update the
    progress bar's width and color.

---

### Phase 4: Advanced Integration

#### 7. Address Autocomplete

- **Description**: Uses an external API (like Google Places) to suggest
  addresses as the user types.
- **Field Mapping**: `text` (stores the formatted address).
- **Implementation**:
  - **Configuration**: `apiProvider` (Google/OSM), `apiKey`.
  - **HTML (`.ftl`)**: An
    `<input type="text" name="${input.name}" autocomplete="off">`. A dropdown
    `<ul>` container for suggestions.
  - **JS**: Implement debounce logic on the `input` event. Fetch suggestions
    from the chosen API endpoint. Render the results in the dropdown. On click,
    update the input value and trigger the `change` event.

#### 8. File Drop Zone

- **Description**: A modern, styled drag-and-drop area for file uploads,
  replacing the standard file input.
- **Field Mapping**: `file`.
- **Implementation**:
  - **HTML (`.ftl`)**: An
    `<input type="file" name="${input.name}" class="d-none">` (hidden). A
    visible `<div class="drop-zone">` containing an icon and text ("Drag & Drop
    or Click to Upload").
  - **CSS**: Style the drop zone heavily. Add an `.is-dragover` class (e.g.,
    dashed border, background color change) when a file hovers over it.
  - **JS**: Add event listeners to the drop zone: `dragover`, `dragleave`,
    `drop`.
    - On `drop`: Prevent default behavior. Access `e.dataTransfer.files`.
      Validate against `input.attributes.allowedFileExtensions` and
      `maxFileSize`.
    - Assign the files to the hidden input using a `DataTransfer` object:
      ```javascript
      const dt = new DataTransfer();
      dt.items.add(droppedFile);
      fileInput.files = dt.files;
      ```
    - Update the UI to show the selected file name or an image thumbnail.
