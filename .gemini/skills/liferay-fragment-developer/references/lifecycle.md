# Liferay Fragment Lifecycle & Environment

## Global Objects
Liferay injects several global variables into the fragment's context:
- `fragmentElement`: The root DOM element of the fragment instance. Use for all internal selectors.
- `configuration`: An object containing user-set values from `configuration.json`.
- `fragmentEntryLinkNamespace`: A unique identifier for the fragment instance on the page. Use for scoping IDs and classes.
- `layoutMode`: Indicates if the page is in `view`, `edit`, or `preview` mode.
- `input`: (In Form Fragments) Provides metadata about the bound form field.

## Initialization
JavaScript logic should typically wait for environment readiness:
```javascript
Liferay.on('allPortletsReady', () => {
    // Initialization logic here
});
```

## FreeMarker
HTML files are processed as FreeMarker templates using square bracket syntax `[# ... ]`.
- **Null Safety**: Always provide default values: `${configuration.title!'Default'}`.
- **CSS Variable Bridge**: Map configuration values to CSS variables in the HTML root element's `style` attribute.
- **Static Asset Syntax**: Use `[resources:filename.ext]` for assets in the `resources/` directory.
