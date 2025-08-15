const assert = require('assert');

(async () => {
  const { computeBucketSeries } = await import('../src/piPlanVsCompleteChart.mjs');

  const sprints = [
    { id: 1, start: '2023-01-01', end: '2023-01-07' }
  ];

  const issues = [
    {
      key: 'ST-1',
      team: 'ALL',
      product: 'ALL',
      storyPoints: 3,
      parentKey: 'EP-1',
      epicLabels: ['L1'],
      changelog: [
        { field: 'Sprint', from: '', to: '1', at: '2022-12-20' }
      ]
    },
    {
      key: 'ST-2',
      team: 'ALL',
      product: 'ALL',
      storyPoints: 5,
      parentKey: 'EP-2',
      epicLabels: ['L2'],
      changelog: [
        { field: 'Sprint', from: '', to: '1', at: '2022-12-21' }
      ]
    }
  ];

  const piBuckets = [
    { labelTop: 'S1', labelBottom: '', sprintIds: [1] }
  ];

  const logs = [];
  const orig = console.log;
  console.log = (...args) => { logs.push(args.join(' ')); };

  computeBucketSeries({ team: 'ALL', product: 'ALL', sprints, issues, piBuckets });

  console.log = orig;

  assert.strictEqual(logs.length, issues.length);
  assert(logs.some(l => l.includes('ST-1') && l.includes('EP-1') && l.includes('L1')));
  assert(logs.some(l => l.includes('ST-2') && l.includes('EP-2') && l.includes('L2')));

  console.log('epicLabelsConsole tests passed');
})();
