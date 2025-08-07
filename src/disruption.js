(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Disruption = factory();
  }
}(this, function () {
  function calculateDisruptionMetrics(events = []) {
    const metrics = {
      pulledIn: 0,
      blocked: 0,
      typeChanged: 0,
      movedOut: 0,
      pulledInIssues: [],
      blockedIssues: [],
      typeChangedIssues: [],
      movedOutIssues: []
    };
    events.forEach(ev => {
      if (ev.addedAfterStart) {
        metrics.pulledIn += 1;
        metrics.pulledInIssues.push(ev.key);
      }
      if (ev.blocked) {
        metrics.blocked += 1;
        metrics.blockedIssues.push(ev.key);
      }
      if (ev.typeChanged) {
        metrics.typeChanged += 1;
        metrics.typeChangedIssues.push(ev.key);
      }
      if (ev.movedOut) {
        metrics.movedOut += 1;
        metrics.movedOutIssues.push(ev.key);
      }
    });
    return metrics;
  }
  return { calculateDisruptionMetrics };
}));
