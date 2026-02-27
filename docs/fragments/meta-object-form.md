# Meta-Object Form

A truly dynamic form that auto-generates inputs based on a Liferay Object's definition.

## Features
- **Self-Discovering**: Fetches field metadata (type, required, label) at runtime via Object Admin API.
- **Automatic Input Selection**: Maps Object types (String, Integer, Date, Boolean) to appropriate HTML5 inputs.
- **Validation**: Enforces "Required" constraints based on the Object definition.
- **Production-Ready**: Supports submitting new entries directly to the Custom Object API.

## Configuration
- **Object ERC**: The source Object to generate the form from.
- **Submit Button Color**: Custom theme color for the action button.
