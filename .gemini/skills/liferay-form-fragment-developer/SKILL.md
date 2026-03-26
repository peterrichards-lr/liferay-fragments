---
name: liferay-form-fragment-developer
description:
  Expert guidance for developing Liferay Form Fragments. Use when creating,
  modifying, or auditing Form Fragments that map to Object fields via Form
  Containers.
---

# Liferay Form Fragment Developer Skill

This skill provides specialized procedural knowledge and architectural standards
for building Liferay Form Fragments (Liferay 7.4 U45+).

## Core Workflows

### 1. New Form Fragment Creation

- **Fragment Type**: Ensure the fragment is created as a "Form Fragment" type.
- **Template Extension**: Use the correct extension for the primary template:
  - **`.ftl`**: If using FreeMarker tags (`[#if]`), Clay taglibs (`[@clay]`), or
    Liferay variables (`${siteSpritemap}`).
  - **`.html`**: Only for strictly static HTML or basic editable fields.
  - Update `htmlPath` in `fragment.json` accordingly.
- **`input` Object usage**: Always utilize the global `input` object in `.ftl`
  and `.js` for field mapping.
  - Map `input.name` to the `name` attribute of the HTML input element.
  - Map `input.value` to the `value` attribute.
  - Display `input.label` and `input.helpText` based on `input.showLabel` and
    `input.showHelpText`.
- **Field Type Support**: Declare supported field types in the fragment's
  metadata (if applicable) or handle them via `input.fieldTypes`.
- **Validation**: Display `input.errorMessage` when validation fails.
- **CAPTCHA**: If supporting CAPTCHA, ensure no other field types are present.
- **Button Redirection**: For button fragments, include `type="button"` to
  enable link/redirection settings in Liferay.

### 2. Auditing Form Fragments

- **`input` Object Integrity**: Verify that `input.name` is correctly bound to
  the HTML `name` attribute. This is critical for data submission.
- **Requirement Compliance**: Verify that the fragment functions correctly when
  placed inside a Form Container.
- **API Reference Usage**: Refer to
  [Form Fragment API](./references/form-fragment-api.md) for details on the
  `input` object and its type-specific attributes.
- **General Fragment Standards**: Adhere to the core architectural standards
  defined in the base reference guides.

## Reference Guides

### Form Specifics

- **[Form Fragment API](./references/form-fragment-api.md)**: Details on the
  `input` object, FreeMarker/JS variables, and constraints.
- **[Object Integration](./references/object-integration.md)**: Standards for
  Object definitions and field naming.

### Shared Fragment Architecture

- **[Lifecycle & Environment](./references/lifecycle.md)**: Global objects,
  initialization, and FreeMarker rules.
- **[Best Practices](./references/best-practices.md)**: Configuration nesting,
  dependencies, and scoping.
- **[UI & Interaction](./references/ui-standards.md)**: Edit mode hygiene,
  Mappable Field Ergonomics, and A11y.
- **[Theme Standards](./references/themes.md)**: Multi-theme tokens (Classic,
  Dialect, Meridian).
