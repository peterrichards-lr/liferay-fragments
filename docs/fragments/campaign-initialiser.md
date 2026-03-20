# Campaign Initialiser

The **Campaign Initialiser** fragment is a background utility that sets the
context for Liferay Analytics Cloud campaign tracking on a specific page.

## Key Features

- **Context Injection**: Automatically adds campaign metadata to all tracked
  events on the page.
- **Dynamic Source Tracking**: Captures UTM parameters from the URL and persists
  them.
- **Silent Operation**: Does not render any visible UI elements.

## Configuration

- **Campaign ID**: The unique identifier for the Analytics Cloud campaign.
- **Storage Strategy**: Choose how long to persist campaign context (Session vs.
  Persistent).
