const { countDisruptions, aggregateDisruptions } = require('../src/disruption');

describe('countDisruptions', () => {
  test('counts events occurring after sprint start', () => {
    const issue = {
      key: 'ISSUE-1',
      changelog: [
        { field: 'Sprint', from: null, to: '1', created: '2024-01-05' },
        { field: 'status', from: 'Open', to: 'Blocked', created: '2024-01-10' },
        { field: 'issuetype', from: 'Bug', to: 'Task', created: '2024-01-12' },
        { field: 'Sprint', from: '1', to: null, created: '2024-01-13' },
        { field: 'Sprint', from: null, to: '1', created: '2023-12-30' }
      ]
    };
    const res = countDisruptions(issue, '2024-01-01');
    expect(res.pulled).toBe(1);
    expect(res.blocked).toBe(1);
    expect(res.moved).toBe(1);
    expect(res.typeChanged).toBe(1);
    expect(res.details.pulled).toContain('ISSUE-1');
    expect(res.details.blocked).toContain('ISSUE-1');
    expect(res.details.moved).toContain('ISSUE-1');
    expect(res.details.typeChanged).toContain('ISSUE-1');
  });
});

describe('aggregateDisruptions', () => {
  test('sums results for multiple issues', () => {
    const issues = [
      { key:'A', changelog:[{ field:'Sprint', from:null, to:'1', created:'2024-01-05' }] },
      { key:'B', changelog:[{ field:'status', to:'Blocked', created:'2024-01-06' }] }
    ];
    const totals = aggregateDisruptions(issues, '2024-01-01');
    expect(totals.pulled).toBe(1);
    expect(totals.blocked).toBe(1);
    expect(totals.moved).toBe(0);
    expect(totals.typeChanged).toBe(0);
    expect(totals.details.pulled).toEqual(['A']);
    expect(totals.details.blocked).toEqual(['B']);
  });
});
