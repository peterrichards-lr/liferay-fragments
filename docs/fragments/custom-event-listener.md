# Custom Event Listener

An interaction tracking fragment that listens for DOM events (like clicks) on
specified elements and records them as interactions in a Liferay Object.

## Features

- **Selector Based**: Target specific elements on the page using standard CSS
  selectors.
- **Analytics Integration**: Automatically forwards events to `window.Analytics`
  if available.
- **Campaign Awareness**: Associates interactions with a campaign ID stored in
  the `__coId` cookie.
- **Site-Scoped Discovery**: Automatically resolves the correct API path for the
  `campaigninteractions` Object.

## Configuration

- **Selectors**: CSS selectors for elements to watch.
- **Event Type**: The type of event to listen for (defaults to `click`).
- **Default Action**: The name of the action to record if no
  `custom-event-action` attribute is present on the target.

## Technical Infrastructure

This fragment utilizes the **Shared Resources Architecture**:

- **`discovery.js`**: Uses `resolveObjectPath` to dynamically discover the REST
  endpoint.
- **`validation.js`**: Uses `isValidIdentifier` for robust Campaign ID checking.
- **`storage.js`**: (Note: Declared in build but used internal cookie helper in
  current version).
