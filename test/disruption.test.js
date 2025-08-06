const { countDisruptions, aggregateDisruptions } = require('../src/disruption');

describe('countDisruptions', () => {
  test('counts events occurring after sprint start', () => {
    const issue = {
      changelog: [
        { field: 'Sprint', from: null, to: '1', created: '2024-01-05' },
        { field: 'status', from: 'Open', to: 'Blocked', created: '2024-01-10' },
        { field: 'issuetype', from: 'Bug', to: 'Task', created: '2024-01-12' },
        { field: 'Sprint', from: '1', to: null, created: '2024-01-13' },
        { field: 'Sprint', from: null, to: '1', created: '2023-12-30' }
      ]
    };
    const res = countDisruptions(issue, '2024-01-01');
    expect(res).toEqual({ pulled:1, blocked:1, moved:1, typeChanged:1 });
  });
});

describe('aggregateDisruptions', () => {
  test('sums results for multiple issues', () => {
    const issues = [
      { changelog:[{ field:'Sprint', from:null, to:'1', created:'2024-01-05' }] },
      { changelog:[{ field:'status', to:'Blocked', created:'2024-01-06' }] }
    ];
    const totals = aggregateDisruptions(issues, '2024-01-01');
    expect(totals).toEqual({ pulled:1, blocked:1, moved:0, typeChanged:0 });
  });
});
