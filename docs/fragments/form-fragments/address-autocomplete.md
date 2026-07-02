# Address Autocomplete

## Overview

The `address-autocomplete` fragment is an advanced form input field that provides dynamic address suggestions as the user types. By default, it supports OpenStreetMap (Nominatim) for geocoding but includes scaffolding for extending to Google Places.

## Configuration

The following options are available in `configuration.json`:

- **apiProvider** (select): The geocoding API to use (`osm` for OpenStreetMap, `google` for Google Places).
- **apiKey** (text): API key (needed for Google Places or premium services).
- **storageMode** (select): How the address should be stored upon selection (`formatted` string or full `json` object).
- **placeholder** (text): Placeholder text for the address input field.

## Usage & Behavior

- **Initialization**: Logic is encapsulated within `initAddressAutocomplete()` to prevent top-level script execution leaks.
- **Debounced Fetch**: Input keystrokes are debounced using `Liferay.Fragment.Commons.debounce` (400ms delay) before triggering API queries.
- **Search Conditions**: The query is only sent if the input length is >= 3 characters.
- **LayoutMode**: If `layoutMode === 'edit'`, the input field is disabled to prevent accidental interaction while configuring the page.
- **Storage**: When an address is selected from the dropdown, it updates the input element's value and dispatches a `change` event.

## Dependencies

- Uses standard Clay UI classes (`form-group`, `form-control`, etc.).
- Relies on `Liferay.Fragment.Commons.debounce` for managing input events.
- Fetches data from external endpoints (e.g., `https://nominatim.openstreetmap.org/search`).
