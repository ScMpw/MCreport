const assert = require('assert');

const SPRINT_KEY_RE = /\b(?:(\d{4})[-_ ]?)?(?:PI)?(\d+)[-_ ]?(\d+)(?:[|/](\d+))?\b/i;

function extractSprintKey(name) {
  const m = (name || '').match(SPRINT_KEY_RE);
  if (!m) return null;
  const year = m[1] ? m[1] + '_' : '';
  const pi = m[2];
  let sprint = m[3] || '';
  if (m[4]) {
    sprint = m[3];
  } else if (sprint.length > 1) {
    sprint = sprint[0];
  }
  return `${year}PI${pi}-${sprint}`;
}

(function() {
  assert.strictEqual(extractSprintKey('3-1'), 'PI3-1');
  assert.strictEqual(extractSprintKey('2025_3-1'), '2025_PI3-1');
  assert.strictEqual(extractSprintKey('2025_PI3-12'), '2025_PI3-1');
  assert.strictEqual(extractSprintKey('PI4 3/4'), 'PI4-3');
  assert.strictEqual(extractSprintKey('2025-PI5_1'), '2025_PI5-1');
  assert.strictEqual(extractSprintKey('PI6-56 extra'), 'PI6-5');
  console.log('extractSprintKey tests passed');
})();
