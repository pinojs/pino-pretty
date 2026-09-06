'use strict'

module.exports = stripUnsafeControlChars

// These control characters are the exact values this utility must remove.
// eslint-disable-next-line no-control-regex
const unsafeControlChars = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g

/**
 * Removes control characters that can alter terminal output while preserving
 * tabs and interior newlines used for readable formatting. A trailing line
 * terminator is not preserved: the pretty printer appends its own end-of-line
 * sequence, so a trailing `\r\n` (e.g. from captured process stderr) would
 * otherwise render as an unwanted blank line (see issue #414).
 *
 * @param {*} input The value to sanitize.
 * @returns {string} The sanitized string.
 */
function stripUnsafeControlChars (input) {
  return String(input).replace(unsafeControlChars, '').replace(/[\r\n]+$/, '')
}
