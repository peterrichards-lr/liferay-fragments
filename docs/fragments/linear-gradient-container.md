# Linear Gradient Container

A versatile structural fragment that applies a CSS linear gradient to its background. It is designed to host other fragments (like Header components) while providing a high-fidelity visual backdrop.

## Key Features

- **Flexible Colors**: Supports standard CSS Color names, HEX codes, and CSS variable notation (e.g., `var(--primary)`).
- **Stylebook Integration**: Directly reference Stylebook variables using the `var()` syntax.
- **Adjustable Angle**: Configure the gradient direction in degrees.

## Visuals

![Linear Gradient](../../docs/images/linear-gradient-container.png)

## Usage

1.  **Drop**: Add the fragment to a page or Header master page.
2.  **Configure Colors**: In the configuration panel, enter your desired Start and End colors. You can use values like `#ffffff` or theme-aware tokens like `var(--secondary)`.
3.  **Nest Content**: Drop other fragments into the provided drop-zone.

---

### Legacy Version (Deprecated)

The original version of this fragment, which used a predefined list of Dialect theme variables, is now **deprecated**. Users are encouraged to migrate to this enhanced version for greater flexibility.
