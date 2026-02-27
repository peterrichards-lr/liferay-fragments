# Meta-Object Record View

A single-entry detail view that dynamically discovers fields and provides a high-fidelity PDF export feature.

## Features
- Renders all fields for a specific Object entry.
- **PDF Export**: Integrated jsPDF and html2canvas support for downloading high-quality reports.
- **URL Aware**: Automatically picks up `entryId` or `id` from the query string.
- Clean, label-value pair layout optimized for reports.

## Configuration
- **Object ERC**: The source Object definition.
- **Fallback Record ID**: Used if no ID is found in the page URL.
- **Accent Color**: Custom theme color for labels and headers.
