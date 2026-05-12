// Prevent logger from monkey-patching fetch during tests
globalThis.MC_REPORT_SKIP_FETCH_WRAP = true;

const assert = require('assert');
const { weekStart, calculateWeeklyThroughput, monteCarloSprints, THROUGHPUT_WEEKS, MAX_SPRINT_ITERATIONS } = require('../src/sim');

// --- weekStart ---
(function testWeekStartMonday() {
  const result = weekStart('2025-01-06'); // Monday
  assert.strictEqual(result.getDay(), 1, 'should be Monday');
  assert.strictEqual(result.getDate(), 6);
})();

(function testWeekStartWednesday() {
  const result = weekStart('2025-01-08'); // Wednesday
  assert.strictEqual(result.getDay(), 1, 'should be Monday');
  assert.strictEqual(result.getDate(), 6);
})();

(function testWeekStartSunday() {
  const result = weekStart('2025-01-12'); // Sunday
  assert.strictEqual(result.getDay(), 1, 'should be Monday');
  assert.strictEqual(result.getDate(), 6);
})();

(function testWeekStartSaturday() {
  const result = weekStart('2025-01-11'); // Saturday
  assert.strictEqual(result.getDay(), 1, 'should be Monday');
  assert.strictEqual(result.getDate(), 6);
})();

(function testWeekStartMidnight() {
  const result = weekStart('2025-01-08T15:30:00');
  assert.strictEqual(result.getHours(), 0, 'hours should be 0');
  assert.strictEqual(result.getMinutes(), 0, 'minutes should be 0');
})();

// --- calculateWeeklyThroughput ---
(function testWeeklyThroughputBasic() {
  const now = new Date('2025-01-13'); // Monday
  const issues = [
    { resolutiondate: '2025-01-13' }, // same week as reference (current week)
    { resolutiondate: '2025-01-14' }, // same week
    { resolutiondate: '2025-01-06' }, // one week back
  ];
  const counts = calculateWeeklyThroughput(issues, now);
  assert.strictEqual(counts.length, THROUGHPUT_WEEKS, `should have ${THROUGHPUT_WEEKS} entries`);
  assert.strictEqual(counts[THROUGHPUT_WEEKS - 1], 2, 'current week should have 2 issues');
  assert.strictEqual(counts[THROUGHPUT_WEEKS - 2], 1, 'previous week should have 1 issue');
})();

(function testWeeklyThroughputIgnoresNull() {
  const counts = calculateWeeklyThroughput([{ resolutiondate: null }, {}], new Date());
  assert.strictEqual(counts.reduce((a, b) => a + b, 0), 0, 'no issues should be counted');
})();

(function testWeeklyThroughputIgnoresOld() {
  const now = new Date('2025-01-13');
  const issues = [{ resolutiondate: '2024-01-01' }]; // way too old
  const counts = calculateWeeklyThroughput(issues, now);
  assert.strictEqual(counts.reduce((a, b) => a + b, 0), 0, 'old issues should be excluded');
})();

// --- monteCarloSprints ---
(function testMonteCarloBasicCompletion() {
  const throughput = [10, 10, 10]; // consistent 10 per sprint
  const result = monteCarloSprints(30, throughput, 100, 100);
  assert.strictEqual(result.length, 100, 'should have 100 runs');
  assert.ok(result.every(s => s === 3), 'all runs should take exactly 3 sprints with constant throughput');
})();

(function testMonteCarloAllocation() {
  const throughput = [10, 10, 10];
  const result = monteCarloSprints(30, throughput, 50, 100); // 50% allocation = 5/sprint
  assert.ok(result.every(s => s === 6), 'should take 6 sprints at 50% allocation');
})();

(function testMonteCarloMaxIterations() {
  const throughput = [0]; // zero throughput (floor to 1)
  const result = monteCarloSprints(1000, throughput, 100, 10);
  assert.ok(result.every(s => s <= MAX_SPRINT_ITERATIONS), `should not exceed ${MAX_SPRINT_ITERATIONS} sprints`);
})();

(function testMonteCarloSorted() {
  const throughput = [5, 10, 15, 20];
  const result = monteCarloSprints(50, throughput, 100, 500);
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i] >= result[i - 1], 'results should be sorted ascending');
  }
})();

(function testMonteCarloZeroBacklog() {
  const throughput = [10];
  const result = monteCarloSprints(0, throughput, 100, 50);
  assert.ok(result.every(s => s === 0), 'zero backlog should need 0 sprints');
})();

console.log('All sim tests passed.');
