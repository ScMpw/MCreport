function weekStart(dt) {
  const d = new Date(dt);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}

function calculateWeeklyThroughput(issues, current=new Date()) {
  const counts = new Array(12).fill(0);
  const currentWeek = weekStart(current);
  issues.forEach(it => {
    const dateStr = it.resolutiondate;
    if (!dateStr) return;
    const w = weekStart(dateStr);
    const diff = Math.floor((currentWeek - w) / (7*24*60*60*1000));
    if (diff >= 0 && diff < 12) counts[11 - diff]++;
  });
  return counts;
}

function monteCarloSprints(backlogPts, throughput, allocation=100, runs=1000) {
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
  return res;
}

module.exports = { weekStart, calculateWeeklyThroughput, monteCarloSprints };
