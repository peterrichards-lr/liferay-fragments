const test = require('node:test');
const assert = require('node:assert');

test('Sanity check: node:test runner and node:assert operate correctly', () => {
  assert.strictEqual(1 + 1, 2);
});
