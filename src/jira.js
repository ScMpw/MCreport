(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Jira = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const getGlobal = () => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof window !== 'undefined') return window;
    if (typeof self !== 'undefined') return self;
    return {};
  };
  const logger = (typeof require === 'function' && typeof module === 'object' && module.exports)
    ? require('./logger')
    : (getGlobal().Logger || { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} });

  // Simple in-memory cache for Jira resources. Entries are keyed by
  // a string such as `issue:123` or `sprint:456`. Each record stores the
  // fetched value and an expiry timestamp so we can evict stale data.
  const CACHE_TTL = 5 * 60 * 1000; // five minutes
  const cache = new Map();

  function getCached(key) {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      logger.debug('Cache hit for', key);
      return entry.value;
    }
    // Remove stale entries to keep the cache small.
    cache.delete(key);
    return null;
    }

  function setCached(key, value, ttl = CACHE_TTL) {
    cache.set(key, { value, expiry: Date.now() + ttl });
  }

  function clearCache(key) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }

  async function fetchWithCache(key, url, ttl = CACHE_TTL) {
    const cached = getCached(key);
    if (cached) return cached;

    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) {
      throw new Error(`Failed to fetch ${url} ${resp.status}`);
    }
    const data = await resp.json();
    setCached(key, data, ttl);
    return data;
  }

  // Convenience helpers for common Jira lookups
  async function fetchIssue(jiraDomain, issueId, { ttl = CACHE_TTL, forceRefresh = false } = {}) {

    const key = `issue:${jiraDomain}:${issueId}`;

    if (forceRefresh) clearCache(key);
    return fetchWithCache(key, `https://${jiraDomain}/rest/api/2/issue/${issueId}`, ttl);
  }

  async function fetchSprint(jiraDomain, sprintId, { ttl = CACHE_TTL, forceRefresh = false } = {}) {

    const key = `sprint:${jiraDomain}:${sprintId}`;

    if (forceRefresh) clearCache(key);
    return fetchWithCache(key, `https://${jiraDomain}/rest/agile/1.0/sprint/${sprintId}`, ttl);
  }

  async function fetchBoardsByJql(jiraDomain) {
    logger.info('Fetching boards for domain', jiraDomain);

    // Restrict the search to a predefined set of board IDs to avoid
    // enumerating every board in the instance, which can be slow.
    const boardIds = [2796, 2526, 6346, 4133, 4132, 4131, 6347, 6390, 4894];
    const target = 'PROJECT IN (ANP, BF, NPSCO)';

    const results = [];
    for (const id of boardIds) {
      try {
        // Fetch the board itself first. Some IDs may no longer exist or be
        // inaccessible to the current user. Those cases return a 404 which we
        // quietly skip to avoid noisy warnings in the log output.
        const board = await fetchWithCache(
          `board:${jiraDomain}:${id}`,
          `https://${jiraDomain}/rest/agile/1.0/board/${id}`
        );

        // Team-managed boards (type 'simple') do not have a filter endpoint.
        // Skip these entirely so the browser does not log 404 warnings.
        if (board.type && String(board.type).toLowerCase() === 'simple') {
          logger.debug('Skipping team-managed board', id);
          continue;
        }

        // Fetch the board's underlying filter to check the JQL. Classic boards
        // always expose this endpoint; if it returns a 404 for other reasons,
        // treat that as a signal to skip the board quietly.
        let filterData;
        try {
          filterData = await fetchWithCache(
            `board:${jiraDomain}:${id}:filter`,
            `https://${jiraDomain}/rest/agile/1.0/board/${id}/filter`
          );
        } catch (e) {
          if (String(e).includes('404')) {
            logger.debug('Skipping board without filter', id);
            continue;
          }
          throw e;
        }

        const jql = (filterData && filterData.jql ? filterData.jql.toUpperCase() : '');
        if (jql.includes(target)) {
          results.push({ id: board.id, name: board.name });
        }
      } catch (e) {
        if (String(e).includes('404')) {
          // Board itself is missing or inaccessible – ignore.
          logger.debug('Skipping missing board', id);
        } else {
          logger.warn('Failed to inspect board', id, e);
        }
      }
    }

    logger.info('Boards matching filter:', results.map(r => `${r.name} (${r.id})`).join(', '));
    return results;
  }

  return { fetchBoardsByJql, fetchIssue, fetchSprint, clearCache };
}));
