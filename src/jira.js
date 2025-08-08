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

  async function fetchBoardsByJql(jiraDomain) {
    logger.info('Fetching boards for domain', jiraDomain);
    const allBoards = [];
    let startAt = 0;
    const maxResults = 50;
    try {
      while (true) {
        const url = `https://${jiraDomain}/rest/agile/1.0/board?maxResults=${maxResults}&startAt=${startAt}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (!resp.ok) {
          logger.error('Failed to fetch boards list', resp.status);
          break;
        }
        const data = await resp.json();
        if (Array.isArray(data.values) && data.values.length) {
          allBoards.push(...data.values);
          if (data.isLast) break;
          startAt += data.values.length;
        } else {
          break;
        }
      }
    } catch (e) {
      logger.error('Board list fetch error', e);
      return [];
    }

    const results = [];
    const target = 'PROJECT IN (ANP, BF, NPSCO)';
    for (const b of allBoards) {
      try {
        const fResp = await fetch(`https://${jiraDomain}/rest/agile/1.0/board/${b.id}/filter`, { credentials: 'include' });
        if (!fResp.ok) continue;
        const fd = await fResp.json();
        const jql = (fd && fd.jql ? fd.jql.toUpperCase() : '');
        if (jql.includes(target)) {
          results.push({ id: b.id, name: b.name });
        }
      } catch (e) {
        logger.warn('Failed to inspect board', b.id, e);
      }
    }
    logger.info('Boards matching filter:', results.map(r => `${r.name} (${r.id})`).join(', '));
    return results;
  }

  return { fetchBoardsByJql };
}));
