const assert = require('assert');
const Jira = require('../src/jira');

(async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    calls.push(url);
    const jql = decodeURIComponent(url.split('jql=')[1].split('&')[0]);
    const keys = jql.match(/\((.*)\)/)[1].split(',');
    return {
      ok: true,
      json: async () => ({ issues: keys.map(k => ({ key: k })) })
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
