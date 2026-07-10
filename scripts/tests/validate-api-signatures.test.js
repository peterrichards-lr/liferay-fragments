'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  parseParametersFromHTML,
  checkSignatureDrift,
} = require('../validate-api-signatures');

test('parseParametersFromHTML - extracts valid parameters', () => {
  const html = `
    <form>
      <input name="companyId" value="20099" />
      <input name="groupId" value="20121" />
      <input type="hidden" name="p_auth" value="abc123xyz" />
      <input name="name" value="test" />
      <textarea name="description">test desc</textarea>
    </form>
  `;
  const result = parseParametersFromHTML(html);

  // p_auth should be filtered out. Remaining should be extracted.
  assert.deepStrictEqual(result, [
    'companyId',
    'groupId',
    'name',
    'description',
  ]);
});

test('parseParametersFromHTML - filters out Liferay internal parameters', () => {
  const html = `
    <form>
      <input name="formDate" value="123" />
      <input name="p_auth" value="123" />
      <input name="contextName" value="123" />
      <input name="serviceSearch" value="123" />
      <input name="result" value="123" />
      <input name="execute" value="123" />
      <input name="validParam" value="123" />
    </form>
  `;
  const result = parseParametersFromHTML(html);
  assert.deepStrictEqual(result, ['validParam']);
});

test('parseParametersFromHTML - removes duplicates', () => {
  const html = `
    <input name="duplicateParam" />
    <input name="duplicateParam" />
    <input name="uniqueParam" />
  `;
  const result = parseParametersFromHTML(html);
  assert.deepStrictEqual(result, ['duplicateParam', 'uniqueParam']);
});

test('parseParametersFromHTML - handles empty/null', () => {
  assert.deepStrictEqual(parseParametersFromHTML(null), []);
  assert.deepStrictEqual(parseParametersFromHTML(''), []);
  assert.deepStrictEqual(
    parseParametersFromHTML('<html>no inputs here</html>'),
    []
  );
});

test('checkSignatureDrift - passes when all required parameters are present', () => {
  const params = ['companyId', 'groupId', 'name'];
  const expected = { mustContainAll: ['companyId', 'name'] };
  const result = checkSignatureDrift(params, expected);

  assert.strictEqual(result.status, 'OK');
  assert.strictEqual(result.warnings.length, 0);
});

test('checkSignatureDrift - flags warning when a required parameter is missing', () => {
  const params = ['companyId', 'groupId'];
  const expected = { mustContainAll: ['companyId', 'name'] };
  const result = checkSignatureDrift(params, expected);

  assert.strictEqual(result.status, 'WARN');
  assert.strictEqual(result.warnings.length, 1);
  assert.ok(result.warnings[0].includes("Expected parameter 'name' not found"));
});

test('checkSignatureDrift - passes when any required parameter is present', () => {
  const params = ['title', 'groupId'];
  const expected = { mustContainAny: ['title', 'name'] };
  const result = checkSignatureDrift(params, expected);

  assert.strictEqual(result.status, 'OK');
  assert.strictEqual(result.warnings.length, 0);
  assert.strictEqual(result.foundParam, 'title');
});

test('checkSignatureDrift - flags warning when none of the any required parameters are present', () => {
  const params = ['groupId'];
  const expected = { mustContainAny: ['title', 'name'] };
  const result = checkSignatureDrift(params, expected);

  assert.strictEqual(result.status, 'WARN');
  assert.strictEqual(result.warnings.length, 1);
  assert.ok(
    result.warnings[0].includes(
      'None of expected parameters [title, name] found'
    )
  );
});

test('checkSignatureDrift - handles both all and any constraints', () => {
  const params = ['companyId', 'name'];
  const expected = {
    mustContainAll: ['companyId'],
    mustContainAny: ['title', 'name'],
  };
  const result = checkSignatureDrift(params, expected);

  assert.strictEqual(result.status, 'OK');
  assert.strictEqual(result.warnings.length, 0);
  assert.strictEqual(result.foundParam, 'name');
});
