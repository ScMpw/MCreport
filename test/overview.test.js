const { filterIssues, calculateMetrics, isoWeekNumber } = require('../src/overview');

describe('filterIssues', () => {
  const issues = [
    { team:'A', product:'P1', project:'X' },
    { team:'B', product:'P2', project:'Y' }
  ];
  test('filters by team', () => {
    const res = filterIssues(issues, { team:'A' });
    expect(res.length).toBe(1);
    expect(res[0].team).toBe('A');
  });
});

describe('calculateMetrics', () => {
  const issues = [
    { created:'2025-01-01', resolved:'2025-01-06', points:3 },
    { created:'2025-01-02', resolved:'2025-01-06', points:5 }
  ];
  test('computes averages and per week data', () => {
    const res = calculateMetrics(issues);
    expect(res.averageCycleTime).toBeCloseTo(4.5);
    const week = isoWeekNumber('2025-01-06');
    expect(res.throughputPerWeek[week]).toBe(2);
    expect(res.velocityPerWeek[week]).toBe(8);
  });

  test('handles story points as strings', () => {
    const stringIssues = [
      { created:'2025-02-01', resolved:'2025-02-05', points:'4' },
      { created:'2025-02-02', resolved:'2025-02-05', points:'6' }
    ];
    const res = calculateMetrics(stringIssues);
    const week = isoWeekNumber('2025-02-05');
    expect(res.velocityPerWeek[week]).toBe(10);
  });
});
