# AI Commerce Accelerator

## Overview

The **AI Commerce Accelerator** fragment provides a Liferay-hosted frontend for the AI Commerce Accelerator microservice. It allows users to generate comprehensive commerce data using AI and Liferay Headless APIs.

## Configuration Options

The fragment can be configured via standard Liferay fragment configuration properties:

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

- **Custom Web Component**: The fragment renders a custom `<liferay-ai-commerce-accelerator-frontend>` HTML element, passing down `themeDisplay` context attributes (e.g., `liferay-url`, `locale-code`, `spritemap`) as well as configuration properties.
- **Context Injection**: Uses FreeMarker logic to inject `themeDisplay.portalURL`, `languageId`, and Lexicon icon `spritemap` locations dynamically based on the current Liferay environment.

## Dependencies

### Javascript

- Imports `liferay-ai-commerce-accelerator-frontend` via an ES module import in `fragment.js`. This implies a Client Extension context where the frontend is registered globally.

### CSS

- Includes an empty or implicit `fragment.css` (no specific internal CSS declared). All styling logic resides in the custom React web component injected by the JS module.
