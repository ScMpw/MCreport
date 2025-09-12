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

    const results = [];
    const allowedProjects = new Set(['ANP', 'BF', 'NPSCO']);

    let startAt = 0;
    const maxResults = 50;
    while (true) {
      let page;
      try {
        page = await fetchWithCache(
          `boards:${jiraDomain}:${startAt}`,
          `https://${jiraDomain}/rest/agile/1.0/board?maxResults=${maxResults}&startAt=${startAt}`
        );
      } catch (e) {
        logger.warn('Failed to fetch board page', startAt, e);
        break;
      }

      const boards = page.values || [];
      for (const board of boards) {
        try {
          const pdata = await fetchWithCache(
            `board:${jiraDomain}:${board.id}:projects`,
            `https://${jiraDomain}/rest/agile/1.0/board/${board.id}/project`
          );
          const projects = pdata.values || [];
          const matches = projects.some(p => allowedProjects.has((p.key || '').toUpperCase()));
          if (matches) {
            results.push({ id: board.id, name: board.name });
          }
        } catch (e) {
          logger.warn('Failed to inspect board', board.id, e);
        }
      }

      if (page.isLast || boards.length === 0) break;
      startAt += boards.length;
    }

    logger.info('Boards matching filter:', results.map(r => `${r.name} (${r.id})`).join(', '));
    return results;
  }

  return { fetchBoardsByJql, fetchIssue, fetchSprint, clearCache };
}));
