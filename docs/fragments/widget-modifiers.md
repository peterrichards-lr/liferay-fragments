# Widget Modifiers

A collection of fragments that use JavaScript to enhance and transform existing out-of-the-box Liferay widgets.

## Alerts Modifier

This powerful utility fragment targets the standard Liferay **Alerts and Announcements** widget to provide a more modern and interactive user experience.

- **Accordion Mode**: Converts the list of alerts into a collapsible accordion, allowing users to expand and collapse message bodies. You can configure the initial state (all open or all closed) and the icons used for the expand/collapse triggers.
- **Enhanced "Mark as Read"**: Adds a clear, customizable button directly into the message body for marking an alert as read, bypassing the need to use the standard context menu.
- **Clay Integration**: Optionally applies Liferay Clay CSS classes to the alerts for a consistent DXP look and feel.
- **Analytics Cloud Integration**: Automatically tracks user interactions with alerts.
    - Records a "Viewed alert" event when an accordion section is expanded.
    - Records a "Read alert" event when the "Mark as Read" button is clicked.
- **Anonymous User Optimization**: Automatically hides administrative UI elements (like the "Read / Unread" tabs) for guest users to provide a cleaner interface.

### Usage

1. Add the standard **Alerts and Announcements** widget to a page.
2. Place the **Alerts Modifier** fragment anywhere on the same page.
3. Configure the modifier's options (Accordion, Button styles, etc.) to achieve the desired look and feel.
