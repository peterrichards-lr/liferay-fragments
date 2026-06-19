# File Drop Zone

## Overview

The File Drop Zone fragment provides an interactive drag-and-drop area for users to upload files within forms. It enhances the standard `<input type="file">` by offering a more visual and user-friendly interface. It also optionally integrates with Liferay's Document Library for selecting existing files.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **Drop Zone Text** (`dropZoneText`): The text displayed inside the drop zone area. Default is "Drag & Drop or Click to Upload".
- **Drop Zone Icon** (`dropZoneIcon`): The name of the Clay icon to display. Default is "upload".
- **Show Document Library Picker** (`showDocumentLibraryPicker`): A boolean toggle to enable or disable the "Select from Document Library" button. Default is `true`.

## Usage & Behavior

- **Drag & Drop**: Users can drag and drop a file onto the dashed area to attach it.
- **Click to Upload**: Clicking the drop zone area opens the native file browser.
- **Document Library Picker**: If enabled (and a Document Library URL is available via `input.attributes.selectFromDocumentLibraryURL`), users can select an existing file from the Liferay Document Library.
- **Read-Only Mode**: If the form input is set to read-only, the drop zone disables interactions.
- **Edit Mode**: In the Liferay page editor (`layoutMode === 'edit'`), file input functionality is disabled to prevent accidental uploads while authoring.

## Dependencies

- **JavaScript**: Vanilla JavaScript handles the drag-and-drop events (`dragenter`, `dragover`, `dragleave`, `drop`), file selection updates, and triggers Liferay's selection modal (`Liferay.Util.openSelectionModal`).
- **CSS**: Uses Clay CSS classes and custom CSS (assumed in `index.css`) for the drop zone styling (`.drop-zone`, `.drag-over`, etc.).
- **FreeMarker**: Renders the HTML structure, maps form input attributes (e.g., `required`, `accept`), and integrates with Liferay's localization and Clay icons.
