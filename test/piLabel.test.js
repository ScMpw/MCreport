const assert = require('assert');
const { isPiRelevant } = require('../src/piLabel');

(() => {
  assert.strictEqual(isPiRelevant(['2025_PI3_committed']), true);
  assert.strictEqual(isPiRelevant(['misc']), false);
  assert.strictEqual(isPiRelevant(['2025_PI3_committed', 'other']), true);
  assert.strictEqual(isPiRelevant(['maindriver']), true);
  assert.strictEqual(isPiRelevant([]), false);
})();

console.log('piLabel tests passed');
