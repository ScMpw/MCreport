(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PiLabel = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  function isPiRelevant(epicLabels = []) {
    if (!Array.isArray(epicLabels) || epicLabels.length === 0) return false;
    const regex = /^\d{4}_PI\d+_committed$/i;
    return epicLabels.some(label => regex.test(label));
  }
  return { isPiRelevant };
}));

