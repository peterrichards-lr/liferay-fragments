# Intranet Feed

## Overview

The **Intranet Feed** is a social interaction component designed for a modern intranet experience. It provides users with a central area to view recent posts, create new posts, and interact with existing ones (e.g., likes, comments, sharing).

## Configuration Options

The fragment can be configured via standard Liferay fragment configuration properties:

| Name         | Type  | Default | Description                                         |
| ------------ | ----- | ------- | --------------------------------------------------- |
| `viewAllURL` | `url` | `#`     | The destination URL for the complete activity feed. |

## Usage/Behavior

- **Creating Posts**: The fragment provides a composer area with an avatar, a placeholder for starting a post, and actions for attaching pictures and files.
- **Feed Display**: A placeholder feed is provided out-of-the-box. Posts include author details, timestamps, main content, and interactive buttons (like, comment, share).
- **Mappable Fields**: The fragment exposes `feed-title`, `feed-placeholder`, and `feed-object-path`. The `feed-object-path` is safely enclosed in `.meta-editor-mappable-fields` and is only visible in edit mode, complying with the ergonomic rules for non-title mappable fields.
- **View All**: A conditional link to the full feed is shown if `viewAllURL` is configured.

## Dependencies

### Javascript

- Contains a placeholder function `initIntranetFeed()` which prepares a `feedContainer` constant by querying `.intranet-feed-items`. Currently configured for future AJAX logic integration.
- Does not use top-level `return` statements and correctly encapsulates logic in `initIntranetFeed()`.

### CSS

- Uses modern CSS Custom Properties corresponding to standard Liferay/Meridian themes (e.g., `var(--primary)`, `var(--gray-200)`, `var(--white)`).
- Specific `.meta-editor-mappable-fields` styling is applied for editing layout mode (`[data-layout-mode='edit']`) to hide configuration data from end-users.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
