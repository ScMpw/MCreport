(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Kpis = factory();
  }
}(this, function () {
  'use strict';

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  /**
   * Filters an array to only valid finite numbers.
   * @param {Array} values - Input values.
   * @returns {number[]} Only the valid numeric entries.
   */
  function validNumbers(values) {
    return (values || []).filter(v => typeof v === 'number' && !isNaN(v));
  }

  /**
   * Calculates the arithmetic mean (average velocity) of an array of numbers.
   * Non-numeric and NaN entries are silently excluded.
   * @param {number[]} [values=[]] - Numeric values (e.g. story points per sprint).
   * @returns {number} The mean, or 0 if no valid numbers are provided.
   */
  function calculateVelocity(values = []) {
    const nums = validNumbers(values);
    if (!nums.length) return 0;
    const sum = nums.reduce((a, b) => a + b, 0);
    return sum / nums.length;
  }

  /**
   * Calculates the **population** standard deviation of an array of numbers.
   *
   * Population stddev (divides by N) is used intentionally rather than sample
   * stddev (N-1) because the input typically represents the complete set of
   * sprint velocities for the team, not a sample drawn from a larger population.
   *
   * @param {number[]} [values=[]] - Numeric values.
   * @param {number} [mean] - Pre-calculated mean. If omitted, it is computed
   *   from the provided values.
   * @returns {number} The population standard deviation, or 0 if no valid
   *   numbers are provided.
   */
  function calculateStdDev(values = [], mean) {
    const nums = validNumbers(values);
    if (!nums.length) return 0;
    const m = typeof mean === 'number' ? mean : calculateVelocity(nums);
    const variance = nums.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / nums.length;
    return Math.sqrt(variance);
  }

  /**
   * Counts fractional work days (Monday–Friday) between two dates.
   * Partial days are represented as fractions of 24 hours.
   * @param {Date|string|number} start - Start date/time.
   * @param {Date|string|number} end - End date/time.
   * @returns {number} Number of work days (may include fractions), or 0 if
   *   inputs are invalid or end <= start.
   */
  function calculateWorkDays(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    let total = 0;
    let cur = s;
    while (cur < e) {
      const next = new Date(cur);
      next.setHours(24, 0, 0, 0);
      const dayEnd = next < e ? next : e;
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        total += (dayEnd - cur) / MS_PER_DAY;
      }
      cur = next;
    }
    return total;
  }

  return { calculateVelocity, calculateStdDev, calculateWorkDays };
}));
