(function () {
  const DEFAULT_JIRA_DOMAIN = 'aldi-sued.atlassian.net';
  let jiraDomain = DEFAULT_JIRA_DOMAIN;
  let boardId = '';
  let sprints = [];

  const boardSelect = document.getElementById('boardSelect');
  const sprintSelect = document.getElementById('sprintSelect');
  const loadingEl = document.getElementById('loadingMessage');
  const domainInput = document.getElementById('jiraDomain');
  const statusTable = document.getElementById('statusDurationTable');
  const completionTable = document.getElementById('completionRateTable');
  const issueTableBody = document.getElementById('issueDetailsBody');
  const metaSummary = document.getElementById('metaSummary');
  const focusStatusEl = document.getElementById('focusStatuses');
  const statusDurationChartEl = document.getElementById('statusDurationChart');
  const completionChartEl = document.getElementById('completionChart');
  let statusChart;
  let completionChart;

  initJiraDomain();

  function showLoading(message) {
    if (!loadingEl) return;
    loadingEl.style.display = 'block';
    loadingEl.textContent = message || 'Loading...';
  }

  function hideLoading() {
    if (!loadingEl) return;
    loadingEl.style.display = 'none';
    loadingEl.textContent = '';
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return '0d';
    const days = ms / (1000 * 60 * 60 * 24);
    if (days >= 1) return `${days.toFixed(1)}d`;
    const hours = ms / (1000 * 60 * 60);
    return `${hours.toFixed(1)}h`;
  }

  function getStoryPoints(issue = {}, sprintStart, fallbackPoints = null) {
    const fields = issue.fields || {};
    const candidates = [
      fields.customfield_10002,
      fields.storyPoints,
      fields.customfield_10016,
      fields.customfield_10026,
      fields.customfield_10106
    ];
    let value = candidates
      .map(v => (typeof v === 'string' ? Number(v) : v))
      .find(v => typeof v === 'number' && !isNaN(v));

    const histories = (issue.changelog && issue.changelog.histories) || [];
    if (histories.length) {
      const startDate = sprintStart ? new Date(sprintStart) : null;
      let initialPoints = typeof value === 'number' ? value : null;
      const sortedHist = histories.slice().sort((a, b) => new Date(a.created) - new Date(b.created));
      outer: for (const h of sortedHist) {
        const chDate = new Date(h.created);
        for (const item of h.items || []) {
          const fieldName = (item.field || '').toLowerCase();
          if (fieldName === 'story points' || fieldName === 'customfield_10002') {
            const toVal = Number(item.toString || item.to);
            const fromVal = Number(item.fromString || item.from);
            if (startDate && chDate <= startDate) {
              if (!isNaN(toVal)) initialPoints = toVal;
            } else if (startDate) {
              initialPoints = !isNaN(fromVal) ? fromVal : initialPoints;
              break outer;
            } else if (!isNaN(toVal)) {
              initialPoints = toVal;
            }
          }
        }
      }
      if (typeof initialPoints === 'number') value = initialPoints;
    }

    if (value === null || value === undefined) {
      value = fallbackPoints;
    }

    return typeof value === 'number' ? value : null;
  }

  function getStatusHistory(issue = {}) {
    const histories = (issue.changelog && issue.changelog.histories) || [];
    const statusChanges = [];
    histories.forEach(h => {
      const items = Array.isArray(h.items) ? h.items : [];
      const statusItem = items.find(i => (i.field || '').toLowerCase() === 'status');
      if (statusItem) {
        statusChanges.push({
          at: new Date(h.created),
          from: statusItem.fromString || statusItem.from,
          to: statusItem.toString || statusItem.to
        });
      }
    });
    statusChanges.sort((a, b) => a.at - b.at);
    return statusChanges;
  }

  function statusAtStart(issue, sprintStart) {
    const changes = getStatusHistory(issue);
    const start = sprintStart.getTime();
    let current = (issue.fields && issue.fields.status && issue.fields.status.name) || 'Unknown';
    changes.forEach(c => {
      if (c.at.getTime() <= start) {
        current = c.to || current;
      }
    });
    return current;
  }

  function calculateStatusDurations(issue, sprintStart, sprintEnd) {
    const start = sprintStart.getTime();
    const end = sprintEnd.getTime();
    const changes = getStatusHistory(issue);
    const durations = new Map();
    let currentStatus = statusAtStart(issue, sprintStart);
    let cursor = start;

    for (const change of changes) {
      const changeTime = change.at.getTime();
      if (changeTime < start) continue;
      if (changeTime > end) break;
      const elapsed = changeTime - cursor;
      durations.set(currentStatus, (durations.get(currentStatus) || 0) + elapsed);
      currentStatus = change.to || currentStatus;
      cursor = changeTime;
    }

    if (cursor < end) {
      durations.set(currentStatus, (durations.get(currentStatus) || 0) + (end - cursor));
    }

    return durations;
  }

  function isDone(issue = {}, sprintEnd) {
    const fields = issue.fields || {};
    const statusCategory = fields.status && fields.status.statusCategory && fields.status.statusCategory.key;
    const resolutionDate = fields.resolutiondate ? new Date(fields.resolutiondate) : null;
    if (statusCategory === 'done' && resolutionDate) {
      return resolutionDate <= sprintEnd;
    }
    if (statusCategory === 'done') return true;
    if (resolutionDate) return resolutionDate <= sprintEnd;
    return false;
  }

  function bucketForPoints(points) {
    if (points === null || points === undefined) return 'No estimate';
    if (points <= 1) return '1 or less';
    if (points <= 2) return '2';
    if (points <= 3) return '3';
    if (points <= 5) return '5';
    if (points <= 8) return '8';
    if (points <= 13) return '13';
    return '13+';
  }

  function renderStatusDurationTable(issues, sprintStart, sprintEnd) {
    const totals = new Map();
    const counts = new Map();

    issues.forEach(issue => {
      const durations = calculateStatusDurations(issue, sprintStart, sprintEnd);
      durations.forEach((ms, status) => {
        totals.set(status, (totals.get(status) || 0) + ms);
        counts.set(status, (counts.get(status) || 0) + 1);
      });
    });

    const rows = Array.from(totals.keys())
      .filter(status => String(status).toLowerCase() !== 'closed')
      .map(status => {
        const avg = totals.get(status) / (counts.get(status) || 1);
        return { status, avg, total: totals.get(status) };
      })
      .sort((a, b) => b.avg - a.avg);

    statusTable.innerHTML = '';
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.status}</td>
        <td>${formatDuration(row.avg)}</td>
        <td>${formatDuration(row.total)}</td>
      `;
      statusTable.appendChild(tr);
    });

    if (!rows.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="3">No status data found for this sprint.</td>';
      statusTable.appendChild(tr);
    }

    if (statusDurationChartEl) {
      if (statusChart) statusChart.destroy();
      statusChart = new Chart(statusDurationChartEl, {
        type: 'bar',
        data: {
          labels: rows.map(r => r.status),
          datasets: [{
            label: 'Average time (hours)',
            data: rows.map(r => (r.avg / (1000 * 60 * 60)).toFixed(1)),
            backgroundColor: '#6366f1'
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Hours' }
            }
          }
        }
      });
    }
  }

  function renderCompletionRates(issues, sprintStart, sprintEnd, defaultPoints = new Map()) {
    const buckets = new Map();
    issues.forEach(issue => {
      const pts = getStoryPoints(issue, sprintStart, defaultPoints.get(issue.key));
      const bucket = bucketForPoints(pts);
      if (!buckets.has(bucket)) buckets.set(bucket, { done: 0, total: 0 });
      const data = buckets.get(bucket);
      data.total += 1;
      if (isDone(issue, sprintEnd)) data.done += 1;
    });

    const rows = Array.from(buckets.entries())
      .map(([bucket, data]) => ({
        bucket,
        total: data.total,
        done: data.done,
        rate: data.total ? Math.round((data.done / data.total) * 100) : 0
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));

    completionTable.innerHTML = '';
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.bucket}</td>
        <td>${row.done}/${row.total}</td>
        <td>${row.rate}%</td>
      `;
      completionTable.appendChild(tr);
    });

    if (!rows.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="3">No completion data available.</td>';
      completionTable.appendChild(tr);
    }

    if (completionChartEl) {
      if (completionChart) completionChart.destroy();
      completionChart = new Chart(completionChartEl, {
        type: 'bar',
        data: {
          labels: rows.map(r => r.bucket),
          datasets: [{
            label: 'Completion rate (%)',
            data: rows.map(r => r.rate),
            backgroundColor: '#10b981'
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: 'Percent complete' }
            }
          }
        }
      });
    }
  }

  function renderIssueDetails(issues, sprintStart, sprintEnd, defaultPoints = new Map()) {
    const focusStatuses = focusStatusEl.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.toLowerCase());

    issueTableBody.innerHTML = '';
    const sorted = [...issues].sort((a, b) => (a.key || '').localeCompare(b.key || ''));

    sorted.forEach(issue => {
      const durations = calculateStatusDurations(issue, sprintStart, sprintEnd);
      let focusDuration = 0;
      if (focusStatuses.length) {
        durations.forEach((ms, status) => {
          if (focusStatuses.includes(String(status).toLowerCase())) {
            focusDuration += ms;
          }
        });
      }
      const totalStatusTime = Array.from(durations.values()).reduce((a, b) => a + b, 0);
      const summary = issue.fields && issue.fields.summary ? issue.fields.summary : '';
      const pts = getStoryPoints(issue, sprintStart, defaultPoints.get(issue.key));
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${issue.key}</td>
        <td>${summary}</td>
        <td>${pts === null ? '—' : pts}</td>
        <td>${formatDuration(totalStatusTime)}</td>
        <td>${focusStatuses.length ? formatDuration(focusDuration) : '—'}</td>
        <td>${isDone(issue, sprintEnd) ? 'Completed' : 'Open'}</td>
      `;
      issueTableBody.appendChild(tr);
    });

    if (!sorted.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="6">No issues found for this sprint.</td>';
      issueTableBody.appendChild(tr);
    }
  }

  function syncDomainInput(domain) {
    jiraDomain = domain || DEFAULT_JIRA_DOMAIN;
    if (domainInput) {
      domainInput.value = jiraDomain;
    }
  }

  function initJiraDomain() {
    const params = new URLSearchParams(window.location.search);
    const urlDomain = params.get('jiraDomain');
    const host = window.location.hostname || '';

    if (urlDomain) {
      syncDomainInput(urlDomain);
      return;
    }

    if (host.includes('atlassian.net')) {
      syncDomainInput(host);
      return;
    }

    syncDomainInput(DEFAULT_JIRA_DOMAIN);
  }

  function buildNetworkErrorMessage(err, actionLabel) {
    const origin = window.location.origin;
    const reason = err && err.message ? err.message : 'Request failed';
    const sameHost = origin.includes(jiraDomain);
    const corsHint = sameHost
      ? ''
      : ' This dashboard needs to be opened from your Jira domain or via a proxy that allows cross-origin requests.';
    return `${actionLabel} – ${reason}.${corsHint}`;
  }

  async function jiraSearch(jql, fields = [], options = {}) {
    const searchUrl = `https://${jiraDomain}/rest/api/3/search/jql`;
    const maxResults = options.maxResults || 500;
    let startAt = options.startAt || 0;
    const collected = [];
    const fieldList = Array.isArray(fields) ? fields.filter(Boolean) : (fields ? [fields] : []);
    const expandList = Array.isArray(options.expand)
      ? options.expand.filter(Boolean)
      : (options.expand ? [options.expand] : []);
    let useGet = true;

    const buildPayload = () => {
      const payload = { jql, startAt, maxResults };
      if (fieldList.length) payload.fields = fieldList;
      if (expandList.length) payload.expand = expandList;
      return payload;
    };

    while (true) {
      let resp;
      try {
        if (useGet) {
          const params = new URLSearchParams();
          params.set('jql', jql);
          params.set('startAt', String(startAt));
          params.set('maxResults', String(maxResults));
          if (fieldList.length) params.set('fields', fieldList.join(','));
          if (expandList.length) params.set('expand', expandList.join(','));
          const url = `${searchUrl}?${params.toString()}`;
          resp = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          });
        } else {
          resp = await fetch(searchUrl, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Atlassian-Token': 'no-check'
            },
            body: JSON.stringify(buildPayload())
          });
        }
      } catch (err) {
        if (useGet) {
          console.warn('Jira search GET failed, retrying with POST', err);
          useGet = false;
          continue;
        }
        throw new Error(buildNetworkErrorMessage(err, 'Unable to reach Jira search'));
      }

      if (useGet && [405, 413, 414].includes(resp.status)) {
        useGet = false;
        continue;
      }

      if (!resp.ok) {
        const text = await resp.text();
        const hint = [401, 403].includes(resp.status)
          ? ' Check that you are logged into Jira in this browser and that the page is served from the same domain.'
          : '';
        throw new Error(`Jira search failed (${resp.status}): ${text}${hint}`);
      }

      const data = await resp.json();
      const issues = Array.isArray(data.issues) ? data.issues : [];
      collected.push(...issues);

      const pageSize = data.maxResults || issues.length || maxResults;
      const total = typeof data.total === 'number' ? data.total : null;
      const nextStart = (data.startAt || 0) + pageSize;
      const receivedAll = !issues.length || (total !== null && collected.length >= total) || issues.length < pageSize;

      if (receivedAll) {
        return { issues: collected, total: total !== null ? total : collected.length };
      }

      if (nextStart <= startAt) {
        return { issues: collected, total: total !== null ? total : collected.length };
      }

      startAt = nextStart;
    }
  }

  async function populateBoards() {
    if (!boardSelect) return;
    const domain = (domainInput && domainInput.value.trim()) || jiraDomain;
    syncDomainInput(domain);
    boardSelect.innerHTML = '<option value="">Select a board…</option>';
    showLoading('Loading boards…');
    try {
      const boards = await Jira.fetchBoardsByJql(jiraDomain);
      boards.forEach(board => {
        const opt = document.createElement('option');
        opt.value = board.id;
        opt.textContent = board.name;
        boardSelect.appendChild(opt);
      });
      hideLoading();
    } catch (e) {
      console.error('Failed to load boards', e);
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Failed to load boards';
      boardSelect.appendChild(opt);
      loadingEl.textContent = buildNetworkErrorMessage(e, 'Unable to load boards');
      loadingEl.style.display = 'block';
    }
  }

  async function fetchSprints() {
    boardId = boardSelect.value.trim();
    if (!boardId) return alert('Select a board first.');
    showLoading('Fetching sprints…');
    let all = [];
    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const url = `https://${jiraDomain}/rest/agile/1.0/board/${boardId}/sprint?maxResults=${maxResults}&startAt=${startAt}`;
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) {
        hideLoading();
        const text = await resp.text();
        throw new Error(`Failed to fetch sprints: ${resp.status} ${text}`);
      }
      const data = await resp.json();
      const values = Array.isArray(data.values) ? data.values : [];
      all = all.concat(values);
      if (data.isLast || !values.length) break;
      startAt += values.length;
    }

    sprints = all;
    sprintSelect.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select a sprint…';
    sprintSelect.appendChild(defaultOpt);
    [...sprints].sort((a, b) => new Date(b.startDate || b.start || 0) - new Date(a.startDate || a.start || 0))
      .forEach(sp => {
        const opt = document.createElement('option');
        opt.value = sp.id;
        opt.textContent = sp.name;
        sprintSelect.appendChild(opt);
      });
    hideLoading();
  }

  function buildJql(sprintId) {
    const additional = document.getElementById('additionalJql').value.trim();
    let jql = `sprint = ${sprintId}`;
    if (additional) {
      jql += ` AND (${additional})`;
    }
    return jql;
  }

  function renderMeta(issues, sprint) {
    const total = issues.length;
    const done = issues.filter(i => isDone(i, new Date(sprint.endDate || sprint.end || sprint.completeDate || Date.now()))).length;
    metaSummary.textContent = `${total} issues found – ${done} completed`;
  }

  function collectIssuesFromSprintReport(reportData = {}) {
    const issues = [];
    const pushIssue = (item = {}) => {
      if (!item.key) return;
      issues.push({
        key: item.key,
        estimate: item.estimateStatistic?.statFieldValue?.value
      });
    };

    const contents = reportData.contents || {};
    (contents.completedIssues || []).forEach(pushIssue);
    (contents.issuesNotCompletedInCurrentSprint || []).forEach(pushIssue);
    (contents.puntedIssues || []).forEach(pushIssue);
    (contents.issueKeysRemovedFromSprint || []).forEach(key => pushIssue({ key }));

    const unique = new Map();
    issues.forEach(it => {
      if (!unique.has(it.key)) {
        unique.set(it.key, it);
      }
    });

    return Array.from(unique.values());
  }

  function filterSupportedIssueTypes(issues = []) {
    const allowed = ['story', 'task', 'bug'];
    return issues.filter(issue => {
      const type = issue.fields && issue.fields.issuetype;
      const name = type && typeof type.name === 'string' ? type.name.toLowerCase() : '';
      const isSubtask = Boolean(type && type.subtask);
      return allowed.includes(name) && !isSubtask;
    });
  }

  async function loadSprintInsights() {
    const sprintId = sprintSelect.value.trim();
    if (!sprintId) return alert('Select a sprint to analyze.');
    if (!boardId) return alert('Fetch and select a board first.');
    const sprint = await Jira.fetchSprint(jiraDomain, sprintId);
    const sprintStart = new Date(sprint.startDate || sprint.start || Date.now());
    const sprintEnd = new Date(sprint.endDate || sprint.end || Date.now());
    sprintEnd.setHours(23, 59, 59, 999);
    showLoading('Fetching sprint issues and changelogs…');

    const reportUrl = `https://${jiraDomain}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`;
    const reportResp = await fetch(reportUrl, { credentials: 'include' });
    if (!reportResp.ok) {
      hideLoading();
      const text = await reportResp.text();
      throw new Error(`Failed to fetch sprint report: ${reportResp.status} ${text}`);
    }

    const reportData = await reportResp.json();
    const reportIssues = collectIssuesFromSprintReport(reportData);
    const defaultPoints = new Map(reportIssues.map(it => [it.key, it.estimate]));
    let issueKeys = reportIssues.map(it => it.key);

    const additional = document.getElementById('additionalJql').value.trim();
    if (additional) {
      const { issues: filtered } = await jiraSearch(buildJql(sprintId), ['key'], { maxResults: 500 });
      const allowed = new Set(filtered.map(i => i.key));
      issueKeys = issueKeys.filter(k => allowed.has(k));
    }

    const issueMap = await Jira.fetchIssuesBatch(jiraDomain, issueKeys, { forceRefresh: true });
    const fetchedIssues = issueKeys
      .map(k => issueMap.get(k))
      .filter(Boolean);
    const filteredIssues = filterSupportedIssueTypes(fetchedIssues);

    renderMeta(filteredIssues, sprint);
    renderStatusDurationTable(filteredIssues, sprintStart, sprintEnd);
    renderCompletionRates(filteredIssues, sprintStart, sprintEnd, defaultPoints);
    renderIssueDetails(filteredIssues, sprintStart, sprintEnd, defaultPoints);
    hideLoading();
  }

  document.getElementById('fetchSprintsBtn').addEventListener('click', () => {
    fetchSprints().catch(err => {
      console.error(err);
      alert('Could not fetch sprints. See console for details.');
    });
  });

  document.getElementById('loadInsightsBtn').addEventListener('click', () => {
    loadSprintInsights().catch(err => {
      console.error(err);
      alert('Failed to load sprint insights. See console for details.');
      hideLoading();
    });
  });

  if (domainInput) {
    domainInput.addEventListener('change', () => {
      const domain = domainInput.value.trim() || DEFAULT_JIRA_DOMAIN;
      syncDomainInput(domain);
      populateBoards().catch(err => {
        console.error(err);
        alert('Could not refresh boards. See console for details.');
      });
    });
  }

  populateBoards();
})();
