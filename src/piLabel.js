function isPiRelevant(epicLabels = []) {
  if (!Array.isArray(epicLabels) || epicLabels.length === 0) return false;
  const regex = /^\d{4}_PI\d+_committed$/i;
  return epicLabels.some(label => regex.test(label));
}

module.exports = { isPiRelevant };
