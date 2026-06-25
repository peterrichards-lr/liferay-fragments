# Master Page Header

The Master Page Header is a composite layout container designed to form a complete, production-ready header zone within Liferay Master Pages. It integrates multiple sub-components into a single unified header structure.

## Overview

This fragment serves as the parent container and coordinates the layout of:

- **Upper Header Bar Layout** (the primary structure)
- **Lower Header Bar** (secondary bar)
- **Search Button / Search Bar**
- **Login and User Menu**
- **User Personal Bar**

## Dependencies

The Master Page Header relies on the following constituent fragments to be deployed and placed within its drop zones:

- [Logo](./logo.md)
- [Site Name](./site-name.md)
- [Search Button](./search-button.md)
- [Search Bar](./search-bar.md)
- [Login and User Menu](./login-and-user-menu.md)
- [User Personal Bar](./user-bar.md)
- [Lower Header Layout](./lower-header-layout.md)

## Configuration

The component has several configuration parameters inherited from the Upper Header Bar Layout:

- **Enable Vertical Bar**: Renders a vertical separator between the user menu and the personal bar.

![Master Page Header Configuration](../../docs/images/upper-header-layout-config.png)
