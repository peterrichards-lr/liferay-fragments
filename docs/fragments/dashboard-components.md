# Dashboard Components

A collection of fragments designed to build interactive dashboards, specifically
tailored for health and activity tracking.

## Dashboard Container

A foundational fragment that provides a scoped container
(`#healthcare-dashboard`) and a drop zone for placing other dashboard elements.

## Dashboard Filter

A comprehensive filter component that allows users to adjust the data displayed
on the dashboard.

- **Date Range**: Selectable start and end dates.
- **Max Entries**: A numeric input to limit the number of data points or
  readings displayed.
- **Steps Target**: A numeric input to set or adjust a daily steps goal.
- **Refresh**: A button to trigger a dashboard update based on the current
  filter values.
- **Sync Data**: A button designed to trigger a data synchronization process
  from external sources.

These components typically interact with other fragments on the page via
JavaScript events to provide a cohesive dashboard experience.
