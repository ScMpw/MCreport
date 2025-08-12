const assert = require('assert');
const { calculateDisruptionMetrics } = require('../src/disruption');

// Test movedOut issues are counted regardless of completion status
(() => {
  const events = [
    { key: 'ST-1', points: 5, completed: false, movedOut: true },
    { key: 'ST-2', points: 3, completed: true, movedOut: true }
  ];
  const metrics = calculateDisruptionMetrics(events);
  assert.strictEqual(metrics.movedOut, 8);
  assert.strictEqual(metrics.movedOutCount, 2);
  assert.deepStrictEqual(metrics.movedOutIssues.sort(), ['ST-1', 'ST-2']);
})();

console.log('disruption tests passed');
