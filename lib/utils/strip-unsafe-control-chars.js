'use strict'

module.exports = stripUnsafeControlChars

// These control characters are the exact values this utility must remove.
// eslint-disable-next-line no-control-regex
const unsafeControlChars = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g

/**
 * Removes control characters that can alter terminal output while preserving
 * tabs and newlines used for readable formatting.
 *
 * @param {*} input The value to sanitize.
 * @returns {string} The sanitized string.
 */
function stripUnsafeControlChars (input) {
  return String(input).replace(unsafeControlChars, '')
}
