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
      pulledIn: 0, // total story points
      pulledInCount: 0,
      blocked: 0,
      blockedCount: 0,
      typeChanged: 0,
      typeChangedCount: 0,
      movedOut: 0,
      movedOutCount: 0,
      pulledInIssues: [],
      blockedIssues: [],
      typeChangedIssues: [],
      movedOutIssues: []
    };

    events.forEach(ev => {
      const pts = ev.points || 0;
      logger.debug('Processing event', ev);

      if (ev.addedAfterStart) {
        metrics.pulledIn += pts;
        metrics.pulledInIssues.push(ev.key);
      }

      if (ev.blocked) {
        metrics.blocked += pts;
        metrics.blockedIssues.push(ev.key);
      }

      if (ev.typeChanged) {
        metrics.typeChanged += pts;
        metrics.typeChangedIssues.push(ev.key);
      }

      if (ev.movedOut) {
        metrics.movedOut += pts;
        metrics.movedOutIssues.push(ev.key);
      }
    });

    // Derive counts from the collected issue lists to avoid undefined values
    metrics.pulledInCount = metrics.pulledInIssues.length;
    metrics.blockedCount = metrics.blockedIssues.length;
    metrics.typeChangedCount = metrics.typeChangedIssues.length;
    metrics.movedOutCount = metrics.movedOutIssues.length;

    logger.debug('Calculated metrics', metrics);
    return metrics;
  }
  return { calculateDisruptionMetrics };
}));
