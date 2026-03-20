# Layout Components

This collection demonstrates a "Contextual Styling" pattern where child
fragments adapt their appearance based on their parent container. This allows
for highly reusable components that remain consistent with their surrounding
layout.

![Layout Components Overview](../../docs/images/layout-components.png)

## The Hierarchy

To achieve the best results, fragments should be nested in the following order:

1.  **Grid Column**: The outermost container. It ensures proper horizontal
    spacing and alignment when multiple cards are used in a Liferay Grid row.
2.  **Primary or Secondary Card**: The styled container. These define the
    "flavor" (borders, shadows, background) of the card.
3.  **Card Content**: The internal payload. This fragment is dropped into the
    Card's dropzone and **automatically changes its typography and link
    styling** to match the parent card type.

## Components Summary

- **Grid Column**: Handles spacing and grid alignment.
- **Primary Card**: A high-impact container for featured content.
- **Secondary Card**: A subtle container for supplementary content.
- **Card Content**: Adaptable internal content (Title, Description, Link).

## Detailed Documentation

- [Grid Column](./grid-column.md)
- [Primary Card](./primary-card.md)
- [Secondary Card](./secondary-card.md)
- [Card Content](./card-content.md)
