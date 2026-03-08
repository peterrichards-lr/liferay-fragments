# Custom Event Listener

The **Custom Event Listener** fragment allows Page Editors to bridge the gap between different components by listening for and reacting to standard or custom JavaScript events.

## Key Features

- **Event Bus Integration**: Listens for global events or those emitted by specific fragment groups.
- **Action Triggering**: Can execute predefined functions or update other fragments via the `Liferay.Util` event bus.
- **Flexible Scope**: Monitor events at the document, window, or specific element level.

## Configuration

- **Event Name**: The specific JS event to monitor (e.g., `formSubmitted`, `modalClosed`).
- **Callback Script**: JavaScript logic to execute when the event is detected.
