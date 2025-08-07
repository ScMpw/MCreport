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

  const logger = {};
  levels.forEach(l => {
    logger[l] = (...args) => {
      if (shouldLog(l) && typeof console !== 'undefined') {
        const method = console[l] ? l : 'log';
        console[method]('[MCReport]', ...args);
      }
    };
  });

  logger.setLevel = lvl => { if (levels.includes(lvl)) current = lvl; };
  logger.getLevel = () => current;

  return logger;
}));
