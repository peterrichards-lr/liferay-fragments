# Autocomplete (Object)

The **Autocomplete (Object)** fragment provides a searchable dropdown input that fetches results from a Liferay Object API.

## Key Features

- **Dynamic Fetching**: Queries Liferay Objects in real-time as the user types.
- **Debounced Search**: Optimized performance to prevent excessive API calls.
- **Site-Scoped Support**: Automatically detects and handles Site-scoped Object data.
- **Accessible UI**: Includes ARIA attributes for screen reader compatibility.

## Configuration

- **Object ERC**: The External Reference Code of the target Object.
- **Label Field**: The field name to display in results (e.g., `name`, `title`).
- **Value Field**: The field name to store as the input value (usually `id`).
