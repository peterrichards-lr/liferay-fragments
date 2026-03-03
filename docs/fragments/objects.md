# Object Fragments

A collection of fragments specifically designed for interacting with Liferay Objects, providing user interface elements for data-driven applications.

## Audit Button

A customizable button component designed to trigger actions or record audit events related to an object.

- **Configurable Action**: Supports an editable text field for action configuration.
- **Visual Styles**: Inherits standard Liferay button types (Primary, Secondary, etc.) and sizes.
- **Dynamic Linking**: Can be configured as a link to trigger external processes or navigate to related object views.

## Comment Components

Designed to provide a consistent and polished commenting interface for Object records.

### Single Comment Item

A layout fragment for displaying an individual comment. It includes:
- **User Avatar**: An editable image field for the commenter's profile picture.
- **Metadata**: Display fields for the commenter's name, timestamp, and visibility status (e.g., Public/Private).
- **Rich Text Content**: A dedicated area for the comment body, supporting formatted text.

### Public Comments List

A dynamic fragment that fetches and renders a list of public comments associated with a specific record (e.g., a Support Ticket).

- **Flexible ID Source**: Can retrieve the parent record ID from the URL path, a query string parameter, or a static "Dummy ID" for testing.
- **Dynamic Rendering**: Uses a client-side template to render comments fetched from a Liferay Object API.
- **Localized Formatting**: Includes built-in date and time formatting that respects the user's current locale.
- **Automated Filtering**: Automatically filters for "Public" visibility to ensure only appropriate content is displayed to end-users.
