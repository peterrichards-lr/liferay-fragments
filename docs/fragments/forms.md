# Form Utilities

A collection of utility fragments designed to enhance Liferay Forms with
advanced features like pre-population, session tracking, and intelligent
redirection.

## Form Populator

Allows for the pre-population of Liferay Form fields using values passed in the
URL query string.

- **Mapping Configuration**: Uses a JSON-based mapping to link URL parameters to
  specific form fields.
- **Supported Fields**: Currently supports text, numeric, and "select from list"
  fields.
- **Retry Mechanism**: Includes a configurable retry logic to ensure the
  dynamically generated form is fully rendered before population.
- **Drop Zone**: The form itself is placed within the fragment's drop zone.

![Form Populator](../images/form-populator.png)

### Mapping Configuration

The following example shows the format of the JSON needed. The `parameter`
attribute specifies the key used in the query string that should be used to
populate the field value. The `fieldReference` is the name of the field in the
DOM (ensure you examine the DOM once the form is rendered as this value can be
different to the one configured). The `fieldType` determines which selector and
setter functions are used. Finally, the `fieldConfig` is an object which can
contain additional parameters, such as the `listPosition` for `selectFromList`
fields.

```json
[
  {
    "parameter": "petType",
    "fieldReference": "SelectFromList95537787",
    "fieldType": "selectFromList",
    "fieldConfig": {
      "listPosition": 2
    }
  },
  {
    "parameter": "appId",
    "fieldReference": "Numeric71522887",
    "fieldType": "numeric"
  },
  {
    "parameter": "petName",
    "fieldReference": "Text53774731",
    "fieldType": "text"
  },
  {
    "parameter": "appType",
    "fieldReference": "SelectFromList47997993",
    "fieldType": "selectFromList",
    "fieldConfig": {
      "listPosition": 1
    }
  }
]
```

## Refresh & Redirect

- **Refresh Page**: Triggers an automatic or manual page refresh. This is
  particularly useful in workflow scenarios where a page needs to update after a
  form submission to reflect new user segments or permissions.
- **Redirect Page**: Provides a configurable redirection mechanism. It can
  automatically redirect users after a specific interval or provide a manual
  link. It's often used as a "Thank You" or "Next Steps" page after form
  submission.

![Refresh Page](../images/page-refresh.png)

## Form Session Management

These fragments work together to track a user's progress across multiple forms
or pages using a unique session ID.

- **Generate Form Session ID**: Generates a unique UUID and stores it in a
  browser cookie. It can also automatically populate a hidden field in the
  current form with this ID.
- **Form Session ID (Lookup)**: Retrieves the session ID from the cookie and use
  it to perform a data lookup (e.g., finding an existing "Applicant" record) and
  populate form relationship fields accordingly.

## UI Components

- **Masthead Call to Action Form Header**: A stylized masthead section designed
  to house a form or call-to-action within a hero-style banner. It features a
  semi-transparent background for better text legibility over images.
