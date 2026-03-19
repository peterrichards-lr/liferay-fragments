# Search Overlay

A high-fidelity, full-screen search interface that expands from a minimalist search icon. It provides a focused environment for searching site content, products, or pages.

## Configuration

| Field                   | Description                                               | Default               |
| :---------------------- | :-------------------------------------------------------- | :-------------------- |
| **Placeholder**         | Text shown inside the search input before the user types. | Search for content... |
| **Search Button Label** | Text for the primary search button.                       | Search                |
| **Overlay Bg Color**    | Background color for the full-screen overlay.             | `var(--white)`        |
| **Accent Color**        | Color for the search button and input focus.              | `var(--primary)`      |

## Usage

1.  **Placement**: Typically placed in a Header master page or at the top of a template.
2.  **Activation**: When the user clicks the search icon, the overlay transitions into view, blurring the background.
3.  **Interaction**: The user enters their query and hits Enter or clicks the search button to be redirected to the site's search results page.

## Visuals

![Search Overlay](../../docs/images/search-overlay.png)
_(Note: Upload screenshot to docs/images/search-overlay.png)_
