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

    // Restrict the search to a predefined set of boards to avoid
    // querying every board in the instance which previously resulted in
    // numerous 404 errors. Additional board IDs can be added to this
    // list as needed.
    const boardIds = [2796, 2526, 6346];
    const results = [];
    const target = 'PROJECT IN (ANP, BF, NPSCO)';

    for (const id of boardIds) {
      try {
        const bResp = await fetch(`https://${jiraDomain}/rest/agile/1.0/board/${id}`, { credentials: 'include' });
        if (!bResp.ok) {
          logger.warn('Failed to fetch board', id, bResp.status);
          continue;
        }
        const board = await bResp.json();

        const fResp = await fetch(`https://${jiraDomain}/rest/agile/1.0/board/${id}/filter`, { credentials: 'include' });
        if (!fResp.ok) continue;
        const fd = await fResp.json();
        const jql = (fd && fd.jql ? fd.jql.toUpperCase() : '');
        if (jql.includes(target)) {
          results.push({ id, name: board.name });
        }
      } catch (e) {
        logger.warn('Failed to inspect board', id, e);
      }
    }

    logger.info('Boards matching filter:', results.map(r => `${r.name} (${r.id})`).join(', '));
    return results;
  }

  return { fetchBoardsByJql };
}));
