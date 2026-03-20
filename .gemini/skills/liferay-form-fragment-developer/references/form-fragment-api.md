# Liferay Form Fragment API Reference

Form fragments are a specialized type of fragment in Liferay (7.4 U45+ / GA45+)
that interact with **Form Containers** and **Object Fields**.

## The `input` Object

Both FreeMarker (`.ftl`) and JavaScript (`.js`) have access to the global
`input` object. This object contains metadata about the mapped field.

### Core Properties

| Property       | Type    | Description                                                       |
| :------------- | :------ | :---------------------------------------------------------------- |
| `name`         | String  | **Required**. The name attribute for the HTML input element.      |
| `value`        | String  | The current value of the field.                                   |
| `label`        | String  | The localized label for the field.                                |
| `required`     | Boolean | Whether the field is marked as required in the Object definition. |
| `errorMessage` | String  | The error message to display when validation fails.               |
| `helpText`     | String  | The localized help text for the field.                            |
| `fieldTypes`   | Array   | The field types supported by this fragment.                       |
| `showLabel`    | Boolean | Whether to display the label.                                     |
| `showHelpText` | Boolean | Whether to display the help text.                                 |

### Type-Specific Attributes

Accessed via `input.attributes`.

#### File

- `allowedFileExtensions`: List of permitted file types.
- `maxFileSize`: Maximum allowed file size in bytes.
- `selectFromDocumentLibraryURL`: URL for the document library picker.

#### Number

- `min`: Minimum value.
- `max`: Maximum value.
- `step`: Incremental step.
- `dataType`: `integer` or `decimal`.

#### Relationship

- `relationshipURL`: URL to fetch available options for the relationship.
- `relationshipLabelFieldName`: The field name to use as the label in the
  selection UI.
- `relationshipValueFieldName`: The field name to use as the value in the
  selection UI.

#### Select

- `options`: An array of objects with `label` and `value` properties.

## Requirements & Constraints

1.  **Form Container**: Form fragments **must** be placed inside a **Form
    Container** on a content page to be correctly mapped to Object fields.
2.  **CAPTCHA**: If a fragment supports CAPTCHA, it cannot support any other
    field types.
3.  **Buttons**: To enable link settings for redirection in a button fragment,
    the HTML element must explicitly have `type="button"`.
4.  **Relationship API**: The `relationshipURL` returns Liferay's **Headless
    list format** (including `items`, `page`, `pageSize`, and `totalCount`).
5.  **Initialization**: Use `fragmentElement.querySelector` to find the input
    element within the fragment to avoid collisions.
