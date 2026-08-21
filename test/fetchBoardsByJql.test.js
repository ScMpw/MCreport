const assert = require('assert');
const Jira = require('../src/jira');

(async () => {
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    calls.push(url);
    const id = Number(url.match(/board\/(\d+)/)[1]);
    return {
      ok: true,
      json: async () => ({ id, name: `Board${id}` })
    };
  };

  const boards = await Jira.fetchBoardsByJql('example.atlassian.net', { boardIds: [1, 2, 3] });

  assert.strictEqual(boards.length, 3);
  assert.deepStrictEqual(boards.map(b => b.id), [1, 2, 3]);
  assert.deepStrictEqual(boards.map(b => b.name), ['Board1', 'Board2', 'Board3']);
  assert.strictEqual(calls.length, 3);

  global.fetch = originalFetch;
  console.log('fetchBoardsByJql tests passed');

  const defaultCalls = [];
  const defaultOriginalFetch = global.fetch;
  global.fetch = async (url) => {
    defaultCalls.push(url);
    const id = Number(url.match(/board\/(\d+)/)[1]);
    return {
      ok: true,
      json: async () => ({ id, name: `Board${id}` })
    };
  };

  const defaultBoards = await Jira.fetchBoardsByJql('default.example.atlassian.net');
  const boardIds = defaultBoards.map(board => board.id);

  assert.deepStrictEqual(boardIds.slice(-5), [34476, 34475, 34474, 34477, 34478]);
  assert.strictEqual(defaultCalls.length, 14);

  global.fetch = defaultOriginalFetch;
  console.log('default board configuration tests passed');
})();
