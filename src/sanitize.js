(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Sanitize = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  const ESCAPE_RE = /[&<>"']/g;

  /**
   * Escapes HTML special characters to prevent XSS when inserting
   * untrusted text into the DOM via innerHTML.
   * @param {string} str - The raw string to escape.
   * @returns {string} The escaped string safe for HTML insertion.
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str.replace(ESCAPE_RE, ch => ESCAPE_MAP[ch]);
  }

  /**
   * Validates that a value looks like a legitimate Jira Cloud domain.
   * Accepts only `*.atlassian.net` hostnames to prevent open-redirect
   * or SSRF-style attacks when the domain is used to build API URLs.
   * @param {string} domain - The domain to validate.
   * @returns {boolean} True if the domain is a valid Atlassian Cloud hostname.
   */
  function isValidJiraDomain(domain) {
    if (typeof domain !== 'string') return false;
    return /^[a-z0-9-]+\.atlassian\.net$/i.test(domain.trim());
  }

  /**
   * Validates that a string looks like a Jira issue key (e.g. "PROJ-123").
   * Use this before interpolating keys into JQL queries to prevent injection.
   * @param {string} key - The issue key to validate.
   * @returns {boolean} True if the key matches the expected format.
   */
  function isValidIssueKey(key) {
    if (typeof key !== 'string') return false;
    return /^[A-Z][A-Z0-9_]+-\d+$/i.test(key.trim());
  }

  return { escapeHtml, isValidJiraDomain, isValidIssueKey };
}));
