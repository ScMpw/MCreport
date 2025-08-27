const assert = require('assert');

const SPRINT_KEY_RE = /\b(?:\d{4}[-_ ]?)?PI\d+[-_ ]?\d+(?:\|\d+)?\b/i;

function extractSprintKey(name) {
  const m = (name || '').match(SPRINT_KEY_RE);
  if (!m) return null;
  let key = m[0];
  key = key.replace(/(\d{4})[- ]PI/, '$1_PI');
  key = key.replace(/(PI\d+)[-_ ](\d+)/, '$1-$2');
  return key;
}

(function() {
  assert.strictEqual(extractSprintKey('2025_PI3-3|4 indicator'), '2025_PI3-3|4');
  assert.strictEqual(extractSprintKey('PI4 2'), 'PI4-2');
  assert.strictEqual(extractSprintKey('2025-PI5_1'), '2025_PI5-1');
  console.log('extractSprintKey tests passed');
})();
