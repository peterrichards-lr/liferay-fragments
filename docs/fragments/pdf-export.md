# PDF Export

The **PDF Export** fragment enables users to generate and download a high-fidelity PDF document from fragment content or Object record views.

## Key Features

- **jsPDF Integration**: Uses industry-standard libraries for client-side PDF generation.
- **Visual Capture**: Leverages `html2canvas` to accurately represent styles and layouts in the export.
- **Configurable Header/Footer**: Add branding or timestamps to generated documents.

## Configuration

- **Target Container ID**: The CSS selector of the area to be exported.
- **Filename Template**: Customizable pattern for the output file (e.g., `Report_{date}.pdf`).
- **Paper Size**: Choose from standard formats like A4, Letter, etc.
