const assert = require('assert');
const { calculateVelocity, calculateStdDev, calculateWorkDays } = require('../src/kpis');

// --- calculateVelocity ---
(function testVelocityBasic() {
  assert.strictEqual(calculateVelocity([10, 20, 30]), 20, 'mean of 10,20,30 should be 20');
})();

(function testVelocityEmpty() {
  assert.strictEqual(calculateVelocity([]), 0, 'empty array should return 0');
})();

(function testVelocityFiltersNaN() {
  assert.strictEqual(calculateVelocity([10, NaN, 'foo', 20]), 15, 'should ignore NaN and strings');
})();

(function testVelocitySingleValue() {
  assert.strictEqual(calculateVelocity([42]), 42, 'single value should return itself');
})();

(function testVelocityUndefinedInput() {
  assert.strictEqual(calculateVelocity(), 0, 'no argument should return 0');
})();

// --- calculateStdDev ---
(function testStdDevUniform() {
  assert.strictEqual(calculateStdDev([5, 5, 5]), 0, 'identical values should have 0 stddev');
})();

(function testStdDevBasic() {
  const stddev = calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.ok(Math.abs(stddev - 2) < 0.01, `expected ~2.0, got ${stddev}`);
})();

(function testStdDevWithMean() {
  const stddev = calculateStdDev([10, 20, 30], 20);
  const expected = Math.sqrt((100 + 0 + 100) / 3);
  assert.ok(Math.abs(stddev - expected) < 0.001, `expected ~${expected}, got ${stddev}`);
})();

(function testStdDevEmpty() {
  assert.strictEqual(calculateStdDev([]), 0, 'empty array should return 0');
})();

// --- calculateWorkDays ---
(function testWorkDaysWeekday() {
  // Mon 2025-01-06 to Fri 2025-01-10 = 4 full work days
  const days = calculateWorkDays('2025-01-06T00:00:00', '2025-01-10T00:00:00');
  assert.ok(Math.abs(days - 4) < 0.01, `expected 4 work days, got ${days}`);
})();

(function testWorkDaysWeekend() {
  // Sat 2025-01-04 to Mon 2025-01-06 = 0 work days (all weekend)
  const days = calculateWorkDays('2025-01-04T00:00:00', '2025-01-06T00:00:00');
  assert.strictEqual(days, 0, 'weekend should have 0 work days');
})();

(function testWorkDaysInvalid() {
  assert.strictEqual(calculateWorkDays(null, null), 0, 'null inputs should return 0');
  assert.strictEqual(calculateWorkDays('2025-01-10', '2025-01-05'), 0, 'end before start should return 0');
  assert.strictEqual(calculateWorkDays('invalid', '2025-01-10'), 0, 'invalid date should return 0');
})();

(function testWorkDaysFullWeek() {
  // Mon 2025-01-06 to Mon 2025-01-13 = 5 work days
  const days = calculateWorkDays('2025-01-06T00:00:00', '2025-01-13T00:00:00');
  assert.ok(Math.abs(days - 5) < 0.01, `expected 5 work days, got ${days}`);
})();

console.log('All kpis tests passed.');
