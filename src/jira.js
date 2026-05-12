(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Jira = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const getGlobal = () => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof window !== 'undefined') return window;
    if (typeof self !== 'undefined') return self;
    return {};
  };
  const logger = (typeof require === 'function' && typeof module === 'object' && module.exports)
    ? require('./logger')
    : (getGlobal().Logger || { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} });

  const sanitize = (typeof require === 'function' && typeof module === 'object' && module.exports)
    ? require('./sanitize')
    : (getGlobal().Sanitize || { isValidJiraDomain: () => true, isValidIssueKey: () => true });

  /** Default cache time-to-live (5 minutes). */
  const CACHE_TTL = 5 * 60 * 1000;
  const cache = new Map();

  /**
   * Board IDs fetched when looking up boards. Only these boards are returned
   * by {@link fetchBoards}, preventing a broad scan of the Jira instance.
   */
  const DEFAULT_BOARD_IDS = [4629, 2526, 6346, 4133, 4132, 4131, 6347, 6390, 4894];

  /** Tracks in-flight requests so duplicate calls share the same Promise. */
  const pendingRequests = new Map();

  /** Maximum issues fetched in a single search request. */
  const BATCH_SIZE = 100;

  /** Pattern for valid Jira issue keys (e.g. "PROJ-123"). */
  const ISSUE_KEY_RE = /^[A-Z][A-Z0-9_]+-\d+$/i;

  /**
   * Deduplicates concurrent requests for the same resource. If a request
   * for `key` is already in flight, the existing Promise is returned.
   * @param {string} key - Unique identifier for the request.
   * @param {Function} fetchFn - Async function that performs the actual fetch.
   * @returns {Promise} The shared promise for this request.
   */
  async function fetchWithDedup(key, fetchFn) {
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    const p = fetchFn().finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, p);
    return p;
  }

  /**
   * Returns a cached value if it exists and has not expired.
   * Stale entries are removed lazily.
   * @param {string} key - Cache key.
   * @returns {*|null} The cached value, or null if missing/expired.
   */
  function getCached(key) {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      logger.debug('Cache hit for', key);
      return entry.value;
    }
    cache.delete(key);
    return null;
  }

  /**
   * Stores a value in the cache with the given TTL.
   * @param {string} key - Cache key.
   * @param {*} value - Value to cache.
   * @param {number} [ttl=CACHE_TTL] - Time-to-live in milliseconds.
   */
  function setCached(key, value, ttl = CACHE_TTL) {
    cache.set(key, { value, expiry: Date.now() + ttl });
  }

  /**
   * Clears a specific cache entry or the entire cache.
   * @param {string} [key] - If provided, only this entry is removed.
   */
  function clearCache(key) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }

  /**
   * Fetches a URL with caching and request deduplication.
   * @param {string} key - Cache key.
   * @param {string} url - URL to fetch.
   * @param {number} [ttl=CACHE_TTL] - Cache TTL in milliseconds.
   * @returns {Promise<Object>} Parsed JSON response.
   */
  async function fetchWithCache(key, url, ttl = CACHE_TTL) {
    const cached = getCached(key);
    if (cached) return cached;

    return fetchWithDedup(key, async () => {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) {
        throw new Error(`Failed to fetch ${url} ${resp.status}`);
      }
      const data = await resp.json();
      setCached(key, data, ttl);
      return data;
    });
  }

  /**
   * Fetches a single Jira issue by key or ID.
   * @param {string} jiraDomain - Jira Cloud domain (e.g. "example.atlassian.net").
   * @param {string} issueId - Issue key or numeric ID.
   * @param {Object} [opts]
   * @param {number} [opts.ttl=CACHE_TTL] - Cache TTL in milliseconds.
   * @param {boolean} [opts.forceRefresh=false] - Bypass the cache.
   * @returns {Promise<Object>} The issue JSON object.
   */
  async function fetchIssue(jiraDomain, issueId, { ttl = CACHE_TTL, forceRefresh = false } = {}) {
    const key = `issue:${jiraDomain}:${issueId}`;
    if (forceRefresh) clearCache(key);
    return fetchWithCache(key, `https://${jiraDomain}/rest/api/2/issue/${issueId}`, ttl);
  }

  /**
   * Fetches a single sprint by ID.
   * @param {string} jiraDomain - Jira Cloud domain.
   * @param {string|number} sprintId - Sprint ID.
   * @param {Object} [opts]
   * @param {number} [opts.ttl=CACHE_TTL] - Cache TTL in milliseconds.
   * @param {boolean} [opts.forceRefresh=false] - Bypass the cache.
   * @returns {Promise<Object>} The sprint JSON object.
   */
  async function fetchSprint(jiraDomain, sprintId, { ttl = CACHE_TTL, forceRefresh = false } = {}) {
    const key = `sprint:${jiraDomain}:${sprintId}`;
    if (forceRefresh) clearCache(key);
    return fetchWithCache(key, `https://${jiraDomain}/rest/agile/1.0/sprint/${sprintId}`, ttl);
  }

  /**
   * Fetches boards by iterating over a predefined list of board IDs.
   *
   * Despite its legacy alias `fetchBoardsByJql`, this function does **not**
   * use JQL — it fetches each board individually by ID.
   *
   * @param {string} jiraDomain - Jira Cloud domain.
   * @param {Object} [opts]
   * @param {number[]} [opts.boardIds=DEFAULT_BOARD_IDS] - Board IDs to fetch.
   * @returns {Promise<Array<{id: number, name: string}>>} Resolved boards.
   */
  async function fetchBoards(jiraDomain, { boardIds = DEFAULT_BOARD_IDS } = {}) {
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

  /**
   * Batch-fetches issues using POST search, with caching and deduplication.
   * Issue keys are validated before being interpolated into JQL.
   *
   * @param {string} jiraDomain - Jira Cloud domain.
   * @param {string[]} [issueKeys=[]] - Array of issue keys (e.g. ["PROJ-1", "PROJ-2"]).
   * @param {Object} [opts]
   * @param {number} [opts.ttl=CACHE_TTL] - Cache TTL in milliseconds.
   * @param {boolean} [opts.forceRefresh=false] - Bypass the cache.
   * @returns {Promise<Map<string, Object>>} Map of issue key → issue JSON.
   */
  async function fetchIssuesBatch(jiraDomain, issueKeys = [], { ttl = CACHE_TTL, forceRefresh = false } = {}) {
    const issueMap = new Map();
    const keysToFetch = [];

    for (const key of issueKeys) {
      if (!ISSUE_KEY_RE.test(key)) {
        logger.warn('Skipping invalid issue key:', key);
        continue;
      }
      const cacheKey = `issue:${jiraDomain}:${key}`;
      if (forceRefresh) clearCache(cacheKey);
      const cached = getCached(cacheKey);
      if (cached) {
        issueMap.set(key, cached);
      } else {
        keysToFetch.push(key);
      }
    }

    for (let i = 0; i < keysToFetch.length; i += BATCH_SIZE) {
      const batch = keysToFetch.slice(i, i + BATCH_SIZE);
      const jql = `key in (${batch.join(',')})`;
      const payload = {
        jql,
        maxResults: BATCH_SIZE,
        startAt: 0,
        fields: ['*all'],
        expand: ['changelog']
      };
      const data = await fetchWithDedup(`search:${jiraDomain}:${batch.join(',')}`, async () => {
        const searchUrl = `https://${jiraDomain}/rest/api/3/search`;
        const fieldList = payload.fields.filter(Boolean);
        const expandList = payload.expand.filter(Boolean);

        const buildBody = () => {
          const body = {
            jql: payload.jql,
            startAt: payload.startAt,
            maxResults: payload.maxResults
          };
          if (fieldList.length) body.fields = fieldList;
          if (expandList.length) body.expand = expandList;
          return JSON.stringify(body);
        };

        const resp = await fetch(searchUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Atlassian-Token': 'no-check'
          },
          body: buildBody()
        });

        if (!resp.ok) {
          let text = '';
          try {
            text = await resp.text();
          } catch (e) {
            logger.warn('Failed to read Jira search error response', e);
          }
          throw new Error(`Failed to fetch search results ${resp.status} ${text}`);
        }

        return resp.json();
      });
      (data.issues || []).forEach(issue => {
        const cacheKey = `issue:${jiraDomain}:${issue.key}`;
        setCached(cacheKey, issue, ttl);
        issueMap.set(issue.key, issue);
      });
    }

    return issueMap;
  }

  return {
    fetchBoards,
    fetchBoardsByJql: fetchBoards, // legacy alias for backward compatibility
    fetchIssue,
    fetchSprint,
    fetchIssuesBatch,
    clearCache
  };
}));
