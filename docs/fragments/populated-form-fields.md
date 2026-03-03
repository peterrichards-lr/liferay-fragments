# Populated Form Fields

A collection of fragments designed to enhance Liferay Form fields with intelligent data persistence, dynamic lookups, and calculated values.

## Data Persistence

These fragments allow form data to persist across page reloads or even between different forms in a user's session.

- **Store Form Field Values**: A powerful utility that monitors specified form fields and automatically saves their values to browser session storage as the user types. This ensures no data is lost if the page is refreshed.
- **Store Default Value**: Allows for the explicit storage of a default value for a specific field, which can then be retrieved and applied by other fragments.

## Dynamic & Populated Inputs

- **Populate Select**: An advanced dropdown component that can fetch its options dynamically from a relationship URL (e.g., a Liferay Object API). It also supports pre-populating its selection from session storage, providing a seamless user experience.
- **Populated Range**: A range slider fragment that can be pre-initialized with values retrieved from session storage or other data sources.
- **Text Derived Value**: Automatically calculates and populates a text field's value based on logic or other input fields, useful for generating reference numbers or formatted strings dynamically.

## Key Features

- **Session Storage Integration**: Deeply integrated with `Liferay.Util.SessionStorage` for secure and efficient client-side data management.
- **Case Conversion Utilities**: Includes built-in support for converting between camelCase, kebab-case, and snake_case to ensure compatibility with various API and storage naming conventions.
- **Editor Mode Support**: Components are designed to be non-interactive or provide visual placeholders in the Liferay Page Editor to ensure a smooth authoring experience.
- **Meridian Theme Ready**: All components utilize Meridian CSS tokens for consistent typography and spacing.
