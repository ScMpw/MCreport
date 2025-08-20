export function isPiCommitted(epicLabels = [], template = 'YEAR_PIX_committed') {
  if (!Array.isArray(epicLabels) || epicLabels.length === 0) return false;
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('^' + escaped
    .replace('YEAR', '(\\\d{4})')
    .replace('PIX', 'PI(\\\d+)') + '$', 'i');
  const mainDriverRegex = /^main[-_ ]?driver$/i;
  return epicLabels.some(l => regex.test(l) || mainDriverRegex.test(l));
}

function extractPiId(epicLabels = [], template = 'YEAR_PIX_committed') {
  if (!Array.isArray(epicLabels) || epicLabels.length === 0) return null;
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('^' + escaped
    .replace('YEAR', '(\\\d{4})')
    .replace('PIX', 'PI(\\\d+)') + '$', 'i');
  for (const l of epicLabels) {
    const m = l.match(regex);
    if (m) {
      return `${m[1]}-PI${m[2]}`;
    }
  }
  return null;
}

function sprintPiId(name = '') {
  if (typeof name !== 'string') return null;
  let m = name.match(/(\d{4}).*PI\s*(\d+)/i);
  if (m) {
    return `${m[1]}-PI${m[2]}`;
  }
  m = name.match(/PI\s*(\d+)/i);
  if (m) {
    return `PI${m[1]}`;
  }
  return null;
}

// Extracts a numeric sprint id from various formats (e.g. "123", "Sprint 123",
// "[123]"). Returns `undefined` if no digits are found.
function normalizeSprintId(id) {
  const match = String(id ?? '').match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function getSprintAt(timeline = [], time) {
  let current = null;
  for (const entry of timeline) {
    if (entry.at <= time) {
      current = entry.sprintId;
    } else {
      break;
    }
  }
  return current;
}

export function computeBucketSeries({ team, product, sprints = [], issues = [], piBuckets = [], piLabelTemplate = 'YEAR_PIX_committed', piCheck } = {}) {
  const sprintMap = new Map();
  sprints.forEach(s => sprintMap.set(s.id, s));
  const metrics = new Map();
  sprints.forEach(s => {
    metrics.set(s.id, { plannedPi: 0, plannedNonPi: 0, completedPi: 0, completedNonPi: 0 });
  });

  const filtered = (issues || []).filter(i => i.team === team && i.product === product);

  // For each issue print its key, its parent (typically an epic) and all
  // labels retrieved for that parent. This mirrors the behaviour in other
  // MCreport variants and helps verify which labels were associated with each
  // story's parent.
  filtered.forEach(issue => {
    const issueKey = issue.key || '';
    const parentKey = issue.parentKey || issue.epicKey || (issue.parent && issue.parent.key) || '';
    const labels = Array.isArray(issue.parentLabels)
      ? issue.parentLabels
      : (Array.isArray(issue.epicLabels) ? issue.epicLabels : []);
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(`${issueKey} - ${parentKey} - [${labels.join(', ')}]`);
    }
  });

  const checkFn = typeof piCheck === 'function' ? piCheck : isPiCommitted;

  const processed = filtered.map(issue => {
    const sprintChanges = [];
    (issue.changelog || [])
      .filter(c => c.field === 'Sprint')
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .forEach(c => {
        const at = new Date(c.at);
        const fromId = normalizeSprintId(c.from);
        const toId = normalizeSprintId(c.to);
        if (fromId !== undefined) {
          sprintChanges.push({ at: new Date(at.getTime() - 1), sprintId: fromId });
        }
        if (toId !== undefined) {
          sprintChanges.push({ at, sprintId: toId });
        }
      });
    const statusChanges = (issue.changelog || [])
      .filter(c => c.field === 'Status')
      .sort((a, b) => new Date(a.at) - new Date(b.at));
    const doneEntry = statusChanges.find(c => /(done|closed|resolved)/i.test(c.to));
    const completion = doneEntry
      ? new Date(doneEntry.at)
      : (issue.resolutionDate ? new Date(issue.resolutionDate) : null);
    const labels = Array.isArray(issue.parentLabels)
      ? issue.parentLabels
      : (Array.isArray(issue.epicLabels) ? issue.epicLabels : []);
    return {
      isPi: checkFn(labels, piLabelTemplate),
      piId: extractPiId(labels, piLabelTemplate),
      storyPoints: issue.storyPoints || 0,
      sprintTimeline: sprintChanges,
      completionTime: completion
    };
  });

  sprints.forEach(sprint => {
    const start = new Date(sprint.start);
    const end = new Date(sprint.end);
    end.setHours(23, 59, 59, 999);
    const sprintPi = sprintPiId(sprint.name);
    processed.forEach(issue => {
      const plannedSprint = normalizeSprintId(getSprintAt(issue.sprintTimeline, start));
      if (plannedSprint === normalizeSprintId(sprint.id)) {
        const isPiForSprint = issue.isPi && (!issue.piId || !sprintPi || issue.piId === sprintPi);
        const key = isPiForSprint ? 'plannedPi' : 'plannedNonPi';
        metrics.get(sprint.id)[key] += issue.storyPoints;
      }
      if (issue.completionTime && issue.completionTime <= end) {
        const compSprint = normalizeSprintId(getSprintAt(issue.sprintTimeline, issue.completionTime));
        if (compSprint === normalizeSprintId(sprint.id)) {
          const isPiForSprint = issue.isPi && (!issue.piId || !sprintPi || issue.piId === sprintPi);
          const key = isPiForSprint ? 'completedPi' : 'completedNonPi';
          metrics.get(sprint.id)[key] += issue.storyPoints;
        }
      }
    });
  });

  const series = {
    labels: [],
    plannedPi: [],
    plannedNonPi: [],
    completedPi: [],
    completedNonPi: [],
    plannedTotals: [],
    completedTotals: []
  };

  (piBuckets || []).forEach(bucket => {
    let pPi = 0, pNonPi = 0, cPi = 0, cNonPi = 0;
    (bucket.sprintIds || []).forEach(id => {
      const m = metrics.get(id);
      if (m) {
        pPi += m.plannedPi;
        pNonPi += m.plannedNonPi;
        cPi += m.completedPi;
        cNonPi += m.completedNonPi;
      }
    });
    series.labels.push(`${bucket.labelTop}\n${bucket.labelBottom}`);
    series.plannedPi.push(pPi);
    series.plannedNonPi.push(pNonPi);
    series.completedPi.push(cPi);
    series.completedNonPi.push(cNonPi);
    series.plannedTotals.push(pPi + pNonPi);
    series.completedTotals.push(cPi + cNonPi);
  });
  return series;
}

