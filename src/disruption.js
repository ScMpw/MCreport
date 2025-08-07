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
      movedOut: 0
    };
    events.forEach(ev => {
      if (ev.addedAfterStart) metrics.pulledIn += 1;
      if (ev.blocked) metrics.blocked += 1;
      if (ev.typeChanged) metrics.typeChanged += 1;
      if (ev.movedOut) metrics.movedOut += 1;
    });
    return metrics;
  }
  return { calculateDisruptionMetrics };
}));
