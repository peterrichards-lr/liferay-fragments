# Confirmation Field

A utility form fragment that ensures two inputs match (e.g., Email Confirmation,
Password Confirmation). It is specifically designed to coordinate with the
specialized **Submit Button** fragment for enforced client-side validation.

## Visuals

![Confirmation Field](../../docs/images/form-confirmation-field.png)

## Usage

1.  **Placement**: Place inside a Liferay Form.
2.  **Mapping**: Map the 'Target Field Name' to the field you wish to confirm.
3.  **Coordination**: Use the specialized **Submit Button** fragment from this
    library to ensure that the form cannot be submitted unless these fields
    match.
4.  **Validation**: The fragment automatically provides real-time feedback if
    the values do not match upon blurring the fields.
