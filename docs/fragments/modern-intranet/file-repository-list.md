# File Repository List

## Overview

The File Repository List fragment provides a table-based layout simulating a document library or asset repository. It displays a list of files with columns for title, status, last updated time, size, and an actions menu, along with a "View All" link.

## Configuration Options

The fragment provides the following configuration options within `configuration.json`:

- **View All URL** (`viewAllURL`): The destination URL for the "View All" link located in the header. If left blank, the link is not rendered.

## Mappable Fields (Content Mapping)

The fragment contains several mappable inline editable fields (`data-lfr-editable-id` and `data-lfr-editable-type`):

- `repo-title`: Maps the main title of the section (Type: `text`). Default: "Strategic Assets & Deliverables".
- `file-name-1`, `file-name-2`: Maps the display names of the files in the rows.
- **Object Folder ERC** (`repo-folder-erc`): A hidden mappable field housed within `.meta-editor-mappable-fields`. This allows an author to map a specific External Reference Code (ERC) associated with a folder in the Document Library or an Object definition. Default: `EXTERNAL_ASSETS`.

## Usage & Behavior

- **Table Layout**: Uses a standard Bootstrap `table` layout to organize document metadata.
- **Checkboxes**: Includes custom checkboxes (`custom-control custom-checkbox`) for row selection, enabling batch actions if wired up manually.
- **Icons and Badges**: Integrates Clay Lexicon icons (`documents-and-media`, `document-text`, `ellipsis-v`) and Bootstrap pill badges (`badge-warning`, `badge-success`) for visual status indications.
- **Mock Content**: By default, the fragment renders with two static rows displaying dummy data (e.g., "Q3_Product_Roadmap_Final.pdf" and "Pricing_Model_v2.xlsx").

## Dependencies

- **FreeMarker**: Renders the HTML structure and conditionally displays the "View All" link based on configuration.
- **CSS**: Relies heavily on Bootstrap classes (`table`, `d-flex`, `badge`, `custom-control`) and Liferay Clay icons `[@clay["icon"] ...]`. Assumes custom CSS exists in `index.css` for classes like `.file-repo-header` or `.file-repo-table`.
- **JavaScript**: Currently contains no dynamic JavaScript functionality. Interactive elements (like check-all or action menus) are static placeholders meant for styling purposes or external integrations.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
