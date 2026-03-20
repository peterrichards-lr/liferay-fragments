# Pulse Integration Fragments

A suite of fragments designed to integrate Liferay DXP with the "Pulse" campaign
tracking and analytics system.

## Core Integration

These fragments facilitate the exchange of data between the Pulse tracking
scripts and Liferay Objects.

- **Campaign Initialiser**: Automatically creates or synchronizes a Liferay
  "Campaign" Object based on the tracking cookies set by Pulse (`__pcId`,
  `__intId`, etc.). It also parses UTM parameters from the URL to provide rich
  campaign attribution within Liferay.
- **Cookie Sniffer**: A debugging utility that displays the current values of
  Pulse-related cookies on the page. This is useful for verifying that the
  tracking script is correctly identifying the user and campaign.

## Interaction Tracking

- **Custom Event Listener**: A versatile fragment that can be configured to
  listen for any DOM event (e.g., clicks, form submissions) on specific
  elements. When an event occurs, it:
  1.  Creates a "Campaign Interaction" record in a Liferay Object.
  2.  Sends a custom event to **Liferay Analytics Cloud**, enriched with
      campaign context (Pulse ID, URL Token, etc.).
- **Pulse Button**: A stylized button component designed to trigger specific
  Pulse-tracked actions.

## Prerequisites

These fragments depend on a **Pulse JS Client Extension** being present on the
page. This client extension provides the `pulseHelper` utility used for API
interactions and cookie management.

## Key Features

- **UTM Attribution**: Automatically maps standard UTM parameters
  (`utm_campaign`, `utm_source`, etc.) to Liferay Object fields.
- **Analytics Cloud Enrichment**: Automatically attaches campaign context to
  custom events sent to Analytics Cloud, allowing for deep analysis of campaign
  performance.
- **Flexible Event Targeting**: Use CSS selectors to target specific elements
  for event listening, either globally or scoped to a specific drop zone.
