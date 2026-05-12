(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Logger = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const levels = ['error', 'warn', 'info', 'debug'];
  let current = 'warn';

  if (typeof process !== 'undefined' && process.env && process.env.LOG_LEVEL) {
    current = process.env.LOG_LEVEL;
  } else if (typeof window !== 'undefined' && window.LOG_LEVEL) {
    current = window.LOG_LEVEL;
  }

  /**
   * Returns true if the given level should be logged at the current threshold.
   * @param {string} level - One of 'error', 'warn', 'info', 'debug'.
   * @returns {boolean}
   */
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
          try {
            listener(l, args);
          } catch (listenerErr) {
            if (typeof console !== 'undefined') {
              console.error('[MCReport] Logger listener threw:', listenerErr);
            }
          }
        }
      }
    };
  });

  /** @param {string} lvl - New log level ('error' | 'warn' | 'info' | 'debug'). */
  logger.setLevel = lvl => { if (levels.includes(lvl)) current = lvl; };
  /** @returns {string} The current log level. */
  logger.getLevel = () => current;
  /** @param {Function|null} fn - Callback invoked with (level, args) on each log. */
  logger.setListener = fn => { listener = fn; };

  // --- Global fetch instrumentation ---
  // Wraps globalThis.fetch to measure total elapsed time across concurrent
  // requests. This is a side-effect of importing the logger module.
  // Set `globalThis.MC_REPORT_SKIP_FETCH_WRAP = true` before loading this
  // module to disable the instrumentation (e.g. in unit tests).
  const shouldWrapFetch = typeof globalThis !== 'undefined'
    && typeof globalThis.fetch === 'function'
    && !globalThis.MC_REPORT_SKIP_FETCH_WRAP;

  if (shouldWrapFetch) {
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
