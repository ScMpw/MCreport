(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Kpis = factory();
  }
}(this, function () {
  function calculateVelocity(values = []) {
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (!nums.length) return 0;
    const sum = nums.reduce((a, b) => a + b, 0);
    return sum / nums.length;
  }

  function calculateStdDev(values = [], mean) {
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (!nums.length) return 0;
    const m = typeof mean === 'number' ? mean : calculateVelocity(nums);
    const variance = nums.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / nums.length;
    return Math.sqrt(variance);
  }

  function calculateWorkDays(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    const msPerDay = 24 * 60 * 60 * 1000;
    let total = 0;
    let cur = s;
    while (cur < e) {
      const next = new Date(cur);
      next.setHours(24, 0, 0, 0);
      const dayEnd = next < e ? next : e;
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        total += (dayEnd - cur) / msPerDay;
      }
      cur = next;
    }
    return total;
  }

  return { calculateVelocity, calculateStdDev, calculateWorkDays };
}));
