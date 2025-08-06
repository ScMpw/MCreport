function countDisruptions(issue, sprintStart) {
  const start = new Date(sprintStart);
  let pulled = 0, blocked = 0, moved = 0, typeChanged = 0;
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
        pulled++;
        if (issue.key) details.pulled.add(issue.key);
      } else if (from && !to) {
        moved++;
        if (issue.key) details.moved.add(issue.key);
      } else if (from && to && from !== to) {
        moved++;
        if (issue.key) details.moved.add(issue.key);
      }
    } else if (field === 'status' && ev.to && ev.to.toLowerCase() === 'blocked') {
      blocked++;
      if (issue.key) details.blocked.add(issue.key);
    } else if (field === 'issuetype' && ev.from !== ev.to) {
      typeChanged++;
      if (issue.key) details.typeChanged.add(issue.key);
    }
  }
  return {
    pulled,
    blocked,
    moved,
    typeChanged,
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
    pulled: 0,
    blocked: 0,
    moved: 0,
    typeChanged: 0,
    details: {
      pulled: new Set(),
      blocked: new Set(),
      moved: new Set(),
      typeChanged: new Set()
    }
  };
  for (const it of issues) {
    const res = countDisruptions(it, sprintStart);
    totals.pulled += res.pulled;
    totals.blocked += res.blocked;
    totals.moved += res.moved;
    totals.typeChanged += res.typeChanged;
    if (res.details) {
      if (res.details.pulled) res.details.pulled.forEach(k => totals.details.pulled.add(k));
      if (res.details.blocked) res.details.blocked.forEach(k => totals.details.blocked.add(k));
      if (res.details.moved) res.details.moved.forEach(k => totals.details.moved.add(k));
      if (res.details.typeChanged) res.details.typeChanged.forEach(k => totals.details.typeChanged.add(k));
    }
  }
  return {
    pulled: totals.pulled,
    blocked: totals.blocked,
    moved: totals.moved,
    typeChanged: totals.typeChanged,
    details: {
      pulled: Array.from(totals.details.pulled),
      blocked: Array.from(totals.details.blocked),
      moved: Array.from(totals.details.moved),
      typeChanged: Array.from(totals.details.typeChanged)
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
