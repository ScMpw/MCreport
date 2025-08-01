const { calculateWeeklyThroughput, monteCarloSprints } = require('../src/sim');

describe('calculateWeeklyThroughput', () => {
  test('counts issues resolved in each week', () => {
    const base = new Date('2024-01-22'); // Monday
    const issues = [
      { resolutiondate: '2024-01-20' }, // previous week
      { resolutiondate: '2024-01-21' }, // previous week Sunday -> same as above
      { resolutiondate: '2024-01-22' }, // current week Monday
      { resolutiondate: '2024-01-28' }, // current week Sunday
      { resolutiondate: null },
    ];
    const counts = calculateWeeklyThroughput(issues, new Date('2024-01-28'));
    // last value is most recent week
    expect(counts[11]).toBe(2);
    expect(counts[10]).toBe(2);
    expect(counts.reduce((a,b)=>a+b,0)).toBe(4);
  });
});

describe('monteCarloSprints', () => {
  test('returns sorted sprint counts', () => {
    const runs = monteCarloSprints(10, [5], 100, 5);
    expect(runs.length).toBe(5);
    for (let i=1;i<runs.length;i++) {
      expect(runs[i]).toBeGreaterThanOrEqual(runs[i-1]);
    }
  });
});
