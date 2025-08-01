function isoWeekNumber(dt) {
  const d = new Date(dt);
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function filterIssues(issues, { team, product, project } = {}) {
  return issues.filter(it => {
    if (team && it.team !== team) return false;
    if (product && it.product !== product) return false;
    if (project && it.project !== project) return false;
    return true;
  });
}

function calculateMetrics(issues) {
  if (!issues.length) return { averageCycleTime: 0, throughputPerWeek: {}, velocityPerWeek: {} };
  let totalCycle = 0;
  const throughput = {};
  const velocity = {};
  for (const it of issues) {
    const created = new Date(it.created);
    const resolved = new Date(it.resolved);
    const diff = (resolved - created) / 86400000;
    totalCycle += diff;
    const week = isoWeekNumber(resolved);
    throughput[week] = (throughput[week] || 0) + 1;
    velocity[week] = (velocity[week] || 0) + (it.points || 0);
  }
  return {
    averageCycleTime: totalCycle / issues.length,
    throughputPerWeek: throughput,
    velocityPerWeek: velocity
  };
}

function printReport(metrics) {
  console.log(`Average Cycle Time: ${metrics.averageCycleTime.toFixed(2)} days`);
  console.log('Throughput Per Week:');
  for (const [week, count] of Object.entries(metrics.throughputPerWeek)) {
    console.log(`  ${week}: ${count}`);
  }
  console.log('Velocity Per Week:');
  for (const [week, pts] of Object.entries(metrics.velocityPerWeek)) {
    console.log(`  ${week}: ${pts}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error('Usage: node src/overview.js <issues.json> [--team TEAM] [--product PRODUCT] [--project PROJECT]');
    process.exit(1);
  }
  const data = JSON.parse(require('fs').readFileSync(args[0], 'utf8'));
  let opts = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (key === '--team') opts.team = val;
    else if (key === '--product') opts.product = val;
    else if (key === '--project') opts.project = val;
  }
  const filtered = filterIssues(data, opts);
  const metrics = calculateMetrics(filtered);
  printReport(metrics);
}

module.exports = { isoWeekNumber, filterIssues, calculateMetrics };
