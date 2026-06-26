# Dashboard Filter

The **Dashboard Filter** fragment provides a centralized interface for filtering
data across multiple fragments on a dashboard page.

## Key Features

- **Cross-Fragment Communication**: Emits events that other fragments can listen
  to for real-time data updates.
- **Dynamic Options**: Automatically populates filter categories based on
  Liferay Object definitions or Picklists.
- **Persistent State**: Option to save filter selections in the URL query
  string.

## Configuration

- **Target Object**: The Liferay Object whose data is being filtered.
- **Filter Fields**: Choose which fields should be available as filters (e.g.,
  Status, Region, Date).
- **Event Name**: The custom event name used for broadcasting filter changes.