function createHatch(color, bg) {
  const size = 6;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,size,size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.stroke();
  return ctx.createPattern(canvas, 'repeat');
}

export function renderPiPlanVsCompleteChart({ canvasId, team, product, sprints = [], issues = [], piBuckets = [], piLabelTemplate = 'YEAR_PIX_committed', piCheck } = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `Planned vs Completed story points for team ${team} product ${product}`);
  if (canvas._chart) {
    canvas._chart.destroy();
  }

  const series = computeBucketSeries({ team, product, sprints, issues, piBuckets, piLabelTemplate, piCheck });

  const blue = '#0EA5E9';
  const blueBorder = '#0284C7';
  const green = '#22C55E';
  const greenBorder = '#16A34A';

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: series.labels,
      datasets: [
        {
          label: 'Initially Planned PI contributions',
          data: series.plannedPi,
          backgroundColor: blue,
          borderColor: blueBorder,
          stack: 'planned',
          borderWidth: 1,
          borderRadius: 6,
          order: 1
        },
        {
          label: '',
          data: series.plannedNonPi,
          backgroundColor: createHatch(blueBorder, 'rgba(14,165,233,0.7)'),
          borderColor: blueBorder,
          stack: 'planned',
          borderWidth: 1,
          borderRadius: 6,
          order: 1,
          datalabels: {
            anchor: 'end',
            align: 'start',
            offset: -4,
            color: '#000',
            font: { weight: 'bold' },
            formatter: (v, ctx) => series.plannedTotals[ctx.dataIndex]
          }
        },
        {
          label: '',
          data: series.completedNonPi.map(v => -v),
          backgroundColor: createHatch(greenBorder, 'rgba(34,197,94,0.7)'),
          borderColor: greenBorder,
          stack: 'completed',
          borderWidth: 1,
          borderRadius: 6,
          order: 1,
          datalabels: {
            anchor: 'start',
            align: 'end',
            offset: -4,
            color: '#000',
            font: { weight: 'bold' },
            formatter: (v, ctx) => series.completedTotals[ctx.dataIndex]
          }
        },
        {
          label: 'Completed PI contributions',
          data: series.completedPi.map(v => -v),
          backgroundColor: green,
          borderColor: greenBorder,
          stack: 'completed',
          borderWidth: 1,
          borderRadius: 6,
          order: 1
        },
        {
          type: 'line',
          label: 'Initially Planned',
          data: series.plannedTotals,
          borderColor: blue,
          backgroundColor: blue,
          tension: 0.3,
          fill: false,
          order: 2,
          datalabels: { display: false }
        },
        {
          type: 'line',
          label: 'Completed',
          data: series.completedTotals.map(v => -v),
          borderColor: green,
          backgroundColor: green,
          tension: 0.3,
          fill: false,
          order: 2,
          datalabels: { display: false }
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true,
          ticks: { font: { size: 12 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Story Points'
          },
          grid: {
            color: '#e5e7eb'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            filter: item => item.text
          }
        },
        datalabels: {
          clamp: true
        },
        tooltip: {
          callbacks: {
            label: () => '',
            afterBody: ctx => {
              const i = ctx[0].dataIndex;
              const dataset = ctx[0].dataset || {};
              const label = dataset.label || '';
              // Determine which group to show based on the hovered dataset
              const isPlanned = dataset.stack === 'planned' || /Initially Planned/i.test(label);
              const isCompleted = dataset.stack === 'completed' || /Completed/i.test(label);
              const lines = [];
              if (isPlanned) {
                if (/PI contributions/i.test(label)) {
                  lines.push(`Planned PI: ${series.plannedPi[i]}`);
                } else if (dataset.stack === 'planned') {
                  lines.push(`Planned non-PI: ${series.plannedNonPi[i]}`);
                }
                lines.push(`Planned total: ${series.plannedTotals[i]}`);
              } else if (isCompleted) {
                if (/PI contributions/i.test(label)) {
                  lines.push(`Completed PI: ${series.completedPi[i]}`);
                } else if (dataset.stack === 'completed') {
                  lines.push(`Completed non-PI: ${series.completedNonPi[i]}`);
                }
                lines.push(`Completed total: ${series.completedTotals[i]}`);
              }
              return lines;
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  canvas._chart = chart;
  return chart;
}
