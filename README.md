# liferay-fragments
A selection of Liferay Fragments

## Date Display (Static)
This fragment displays a date or date range via its configuration, hence it can only be used for static dates.

The date format must be yyyy-MM-dd, e.g. 2021-11-01 for the 1st November 2021.

You can set either the start date, end date or both. When only one date is displayed then no seperator is displayed. If both dates are specified then the start date will be first followed by the separator and then finally the end date.

The Clay calendar icon can be turned on or off via the configuration.

The JavaScript will not execute when the fragement is viewed in either the Fragement Editor or the Page Content Editor.

## Date Display (Collection Display)
This fragment displays a date or date range via two mappable fields, hence ic an be used for collection displays.

The left hand mappable field is for the start date and the right hand mappable field is for the end date. If either values are empty then its corresponding HTML will not be displayed.

The mappable fields are hidden by default and only made visible when the fragment is viewed in the Page Content Editor.

The Clay calendar icon can be turned on or off via the configuration.

The JavaScript will not execute when the fragement is viewed in either the Fragement Editor or the Page Content Editor.
