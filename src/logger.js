(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Logger = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const levels = ['error', 'warn', 'info', 'debug'];
  let current = 'warn';

  if (typeof process !== 'undefined' && process.env.LOG_LEVEL) {
    current = process.env.LOG_LEVEL;
  } else if (typeof window !== 'undefined' && window.LOG_LEVEL) {
    current = window.LOG_LEVEL;
  }

  function shouldLog(level) {
    return levels.indexOf(level) <= levels.indexOf(current);
  }

  let listener = null;
  const logger = {};
  levels.forEach(l => {
    logger[l] = (...args) => {
      if (shouldLog(l)) {
        if (typeof console !== 'undefined') {
          const method = console[l] ? l : 'log';
          console[method]('[MCReport]', ...args);
        }
        if (typeof listener === 'function') {
          try { listener(l, args); } catch (e) {}
        }
      }
    };
  });

  logger.setLevel = lvl => { if (levels.includes(lvl)) current = lvl; };
  logger.getLevel = () => current;
  logger.setListener = fn => { listener = fn; };

  // Wrap global fetch to track total time across all requests.
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    const origFetch = globalThis.fetch;
    let firstStart = null;
    let pending = 0;

    globalThis.fetch = async (...args) => {
      if (firstStart === null) firstStart = Date.now();
      pending++;
      try {
        return await origFetch(...args);
      } finally {
        pending--;
        if (pending === 0 && firstStart !== null) {
          const total = Date.now() - firstStart;
          logger.info('All fetches completed in', total + 'ms');
          firstStart = null;
        }
      }
    };
  }

  return logger;
}));
