import assert from 'node:assert/strict';
import test from 'node:test';
import { listEvalSuites, normalizeVn, countMatches } from './aiEvalHarness.ts';

test('normalizeVn removes Vietnamese diacritics', () => {
  assert.equal(normalizeVn('Đối soát Công nợ'), 'doi soat cong no');
  assert.equal(normalizeVn('Nhắc nợ 5 ngày'), 'nhac no 5 ngay');
  assert.equal(normalizeVn('PHẢI THU'), 'phai thu');
});

test('countMatches finds keyword presence regardless of diacritics', () => {
  const content = 'Cần đối soát công nợ phải thu và nhắc nợ khách hàng.';
  const { matched, missing } = countMatches(content, ['công nợ', 'đối soát', 'rủi ro']);
  assert.deepEqual(matched, ['công nợ', 'đối soát']);
  assert.deepEqual(missing, ['rủi ro']);
});

test('eval suites are well-formed', () => {
  const suites = listEvalSuites();
  assert.ok(suites.length >= 4, 'expected at least 4 suites');
  for (const suite of suites) {
    assert.ok(suite.id, 'suite.id required');
    assert.ok(suite.roleId, 'suite.roleId required');
    assert.ok(suite.cases.length > 0, `suite ${suite.id} has cases`);
    for (const c of suite.cases) {
      assert.ok(c.prompt.length > 0, 'case prompt required');
      assert.ok(c.checks.length > 0, `case ${c.id} has checks`);
    }
  }
});
