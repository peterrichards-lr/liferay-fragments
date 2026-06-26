# Currency Input

## Overview

The `currency-input` fragment provides an input field specialized for monetary values. It can be formatted with custom currency symbols, thousand separators, and decimal definitions.

## Configuration

Options available in `configuration.json`:

- **currencySymbol** (text): The character symbol for the currency (default: `$`).
- **thousandsSeparator** (text): Character used for separating thousands (default: `,`).
- **decimalSeparator** (text): Character used to indicate decimals (default: `.`).
- **decimalPlaces** (text): Number of decimal places to enforce (default: `2`).
- **placeholder** (text): Optional placeholder string for the input box.

## Usage & Behavior

The fragment wraps a standard form input. Custom Javascript (or native browser handling) is generally used to format the visual appearance of the input number so that it aligns with the configured separators and decimal counts. This ensures data is captured uniformly regardless of locale preferences.

## Dependencies

- Inherits Clay standard `form-control` styles.
