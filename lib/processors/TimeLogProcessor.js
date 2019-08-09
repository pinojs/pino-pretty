const LogProcessor = require('../LogProcessor')

const { internals: { formatTime } } = require('../utils')

const {
  TIMESTAMP_KEY
} = require('../constants')

/**
 * Prettifies a timestamp if the given `input` object has either `time`, `timestamp` or custom specified timestamp
 * property.
 *
 * @param {object} input The log object with the timestamp to be prettified.
 * @param {object} context The context object.
 * @param {string} [context.timestampKey='time'] The log property that should be used to resolve timestamp value
 * @param {bool|string} [context.translateFormat=undefined] When `true` the
 * timestamp will be prettified into a string at UTC using the default
 * `DATE_FORMAT`. If a string, then `translateFormat` will be used as the format
 * string to determine the output; see the `formatTime` function for details.
 *
 * @returns {undefined|string} If a timestamp property cannot be found then
 * `undefined` is returned. Otherwise, the prettified time is returned as a
 * string.
 */
function prettifyTime (input, { prettified, timestampKey = TIMESTAMP_KEY, translateFormat = undefined } = {}) {
  if (timestampKey in input === false && 'timestamp' in input === false) return undefined
  if (translateFormat) {
    const formatted = '[' + formatTime(input[timestampKey] || input.timestamp, translateFormat) + ']'
    prettified.prettifiedTime = formatted
    return undefined
  }
  const formatted = `[${input[timestampKey] || input.timestamp}]`
  prettified.prettifiedTime = formatted
  return undefined
}

function appendTime (lineParts, { prettified }) {
  const { prettifiedTime } = prettified
  if (prettifiedTime) {
    if (lineParts.length > 0) {
      lineParts.push(' ')
    }
    lineParts.push(prettifiedTime)
  }
}

class TimeLogProcessor extends LogProcessor {
  parse (input, context) {
    return prettifyTime(input, context)
  }

  build (lineParts, context) {
    return appendTime(lineParts, context)
  }
}

module.exports = {
  prettifyTime,
  TimeLogProcessor
}
