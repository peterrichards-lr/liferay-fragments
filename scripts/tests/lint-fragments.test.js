'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  validateConfiguration,
  validateFragment,
} = require('../lint-fragments');

test('validateConfiguration - passes valid configuration', () => {
  const validConfig = {
    fieldSets: [
      {
        label: 'design',
        fields: [
          {
            name: 'backgroundColor',
            type: 'colorPicker',
            label: 'background-color',
            description: 'background-color-desc',
            dataType: 'string',
            defaultValue: 'primary',
          },
        ],
      },
    ],
  };

  const isValid = validateConfiguration(validConfig);
  assert.strictEqual(isValid, true);
});

test('validateConfiguration - fails invalid dataType', () => {
  const invalidConfig = {
    fieldSets: [
      {
        label: 'design',
        fields: [
          {
            name: 'backgroundColor',
            type: 'colorPicker',
            label: 'background-color',
            description: 'background-color-desc',
            dataType: 123, // Invalid: must be string enum
            defaultValue: 'primary',
          },
        ],
      },
    ],
  };

  const isValid = validateConfiguration(invalidConfig);
  assert.strictEqual(isValid, false);
});

test('validateFragment - passes valid fragment.json', () => {
  const validFragment = {
    cssPath: 'index.css',
    htmlPath: 'index.html',
    jsPath: 'index.js',
    configurationPath: 'configuration.json',
    type: 'component',
    name: 'My Component',
  };

  const isValid = validateFragment(validFragment);
  assert.strictEqual(isValid, true);
});

test('validateFragment - fails missing required fields', () => {
  const invalidFragment = {
    name: 'Missing Type and HTML Path',
  };

  const isValid = validateFragment(invalidFragment);
  assert.strictEqual(isValid, false);
});
