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

// Test moved out before sprint start is ignored
(() => {
  const events = [
    { key: 'ST-4', points: 4, movedOut: true, removedBeforeStart: true }
  ];
  const metrics = calculateDisruptionMetrics(events);
  assert.strictEqual(metrics.movedOut, 0);
  assert.strictEqual(metrics.movedOutCount, 0);
  assert.deepStrictEqual(metrics.movedOutIssues, []);
})();

// Test spillover issues are counted
(() => {
  const events = [
    { key: 'ST-5', points: 3, completed: false },
    { key: 'ST-6', points: 2, completed: false, movedOut: true }
  ];
  const metrics = calculateDisruptionMetrics(events);
  assert.strictEqual(metrics.spillover, 3);
  assert.strictEqual(metrics.spilloverCount, 1);
  assert.deepStrictEqual(metrics.spilloverIssues, ['ST-5']);
})();

// Test spillover items that were pulled in after sprint start
(() => {
  const events = [
    { key: 'ST-7', points: 2, addedAfterStart: true }
  ];
  const metrics = calculateDisruptionMetrics(events);
  assert.strictEqual(metrics.pulledInCount, 1);
  assert.strictEqual(metrics.spilloverCount, 1);
  assert.strictEqual(metrics.spilloverPulledInCount, 1);
  assert.deepStrictEqual(metrics.spilloverPulledInIssues, ['ST-7']);
})();

console.log('disruption tests passed');
