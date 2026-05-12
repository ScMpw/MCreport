const assert = require('assert');
const Jira = require('../src/jira');

(async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    // The updated jira.js uses POST for batch search — extract keys from the body
    let keys;
    if (opts && opts.body) {
      const body = JSON.parse(opts.body);
      const match = body.jql.match(/key in \(([^)]+)\)/);
      keys = match ? match[1].split(',') : [];
    } else {
      const jql = decodeURIComponent(url.split('jql=')[1].split('&')[0]);
      keys = jql.match(/\((.*)\)/)[1].split(',');
    }
    return {
      ok: true,
      json: async () => ({ issues: keys.map(k => ({ key: k.trim() })) })
    };
  };

  Jira.clearCache();
  const keys = ['ISSUE-1', 'ISSUE-2', 'ISSUE-3'];
  const res1 = await Jira.fetchIssuesBatch('example.atlassian.net', keys);
  assert.strictEqual(res1.size, 3);
  assert.strictEqual(calls.length, 1);

  const res2 = await Jira.fetchIssuesBatch('example.atlassian.net', keys);
  assert.strictEqual(res2.size, 3);
  assert.strictEqual(calls.length, 1);

  global.fetch = originalFetch;
  console.log('fetchIssuesBatch tests passed');
})();
