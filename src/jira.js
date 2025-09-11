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
    const key = `issue:${issueId}`;
    if (forceRefresh) clearCache(key);
    return fetchWithCache(key, `https://${jiraDomain}/rest/api/2/issue/${issueId}`, ttl);
  }

  async function fetchSprint(jiraDomain, sprintId, { ttl = CACHE_TTL, forceRefresh = false } = {}) {
    const key = `sprint:${sprintId}`;
    if (forceRefresh) clearCache(key);
    return fetchWithCache(key, `https://${jiraDomain}/rest/agile/1.0/sprint/${sprintId}`, ttl);
  }

  async function fetchBoardsByJql(jiraDomain) {
    logger.info('Fetching boards for domain', jiraDomain);

    // Restrict the search to a predefined set of boards to avoid
    // querying every board in the instance which previously resulted in
    // numerous 404 errors. Additional board IDs can be added to this
    // list as needed.
    const boardIds = [2796, 2526, 6346, 4133, 4132, 4131, 6347, 6390, 4894];
    const results = [];

    // Accept boards whose project keys match any of these values.
    const allowedProjects = new Set(['ANP', 'BF', 'NPSCO']);

    for (const id of boardIds) {
      try {
        const board = await fetchWithCache(
          `board:${id}`,
          `https://${jiraDomain}/rest/agile/1.0/board/${id}`
        );

        // Query projects associated with this board instead of the board's filter.
        const pdata = await fetchWithCache(
          `board:${id}:projects`,
          `https://${jiraDomain}/rest/agile/1.0/board/${id}/project`
        );
        const projects = pdata.values || [];
        const matches = projects.some(p => allowedProjects.has((p.key || '').toUpperCase()));
        if (matches) {
          results.push({ id, name: board.name });
        }
      } catch (e) {
        logger.warn('Failed to inspect board', id, e);
      }
    }

    logger.info('Boards matching filter:', results.map(r => `${r.name} (${r.id})`).join(', '));
    return results;
  }

  return { fetchBoardsByJql, fetchIssue, fetchSprint, clearCache };
}));
