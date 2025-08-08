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
      typeChanged: 0,
      movedOut: 0,
      pulledInIssues: new Set(),
      blockedIssues: new Set(),
      typeChangedIssues: new Set(),
      movedOutIssues: new Set(),
      pulledInCount: 0,
      blockedCount: 0,
      typeChangedCount: 0,
      movedOutCount: 0
    };

    // Deduplicate events by issue key to avoid double counting
    const uniq = new Map();
    (events || []).forEach(ev => {
      if (ev && ev.key && !uniq.has(ev.key)) {
        uniq.set(ev.key, ev);
      }
    });

    uniq.forEach(ev => {
      const pts = ev.points || 0;
      const completedPts = ev.completed ? pts : 0;
      logger.debug('Processing event', ev);

      if (ev.addedAfterStart) {
        metrics.pulledIn += pts;
        metrics.pulledInIssues.add(ev.key);
      }

      if (ev.blockedDays && ev.blockedDays > 0) {
        metrics.blockedDays += ev.blockedDays;
        metrics.blockedIssues.add(ev.key);
      }

      if (ev.typeChanged) {
        metrics.typeChanged += completedPts;
        metrics.typeChangedIssues.add(ev.key);
      }

      if (ev.movedOut) {
        metrics.movedOut += completedPts;
        metrics.movedOutIssues.add(ev.key);
      }
    });

    metrics.pulledInCount = metrics.pulledInIssues.size;
    metrics.blockedCount = metrics.blockedIssues.size;
    metrics.typeChangedCount = metrics.typeChangedIssues.size;
    metrics.movedOutCount = metrics.movedOutIssues.size;

    // Convert sets back to arrays for downstream consumers
    metrics.pulledInIssues = Array.from(metrics.pulledInIssues);
    metrics.blockedIssues = Array.from(metrics.blockedIssues);
    metrics.typeChangedIssues = Array.from(metrics.typeChangedIssues);
    metrics.movedOutIssues = Array.from(metrics.movedOutIssues);

    logger.debug('Calculated metrics', metrics);
    return metrics;
  }
  return { calculateDisruptionMetrics };
}));
