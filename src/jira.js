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
    const boardIds = [2796, 2526, 6346, 4133, 4132, 4131, 6347, 6390, 4894];
    const results = [];

    // Accept boards whose project keys match any of these values.
    const allowedProjects = new Set(['ANP', 'BF', 'NPSCO']);

    for (const id of boardIds) {
      try {
        const bResp = await fetch(`https://${jiraDomain}/rest/agile/1.0/board/${id}`, { credentials: 'include' });
        if (!bResp.ok) {
          logger.warn('Failed to fetch board', id, bResp.status);
          continue;
        }
        const board = await bResp.json();

        // Query projects associated with this board instead of the board's filter.
        const pResp = await fetch(`https://${jiraDomain}/rest/agile/1.0/board/${id}/project`, { credentials: 'include' });
        if (!pResp.ok) {
          logger.warn('Failed to fetch board projects', id, pResp.status);
          continue;
        }
        const pdata = await pResp.json();
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

  return { fetchBoardsByJql };
}));
