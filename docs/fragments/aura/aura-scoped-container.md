# Aura - Scoped Container

## Overview

The `aura-scoped-container` fragment acts as an isolated wrapper designed to enclose other fragments inside a custom styled block. It is primarily used to inject the `aura.css` resources and apply an `aura-scope` wrapper around nested components.

## Configuration

There are no configuration options in `configuration.json` for this fragment.

## Usage & Behavior

The fragment uses a Liferay `<lfr-drop-zone>` tag with an ID of `aura-dropzone`. This allows content editors to drag and drop other fragments directly inside this container.

## Dependencies

- Dynamically loads `[resources:aura.css]` to ensure that any Aura-specific styles are applied within the scope.
- Uses the `.aura-scope` and `.aura-container` classes to encapsulate nested elements.

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-02_ | _Last Reviewed: 2026-07-02_

## <!-- markdownlint-disable MD049 -->

_Last Updated: 2026-07-09_ | _Last Reviewed: 2026-07-09_
