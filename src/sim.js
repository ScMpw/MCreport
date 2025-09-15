const logger = require('./logger');

function weekStart(dt) {
  logger.debug('weekStart input', dt);
  const d = new Date(dt);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  logger.debug('weekStart output', d);
  return d;
}

function calculateWeeklyThroughput(issues, current=new Date()) {
  logger.debug('calculateWeeklyThroughput start', { count: issues.length, current });
  const counts = new Array(12).fill(0);
  const lastCompletedWeekStart = weekStart(current); // start of current week
  lastCompletedWeekStart.setDate(lastCompletedWeekStart.getDate() - 7); // shift to last full week
  issues.forEach(it => {
    const dateStr = it.resolutiondate;
    if (!dateStr) return;
    const w = weekStart(dateStr);
    const diff = Math.floor((lastCompletedWeekStart - w) / (7*24*60*60*1000));
    if (diff >= 0 && diff < 12) counts[11 - diff]++;
  });
  logger.debug('calculateWeeklyThroughput result', counts);
  return counts;
}

function monteCarloSprints(backlogPts, throughput, allocation=100, runs=1000) {
  logger.debug('monteCarloSprints start', { backlogPts, throughput, allocation, runs });
  const allocTPs = throughput.map(v => v * allocation / 100);
  const res = [];
  for (let i = 0; i < runs; i++) {
    let b = backlogPts, s = 0;
    while (b > 0 && s < 100) {
      let v = allocTPs[Math.floor(Math.random() * allocTPs.length)];
      if (v < 1) v = 1;
      b -= v; s++;
    }
    res.push(s);
  }
  res.sort((a,b) => a - b);
  logger.debug('monteCarloSprints result', res);
  return res;
}

module.exports = { weekStart, calculateWeeklyThroughput, monteCarloSprints };
