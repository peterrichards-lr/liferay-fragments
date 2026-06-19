# AI Commerce Accelerator Admin

## Overview

The **AI Commerce Accelerator Admin** fragment provides the administrative interface for configuring and managing the AI Commerce Accelerator tool.

## Configuration Options

The fragment is highly configurable via Liferay properties, matching the standard accelerator frontend:

**Connection**
| Name | Type | Default | Description |
|-------------------|--------|-------------------------|------------------------------------------------|
| `microserviceUrl` | `text` | `http://localhost:3001` | The URL of the backend microservice. |
| `pollingRetries` | `text` | `12` | Number of times to retry polling. |
| `pollingDelay` | `text` | `5000` | Delay (in ms) between polling retries. |

**Headings (Style)**
| Name | Type | Default | Description |
|------------|--------|-------------------------------------------------------------------------|-------------|
| `title` | `text` | `Liferay AI Commerce Accelerator` | Main title. |
| `subtitle` | `text` | `Generate comprehensive Commerce data using AI and Liferay Headless APIs` | Subtitle. |

**Headings (Advanced)**
| Name | Type | Default | Description |
|------------------|----------|---------|---------------------------------------------------------|
| `wsLoggingLevel` | `select` | `off` | Websocket logging level (`off`, `info`, `verbose`). |

## Usage/Behavior

- **Custom Web Component**: Renders the `<liferay-ai-commerce-accelerator-admin>` custom HTML element.
- **Context Handling**: Resolves critical environment variables (`liferayUrl`, `languageId`, `spritemap`) using FreeMarker variables bound to `themeDisplay` and passes them to the web component alongside all mapped configurations.

## Dependencies

### Javascript

- Expects a backend module `liferay-ai-commerce-accelerator-admin` (though `fragment.js` specifies standard behavior, it integrates as a client-extension).

### CSS

- Styling is fully deferred to the underlying React/web-component framework powering `<liferay-ai-commerce-accelerator-admin>`.
