const logger = require('./logger');

/** Number of recent weeks used for throughput sampling. */
const THROUGHPUT_WEEKS = 12;

/** Upper bound on simulated sprints to prevent infinite loops. */
const MAX_SPRINT_ITERATIONS = 100;

/** Default number of Monte Carlo simulation runs. */
const DEFAULT_SIMULATION_RUNS = 1000;

/** Minimum effective throughput per sprint to avoid infinite loops. */
const MIN_THROUGHPUT = 1;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the Monday 00:00 of the ISO week containing the given date.
 * @param {Date|string|number} dt - The date to evaluate.
 * @returns {Date} The Monday at midnight for that week.
 */
function weekStart(dt) {
  logger.debug('weekStart input', dt);
  const d = new Date(dt);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  logger.debug('weekStart output', d);
  return d;
}

/**
 * Tallies resolved issues into weekly buckets covering the most recent
 * {@link THROUGHPUT_WEEKS} weeks.
 * @param {Array<{resolutiondate?: string}>} issues - Resolved issues.
 * @param {Date} [current=new Date()] - Reference date for "now".
 * @returns {number[]} Array of length {@link THROUGHPUT_WEEKS} with counts
 *   ordered oldest → newest.
 */
function calculateWeeklyThroughput(issues, current = new Date()) {
  logger.debug('calculateWeeklyThroughput start', { count: issues.length, current });
  const counts = new Array(THROUGHPUT_WEEKS).fill(0);
  const currentWeek = weekStart(current);
  issues.forEach(it => {
    const dateStr = it.resolutiondate;
    if (!dateStr) return;
    const w = weekStart(dateStr);
    const diff = Math.floor((currentWeek - w) / MS_PER_WEEK);
    if (diff >= 0 && diff < THROUGHPUT_WEEKS) counts[THROUGHPUT_WEEKS - 1 - diff]++;
  });
  logger.debug('calculateWeeklyThroughput result', counts);
  return counts;
}

/**
 * Runs a Monte Carlo simulation to estimate how many sprints are needed
 * to complete a backlog.
 *
 * Each run randomly samples from historical throughput values (adjusted by
 * the allocation percentage) and counts sprints until the backlog reaches
 * zero or {@link MAX_SPRINT_ITERATIONS} is hit.
 *
 * @param {number} backlogPts - Total remaining story points / issue count.
 * @param {number[]} throughput - Historical throughput values to sample from.
 * @param {number} [allocation=100] - Percentage of throughput allocated (0-100).
 * @param {number} [runs=DEFAULT_SIMULATION_RUNS] - Number of simulation runs.
 * @returns {number[]} Sorted array of sprint counts (ascending), one per run.
 */
function monteCarloSprints(backlogPts, throughput, allocation = 100, runs = DEFAULT_SIMULATION_RUNS) {
  logger.debug('monteCarloSprints start', { backlogPts, throughput, allocation, runs });
  const allocTPs = throughput.map(v => v * allocation / 100);
  const res = [];
  for (let i = 0; i < runs; i++) {
    let remaining = backlogPts;
    let sprintCount = 0;
    while (remaining > 0 && sprintCount < MAX_SPRINT_ITERATIONS) {
      let sampled = allocTPs[Math.floor(Math.random() * allocTPs.length)];
      if (sampled < MIN_THROUGHPUT) sampled = MIN_THROUGHPUT;
      remaining -= sampled;
      sprintCount++;
    }
    res.push(sprintCount);
  }
  res.sort((a, b) => a - b);
  logger.debug('monteCarloSprints result', res);
  return res;
}

module.exports = {
  weekStart,
  calculateWeeklyThroughput,
  monteCarloSprints,
  THROUGHPUT_WEEKS,
  MAX_SPRINT_ITERATIONS,
  DEFAULT_SIMULATION_RUNS
};
