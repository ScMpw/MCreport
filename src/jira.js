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

  // Board IDs that should be fetched when looking up boards. Only these
  // boards will be returned by `fetchBoardsByJql` which prevents hitting the
  // Jira API for every board in the instance.
  const DEFAULT_BOARD_IDS = [2796, 2526, 6346, 4133, 4132, 4131, 6347, 6390, 4894];


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

  async function fetchBoardsByJql(jiraDomain, { boardIds = DEFAULT_BOARD_IDS } = {}) {
    logger.info('Fetching boards for domain', jiraDomain);

    const results = [];
    for (const id of boardIds) {
      try {
        const board = await fetchWithCache(
          `board:${jiraDomain}:${id}`,
          `https://${jiraDomain}/rest/agile/1.0/board/${id}`
        );
        results.push({ id: board.id, name: board.name });
      } catch (e) {
        logger.warn('Failed to fetch board', id, e);
      }
    }

    logger.info('Boards fetched:', results.map(r => `${r.name} (${r.id})`).join(', '));
    return results;
  }

  return { fetchBoardsByJql, fetchIssue, fetchSprint, clearCache };
}));
