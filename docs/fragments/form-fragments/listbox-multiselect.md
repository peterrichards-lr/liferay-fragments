# Listbox Multiselect

The **Listbox Multiselect** fragment is a custom form input component designed for selecting multiple options from a list. It renders selected options as interactive, removable tags/chips and provides a searchable select drop-down list of choices.

## Overview

- **Dynamic Data Binding**: When placed inside a Liferay Form Container, the fragment automatically detects and displays options dynamically retrieved from a mapped Liferay Object picklist (List Type Definition).
- **Accessible Tag-Based UI**: Selected options are represented as visual chips/tags that users can click or press `Backspace`/`Delete` to remove.
- **Searchable Listbox**: Includes a built-in search filter to quickly find choices in large option sets.
- **Form Submission Sync**: Synchronizes selections with a hidden select input to ensure native compatibility with standard Liferay Form data submit payloads.

## Configuration

The fragment can be customized using the following options:

- **Number of Options** (`numberOfOptions`): The maximum number of visible list items to display at once in the option dropdown. Defaults to `8`.
- **Button Type / Style** (`buttonType`): The Clay design system class applied to the toggle button (options: `primary`, `secondary`, `outline-primary`, `outline-secondary`). Defaults to `primary`.
- **Order Options Alphabetically** (`orderOptionsAlphabetically`): If enabled, options retrieved from the picklist are sorted alphabetically by label. Defaults to `false`.
- **Show Select/Deselect All Buttons** (`showAllButtons`): If enabled, displays "Select All" and "Deselect All" utility buttons above the option list. Defaults to `false`.

## Liferay Object & Picklist Mapping

To use the **Listbox Multiselect** fragment on a page:

1. Create a custom **List Type Definition** (Picklist) under Liferay Control Panel > Picklists containing the options you wish to display (e.g. `INTERESTS_PICKLIST`).
2. Add a field of type **Multiselect Picklist** (`MultiselectPicklist`) to your Liferay Custom Object Definition (e.g. field `interests` on the `Applicant` Object) and bind it to the Picklist you created.
3. Place a **Form Container** fragment on your page and target your custom Object.
4. Drag the **Listbox Multiselect** input fragment inside the Form Container.
5. In the fragment mapping sidebar, map the fragment to the **Multiselect Picklist** field you created. The options will populate dynamically.
