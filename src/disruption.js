function countDisruptions(issue, sprintStart) {
  const start = new Date(sprintStart);
  let pulled = 0, blocked = 0, moved = 0, typeChanged = 0;
  const events = issue.changelog || [];
  for (const ev of events) {
    const when = new Date(ev.created);
    if (when < start) continue;
    const field = ev.field && ev.field.toLowerCase();
    if (field === 'sprint') {
      const from = ev.from || '';
      const to = ev.to || '';
      if (!from && to) pulled++;
      else if (from && !to) moved++;
      else if (from && to && from !== to) moved++;
    } else if (field === 'status' && ev.to && ev.to.toLowerCase() === 'blocked') {
      blocked++;
    } else if (field === 'issuetype' && ev.from !== ev.to) {
      typeChanged++;
    }
  }
  return { pulled, blocked, moved, typeChanged };
}

function aggregateDisruptions(issues, sprintStart) {
  const totals = { pulled: 0, blocked: 0, moved: 0, typeChanged: 0 };
  for (const it of issues) {
    const res = countDisruptions(it, sprintStart);
    totals.pulled += res.pulled;
    totals.blocked += res.blocked;
    totals.moved += res.moved;
    totals.typeChanged += res.typeChanged;
  }
  return totals;
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
