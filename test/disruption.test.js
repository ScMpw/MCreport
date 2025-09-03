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

// Test an issue can contribute to multiple disruption categories
(() => {
  const events = [
    { key: 'ST-3', points: 5, addedAfterStart: true },
    { key: 'ST-3', points: 5, movedOut: true }
  ];
  const metrics = calculateDisruptionMetrics(events);
  assert.strictEqual(metrics.pulledIn, 5);
  assert.strictEqual(metrics.movedOut, 5);
  assert.strictEqual(metrics.pulledInCount, 1);
  assert.strictEqual(metrics.movedOutCount, 1);
  assert.deepStrictEqual(metrics.pulledInIssues, ['ST-3']);
  assert.deepStrictEqual(metrics.movedOutIssues, ['ST-3']);
})();

// Test typeChanged issues contribute correctly and are de-duplicated
(() => {
  const events = [
    { key: 'ST-4', points: 3, typeChanged: true },
    { key: 'ST-4', points: 3, typeChanged: true },
    { key: 'ST-5', points: 8, typeChanged: true }
  ];
  const metrics = calculateDisruptionMetrics(events);
  assert.strictEqual(metrics.typeChanged, 11);
  assert.strictEqual(metrics.typeChangedCount, 2);
  assert.deepStrictEqual(metrics.typeChangedIssues.sort(), ['ST-4', 'ST-5']);
})();

console.log('disruption tests passed');
