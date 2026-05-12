const assert = require('assert');
const { escapeHtml, isValidJiraDomain, isValidIssueKey } = require('../src/sanitize');

// --- escapeHtml ---
(function testEscapeBasic() {
  assert.strictEqual(escapeHtml('<b>hello</b>'), '&lt;b&gt;hello&lt;/b&gt;');
})();

(function testEscapeAmpersand() {
  assert.strictEqual(escapeHtml('A & B'), 'A &amp; B');
})();

(function testEscapeQuotes() {
  assert.strictEqual(escapeHtml('"hello" & \'world\''), '&quot;hello&quot; &amp; &#39;world&#39;');
})();

(function testEscapeNonString() {
  assert.strictEqual(escapeHtml(42), '42');
  assert.strictEqual(escapeHtml(null), '');
  assert.strictEqual(escapeHtml(undefined), '');
})();

(function testEscapeSafeString() {
  assert.strictEqual(escapeHtml('hello world'), 'hello world');
})();

// --- isValidJiraDomain ---
(function testValidDomain() {
  assert.strictEqual(isValidJiraDomain('example.atlassian.net'), true);
  assert.strictEqual(isValidJiraDomain('my-org.atlassian.net'), true);
})();

(function testInvalidDomain() {
  assert.strictEqual(isValidJiraDomain('evil.com'), false);
  assert.strictEqual(isValidJiraDomain('atlassian.net'), false, 'bare atlassian.net has no subdomain');
  assert.strictEqual(isValidJiraDomain('foo.atlassian.net.evil.com'), false);
  assert.strictEqual(isValidJiraDomain(''), false);
  assert.strictEqual(isValidJiraDomain(null), false);
})();

// --- isValidIssueKey ---
(function testValidKeys() {
  assert.strictEqual(isValidIssueKey('PROJ-123'), true);
  assert.strictEqual(isValidIssueKey('AB-1'), true);
  assert.strictEqual(isValidIssueKey('MY_PROJ-99'), true);
})();

(function testInvalidKeys() {
  assert.strictEqual(isValidIssueKey('123'), false);
  assert.strictEqual(isValidIssueKey('PROJ'), false);
  assert.strictEqual(isValidIssueKey('PROJ-'), false);
  assert.strictEqual(isValidIssueKey(''), false);
  assert.strictEqual(isValidIssueKey(null), false);
  assert.strictEqual(isValidIssueKey('PRO J-123'), false);
})();

console.log('All sanitize tests passed.');
