# liferay-fragments
A selection of Liferay Fragments

## Date Display (Static)
This fragment displays a date or date range via its configuration; hence it can only be used for static dates.

The date format must be yyyy-MM-dd, e.g. 2021-11-01 for the 1st November 2021.

You can set either the start date, end date or both. When only one date is displayed then no separator is displayed. If both dates are specified then the start date will be first followed by the separator and then finally the end date.

The Clay calendar icon can be turned on or off via the configuration.

The JavaScript will not execute when the fragment is viewed in either the Fragment Editor or the Page Content Editor.

## Date Display (Collection Display)
This fragment displays a date or date range via two mappable fields; hence it can be used for collection displays.

The left-hand mappable field is for the start date and the right-hand mappable field is for the end date. If either value is empty then its corresponding HTML will not be displayed.

The mappable fields are hidden by default and only made visible when the fragment is viewed in the Page Content Editor.

The Clay calendar icon can be turned on or off via the configuration.

The JavaScript will not execute when the fragment is viewed in either the Fragment Editor or the Page Content Editor.

#### Dependency
In order to correctly render this fragment, it is necessary for each rendered instance within the collection display to have a unique identifier. This is not something that happens at the moment but there is a JIRA issue already in place with a potential fix already to be merged. However, no timeline is currently known for its availability.

In order to ensure each instance had a unique identifier it was necessary to use the com.liferay.portal.kernel.util.PortalUtil to generate a random key. This has meant the need to enable the staticUtil variable so the class can be referenced from the fragment.

To enable this navigate to Control Panel -> System Settings ->Template Engines (under Platform) -> FreeMarker Engine and remove staticUtil from the Restricted Variables list.

## Form Populator
This fragment can pre-populate a form fields using values passed in the URL query string. This is achieved by using a JSON based mapping configuration, which is passed to the fragment. The fragment has a drop-zone in which the form is dropped.

Currently, this fragment only populates text, numeric and select from list fields. However, this is likely to be extended in the future.

It contains a configurable retry mechanisim to ensure the form, which is dynamically generated, has finished rendering before attempting to populate the field.

This may not be suitable for a production scenario and it is simply intended to be example of what is possible.

#### Mapping Config
The following example shows the format of the JSON needed. The parameter attribute specifies the key used in the query string that should be used to populate the field value. The fieldReference is the name of the field in the DOM (make sure you examine the DOM once the form is rendered as this value can be different to the one configured). The fieldType determines which selector and setter functions are used. Finally, the fieldConfig is an object which can contain anything else the selector or setter function need in order to correctly populate the field.

In the case of a selectFromList field, it is necessary to provide the position of the list on the page, because the component does not contain a unqiue identifier to distinguish between different list of values.

If no value is provided for the in the query string, then the field will be skipped. Likewise, if no query string is provided at all then all fields will be skipped.
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
