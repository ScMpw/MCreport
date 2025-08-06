function countDisruptions(issue, sprintStart) {
  const start = new Date(sprintStart);
  const details = { pulled: new Set(), blocked: new Set(), moved: new Set(), typeChanged: new Set() };
  const events = issue.changelog || [];
  for (const ev of events) {
    const when = new Date(ev.created);
    if (when < start) continue;
    const field = ev.field && ev.field.toLowerCase();
    if (field === 'sprint') {
      const from = ev.from || '';
      const to = ev.to || '';
      if (!from && to) {
        if (issue.key) details.pulled.add(issue.key);
      } else if ((from && !to) || (from && to && from !== to)) {
        if (issue.key) details.moved.add(issue.key);
      }
    } else if (field === 'status' && ev.to && ev.to.toLowerCase() === 'blocked') {
      if (issue.key) details.blocked.add(issue.key);
    } else if (field === 'issuetype' && ev.from !== ev.to) {
      if (issue.key) details.typeChanged.add(issue.key);
    }
  }
  return {
    pulled: details.pulled.size,
    blocked: details.blocked.size,
    moved: details.moved.size,
    typeChanged: details.typeChanged.size,
    details: {
      pulled: Array.from(details.pulled),
      blocked: Array.from(details.blocked),
      moved: Array.from(details.moved),
      typeChanged: Array.from(details.typeChanged)
    }
  };
}

function aggregateDisruptions(issues, sprintStart) {
  const totals = {
    pulled: new Set(),
    blocked: new Set(),
    moved: new Set(),
    typeChanged: new Set()
  };
  for (const it of issues) {
    const res = countDisruptions(it, sprintStart);
    res.details.pulled.forEach(k => totals.pulled.add(k));
    res.details.blocked.forEach(k => totals.blocked.add(k));
    res.details.moved.forEach(k => totals.moved.add(k));
    res.details.typeChanged.forEach(k => totals.typeChanged.add(k));
  }
  return {
    pulled: totals.pulled.size,
    blocked: totals.blocked.size,
    moved: totals.moved.size,
    typeChanged: totals.typeChanged.size,
    details: {
      pulled: Array.from(totals.pulled),
      blocked: Array.from(totals.blocked),
      moved: Array.from(totals.moved),
      typeChanged: Array.from(totals.typeChanged)
    }
  };
}

// Expose functions for both Node (CommonJS) and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { countDisruptions, aggregateDisruptions };
} else {
  // eslint-disable-next-line no-undef
  window.countDisruptions = countDisruptions;
  // eslint-disable-next-line no-undef
  window.aggregateDisruptions = aggregateDisruptions;
}
