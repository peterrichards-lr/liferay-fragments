# Dynamic Badge Overlay

The **Dynamic Badge Overlay** fragment automatically applies visual badges
(e.g., "New", "Offer", "Limited Stock") to product images within a Liferay
Commerce display.

## Key Features

- **Dynamic Logic**: Evaluation of product freshness, discount percentage, and
  stock levels.
- **Priority System**: Configurable priority when a product matches multiple
  badge criteria.
- **Visual Styles**: Supports corner ribbons, pill shapes, and rectangles.
- **Canvas Rendering**: Generates high-quality badge images on-the-fly using the
  browser's Canvas API.
- **Localization**: Supports standard Liferay language property overrides.

## Configuration

- **Object ERC**: The External Reference Code of the Liferay Object (default:
  `PRODUCT_SHOWCASE`).
- **Date Field**: The field used to determine "New Product" status.
- **Freshness**: Number of days a product is considered "New".
- **Stock Threshold**: The level at which "Limited Stock" is triggered.
