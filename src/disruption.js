(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Disruption = factory();
  }
}(this, function () {
  const getGlobal = () => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof window !== 'undefined') return window;
    if (typeof self !== 'undefined') return self;
    return {};
  };
  const logger = (typeof require === 'function' && typeof module === 'object' && module.exports)
    ? require('./logger')
    : (getGlobal().Logger || { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} });

  function calculateDisruptionMetrics(events = []) {
    logger.debug('calculateDisruptionMetrics called with events', events);

    const metrics = {
      pulledIn: 0,
      blockedDays: 0,
      movedOut: 0,
      spillover: 0,
      pulledInIssues: new Set(),
      blockedIssues: new Set(),
      movedOutIssues: new Set(),
      spilloverIssues: new Set(),
      spilloverPulledInIssues: new Set(),
      pulledInCount: 0,
      blockedCount: 0,
      movedOutCount: 0,
      spilloverCount: 0,
      spilloverPulledInCount: 0
    };

    // Track which categories each issue has already contributed to so the same
    // issue can be counted in multiple disruption categories without double
    // counting a single category twice.
    const seen = new Map();

    (events || []).forEach(ev => {
      if (!ev || !ev.key) return;

      const pts = ev.points || 0;
      let rec = seen.get(ev.key);
      if (!rec) {
        rec = {};
        seen.set(ev.key, rec);
      }

      logger.debug('Processing event', ev);

      // Track latest known information about each issue for spillover detection
      rec.points = ev.points || rec.points || 0;
      if (ev.completed) rec.completed = true;
      if (ev.movedOut && !ev.removedBeforeStart) rec.movedOut = true;

      if (ev.addedAfterStart && !rec.pulledIn) {
        metrics.pulledIn += pts;
        metrics.pulledInIssues.add(ev.key);
        rec.pulledIn = true;
      }

      if (ev.blockedDays && ev.blockedDays > 0 && !rec.blocked) {
        metrics.blockedDays += ev.blockedDays;
        metrics.blockedIssues.add(ev.key);
        rec.blocked = true;
      }

      if (ev.movedOut && !ev.removedBeforeStart && !rec.movedOutCounted) {
        metrics.movedOut += pts;
        metrics.movedOutIssues.add(ev.key);
        rec.movedOutCounted = true;
      }
    });

    // After processing all events determine spillover issues
    seen.forEach((rec, key) => {
      if (!rec.completed && !rec.movedOut) {
        metrics.spillover += rec.points || 0;
        metrics.spilloverIssues.add(key);
      }
    });

    // Determine issues that were both pulled in and ended up as spillovers
    metrics.spilloverIssues.forEach(key => {
      if (metrics.pulledInIssues.has(key)) {
        metrics.spilloverPulledInIssues.add(key);
      }
    });

    metrics.pulledInCount = metrics.pulledInIssues.size;
    metrics.blockedCount = metrics.blockedIssues.size;
    metrics.movedOutCount = metrics.movedOutIssues.size;
    metrics.spilloverCount = metrics.spilloverIssues.size;
    metrics.spilloverPulledInCount = metrics.spilloverPulledInIssues.size;

    // Convert sets back to arrays for downstream consumers
    metrics.pulledInIssues = Array.from(metrics.pulledInIssues);
    metrics.blockedIssues = Array.from(metrics.blockedIssues);
    metrics.movedOutIssues = Array.from(metrics.movedOutIssues);
    metrics.spilloverIssues = Array.from(metrics.spilloverIssues);
    metrics.spilloverPulledInIssues = Array.from(metrics.spilloverPulledInIssues);

    logger.debug('Calculated metrics', metrics);
    return metrics;
  }
  return { calculateDisruptionMetrics };
}));
