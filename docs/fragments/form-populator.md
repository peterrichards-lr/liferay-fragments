# Form Populator

This fragment can pre-populate a form fields using values passed in the URL query string. This is achieved by using a JSON based mapping configuration, which is passed to the fragment. The fragment has a drop-zone in which the form is dropped.

Currently, this fragment only populates text, numeric and select from list fields. However, this is likely to be extended in the future.

It contains a configurable retry mechanism to ensure the form, which is dynamically generated, has finished rendering before attempting to populate the field.

This may not be suitable for a production scenario, and it is simply intended to be example of what is possible.

![Form Populator](../images/form-populator.png)

#### Mapping Config
The following example shows the format of the JSON needed. The parameter attribute specifies the key used in the query string that should be used to populate the field value. The fieldReference is the name of the field in the DOM (make sure you examine the DOM once the form is rendered as this value can be different to the one configured). The fieldType determines which selector and setter functions are used. Finally, the fieldConfig is an object which can contain anything else the selector or setter function need in order to correctly populate the field.

In the case of a selectFromList field, it is necessary to provide the position of the list on the page, because the component does not contain a unique identifier to distinguish between different list of values.

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
