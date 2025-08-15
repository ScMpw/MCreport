const assert = require('assert');

(async () => {
  const { computeBucketSeries } = await import('../src/piPlanVsCompleteChart.mjs');

  const sprints = [
    { id: 1, name: '2024 PI1 S1', start: '2024-01-01', end: '2024-01-07' },
    { id: 2, name: '2024 PI2 S1', start: '2024-01-08', end: '2024-01-14' }
  ];

  const issues = [
    {
      team: 'ALL',
      product: 'ALL',
      storyPoints: 5,
      epicLabels: ['2024_PI1_committed'],
      changelog: [
        { field: 'Sprint', from: '', to: '1', at: '2023-12-20' },
        { field: 'Status', from: 'To Do', to: 'Done', at: '2024-01-05' }
      ]
    },
    {
      team: 'ALL',
      product: 'ALL',
      storyPoints: 8,
      epicLabels: ['maindriver'],
      changelog: [
        { field: 'Sprint', from: '', to: '1', at: '2023-12-20' },
        { field: 'Sprint', from: '1', to: '2', at: '2024-01-09' },
        { field: 'Status', from: 'To Do', to: 'Done', at: '2024-01-12' }
      ]
    },
    {
      team: 'ALL',
      product: 'ALL',
      storyPoints: 3,
      epicLabels: ['2024_PI1_committed'],
      changelog: [
        { field: 'Sprint', from: '', to: '1', at: '2023-12-22' },
        { field: 'Sprint', from: '1', to: '2', at: '2024-01-09' },
        { field: 'Status', from: 'To Do', to: 'Done', at: '2024-01-13' }
      ]
    },
    {
      team: 'ALL',
      product: 'ALL',
      storyPoints: 2,
      epicLabels: ['2024_PI2_committed'],
      resolutionDate: '2024-01-13',
      changelog: [
        { field: 'Sprint', from: '', to: '2', at: '2023-12-30' },
        { field: 'Status', from: 'To Do', to: 'In Progress', at: '2024-01-10' }
      ]
    }
  ];

  const piBuckets = [
    { labelTop: 'S1', labelBottom: '', sprintIds: [1] },
    { labelTop: 'S2', labelBottom: '', sprintIds: [2] }
  ];

  const series = computeBucketSeries({
    team: 'ALL',
    product: 'ALL',
    sprints,
    issues,
    piBuckets
  });

  assert.deepStrictEqual(series.plannedPi, [16, 2]);
  assert.deepStrictEqual(series.plannedNonPi, [0, 0]);
  assert.deepStrictEqual(series.completedPi, [5, 10]);
  assert.deepStrictEqual(series.completedNonPi, [0, 3]);
  console.log('piPlanVsCompleteChart tests passed');
})();
