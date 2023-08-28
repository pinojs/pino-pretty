'use strict'

module.exports = prettifyMetadata

/**
 * Prettifies metadata that is usually present in a Pino log line. It looks for
 * fields `name`, `pid`, `hostname`, and `caller` and returns a formatted string using
 * the fields it finds.
 *
 * @param {object} input
 * @param {object} input.log The log that may or may not contain metadata to
 * be prettified.
 * @param {object} input.prettifiers A set of functions used to prettify each
 * key of the input log's metadata. The keys are the keys of the metadata (like
 * `hostname`, `pid`, `name`, etc), and the values are functions which take the
 * metadata value and return a string. Each key is optional.
 *
 * @returns {undefined|string} If no metadata is found then `undefined` is
 * returned. Otherwise, a string of prettified metadata is returned.
 */
function prettifyMetadata ({ log, prettifiers = {} }) {
  let line = ''

  if (log.name || log.pid || log.hostname) {
    line += '('

    if (log.name) {
      line += prettifiers.name ? prettifiers.name(log.name) : log.name
    }

    if (log.pid) {
      const prettyPid = prettifiers.pid ? prettifiers.pid(log.pid) : log.pid
      if (log.name && log.pid) {
        line += '/' + prettyPid
      } else {
        line += prettyPid
      }
    }

    if (log.hostname) {
      // If `pid` and `name` were in the ignore keys list then we don't need
      // the leading space.
      line += `${line === '(' ? 'on' : ' on'} ${prettifiers.hostname ? prettifiers.hostname(log.hostname) : log.hostname}`
    }

    line += ')'
  }

  if (log.caller) {
    line += `${line === '' ? '' : ' '}<${prettifiers.caller ? prettifiers.caller(log.caller) : log.caller}>`
  }

  if (line === '') {
    return undefined
  } else {
    return line
  }
}
