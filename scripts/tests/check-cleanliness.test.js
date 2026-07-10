'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { parseGitStatus, ALLOWED_UNTRACKED } = require('../check-cleanliness');

test('parseGitStatus - clean workspace', () => {
  const result = parseGitStatus('');
  assert.deepStrictEqual(result, []);
});

test('parseGitStatus - ignores tracked files', () => {
  const statusOutput = ` M file1.js
 M file2.js
 D old-file.js`;
  const result = parseGitStatus(statusOutput);
  assert.deepStrictEqual(result, []);
});

test('parseGitStatus - ignores allowed untracked files', () => {
  const statusOutput = `?? temp/
?? temp_extract/
?? test-results/report.html
?? ldm_startup.log
?? node_modules/some-module/index.js`;
  const result = parseGitStatus(statusOutput, ALLOWED_UNTRACKED);
  assert.deepStrictEqual(result, []);
});

test('parseGitStatus - flags unallowed root untracked files', () => {
  const statusOutput = `?? some-new-file.js
?? unexpected-dir/
?? ldm_startup.log`; // allowed
  const result = parseGitStatus(statusOutput, ALLOWED_UNTRACKED);
  assert.deepStrictEqual(result, ['some-new-file.js', 'unexpected-dir/']);
});

test('parseGitStatus - ignores deeply nested untracked files', () => {
  const statusOutput = `?? collections/my-collection/new-fragment/index.js
?? docs/images/some-image.png`;
  const result = parseGitStatus(statusOutput, ALLOWED_UNTRACKED);
  assert.deepStrictEqual(result, []);
});

test('parseGitStatus - flags unallowed root untracked directories', () => {
  const statusOutput = `?? src/
?? build/
?? collections/my-collection/`;
  const result = parseGitStatus(statusOutput, ALLOWED_UNTRACKED);
  assert.deepStrictEqual(result, ['src/', 'build/']); // collections/my-collection/ is > 2 parts
});

test('parseGitStatus - handles null or undefined', () => {
  assert.deepStrictEqual(parseGitStatus(null), []);
  assert.deepStrictEqual(parseGitStatus(undefined), []);
});
