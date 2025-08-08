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

  return { calculateVelocity, calculateStdDev };
}));
