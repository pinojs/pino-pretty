'use strict'

module.exports = prettifyTime

const {
  TIMESTAMP_KEY
} = require('../constants')

const formatTime = require('./format-time')

/**
 * @typedef {object} PrettifyTimeParams
 * @property {object} log The log object with the timestamp to be prettified.
 * @property {string} [timestampKey='time'] The log property that should be used
 * to resolve timestamp value.
 * @property {boolean|string} [translateFormat=undefined] When `true` the
 * timestamp will be prettified into a string at UTC using the default
 * `DATE_FORMAT`. If a string, then `translateFormat` will be used as the format
 * string to determine the output; see the `formatTime` function for details.
 * @property {CustomPrettifierFunc} [prettifier] A user-supplied formatter
 * for altering output.
 */

/**
 * Prettifies a timestamp if the given `log` has either `time`, `timestamp` or custom specified timestamp
 * property.
 *
 * @param {PrettifyTimeParams} input
 *
 * @returns {undefined|string} If a timestamp property cannot be found then
 * `undefined` is returned. Otherwise, the prettified time is returned as a
 * string.
 */
function prettifyTime ({
  log,
  timestampKey = TIMESTAMP_KEY,
  translateFormat = undefined,
  prettifier
}) {
  let time = null

  if (timestampKey in log) {
    time = log[timestampKey]
  } else if ('timestamp' in log) {
    time = log.timestamp
  }

  if (time === null) return undefined
  const output = translateFormat ? formatTime(time, translateFormat) : time

  return prettifier ? prettifier(output) : `[${output}]`
}
