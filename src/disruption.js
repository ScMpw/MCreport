(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Disruption = factory();
  }
}(this, function () {
  function calculateDisruptionMetrics(events = []) {
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
      if (ev.addedAfterStart) {
        metrics.pulledIn += pts;
        metrics.pulledInCount += 1;
        metrics.pulledInIssues.push(ev.key);
      }
      if (ev.blocked) {
        metrics.blocked += pts;
        metrics.blockedCount += 1;
        metrics.blockedIssues.push(ev.key);
      }
      if (ev.typeChanged) {
        metrics.typeChanged += pts;
        metrics.typeChangedCount += 1;
        metrics.typeChangedIssues.push(ev.key);
      }
      if (ev.movedOut) {
        metrics.movedOut += pts;
        metrics.movedOutCount += 1;
        metrics.movedOutIssues.push(ev.key);
      }
    });
    return metrics;
  }
  return { calculateDisruptionMetrics };
}));
