'use strict'

const dateformat = require('dateformat')
const stringifySafe = require('fast-safe-stringify')
const defaultColorizer = require('./colors')()
const {
  DATE_FORMAT,
  ERROR_LIKE_KEYS,
  MESSAGE_KEY,
  LOGGER_KEYS
} = require('./constants')

module.exports = {
  isObject,
  prettifyErrorLog,
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyObject,
  prettifyTime
}

module.exports.internals = {
  formatTime,
  joinLinesWithIndentation
}

/**
 * Converts a given `epoch` to a desired display format.
 *
 * @param {number|string} epoch The time to convert. May be any value that is
 * valid for `new Date()`.
 * @param {bool|string} [translateTime=false] When `false`, the given `epoch`
 * will simply be returned. When `true`, the given `epoch` will be converted
 * to a string at UTC using the `DATE_FORMAT` constant. If `translateTime` is
 * a string, the following rules are available:
 *
 * - `<format string>`: The string is a literal format string. This format
 * string will be used to interpret the `epoch` and return a display string
 * at UTC.
 * - `SYS:STANDARD`: The returned display string will follow the `DATE_FORMAT`
 * constant at the system's local timezone.
 * - `SYS:<format string>`: The returned display string will follow the given
 * `<format string>` at the system's local timezone.
 * - `UTC:<format string>`: The returned display string will follow the given
 * `<format string>` at UTC.
 *
 * @returns {number|string} The formatted time.
 */
function formatTime (epoch, translateTime = false) {
  if (translateTime === false) {
    return epoch
  }

  const instant = new Date(epoch)
  if (translateTime === true) {
    return dateformat(instant, 'UTC:' + DATE_FORMAT)
  }

  const upperFormat = translateTime.toUpperCase()
  if (upperFormat === 'SYS:STANDARD') {
    return dateformat(instant, DATE_FORMAT)
  }

  const prefix = upperFormat.substr(0, 4)
  if (prefix === 'SYS:' || prefix === 'UTC:') {
    if (prefix === 'UTC:') {
      return dateformat(instant, translateTime)
    }
    return dateformat(instant, translateTime.slice(4))
  }

  return dateformat(instant, `UTC:${translateTime}`)
}

function isObject (input) {
  return Object.prototype.toString.apply(input) === '[object Object]'
}

/**
 * Given a string with line separators, either `\r\n` or `\n`, add indentation
 * to all lines subsequent to the first line and rejoin the lines using an
 * end of line sequence.
 *
 * @param {object} input
 * @param {string} input.input The string to split and reformat.
 * @param {string} [input.ident] The indentation string. Default: `    ` (4 spaces).
 * @param {string} [input.eol] The end of line sequence to use when rejoining
 * the lines. Default: `'\n'`.
 *
 * @returns {string} A string with lines subsequent to the first indented
 * with the given indentation sequence.
 */
function joinLinesWithIndentation ({ input, ident = '    ', eol = '\n' }) {
  const lines = input.split(/\r?\n/)
  for (var i = 1; i < lines.length; i += 1) {
    lines[i] = ident + lines[i]
  }
  return lines.join(eol)
}

function prettifyErrorLog ({
  log,
  messageKey = MESSAGE_KEY,
  ident = '    ',
  eol = '\n',
  errorLikeKeys = ERROR_LIKE_KEYS,
  errorProperties = []
}) {
  const stack = log.stack
  const joinedLines = joinLinesWithIndentation({ input: stack, ident, eol })
  let result = `${ident}${joinedLines}${eol}`

  if (errorProperties.length > 0) {
    const excludeProperties = LOGGER_KEYS.concat(messageKey, 'type', 'stack')
    let propertiesToPrint
    if (errorProperties[0] === '*') {
      // Print all sibling properties except for the standard exclusions.
      propertiesToPrint = Object.keys(log).filter(k => excludeProperties.includes(k) === false)
    } else {
      // Print only sepcified properties unless the property is a standard exclusion.
      propertiesToPrint = errorProperties.filter(k => excludeProperties.includes(k) === false)
    }

    for (var i = 0; i < propertiesToPrint.length; i += 1) {
      const key = propertiesToPrint[i]
      if (key in log === false) continue
      if (isObject(log[key])) {
        // The nested object may have "logger" type keys but since they are not
        // at the root level of the object being processed, we want to print them.
        // Thus, we invoke with `excludeLoggerKeys: false`.
        const prettifiedObject = prettifyObject({ input: log[key], errorLikeKeys, excludeLoggerKeys: false, eol, ident })
        result = `${result}${key}: {${eol}${prettifiedObject}}${eol}`
        continue
      }
      result = `${result}${key}: ${log[key]}${eol}`
    }
  }

  return result
}

/**
 * Checks if the passed in log has a `level` value and returns a prettified
 * string for that level if so.
 *
 * @param {object} input
 * @param {object} input.log The log object which should have a `level` property.
 * @param {function} [input.colorizer] A colorizer function that accepts a level
 * value and returns a colorized string. Default: a no-op colorizer.
 *
 * @returns {undefined|string} If `log` does not have a `level` property then
 * `undefined` will be returned. Otherwise, a string from the specified
 * `colorizer` is returned.
 */
function prettifyLevel ({ log, colorizer = defaultColorizer }) {
  if ('level' in log === false) return undefined
  return colorizer(log.level)
}

/**
 * Prettifies a message string if the given `log` has a message property.
 *
 * @param {object} input
 * @param {object} input.log The log object with the message to colorize.
 * @param {string} [input.messageKey='msg'] The property of the `log` that is the
 * message to be prettified.
 * @param {function} [input.colorizer] A colorizer function that has a
 * `.message(str)` method attached to it. This function should return a colorized
 * string which will be the "prettified" message. Default: a no-op colorizer.
 *
 * @returns {undefined|string} If the message key is not found, or the message
 * key is not a string, then `undefined` will be returned. Otherwise, a string
 * that is the prettified message.
 */
function prettifyMessage ({ log, messageKey = MESSAGE_KEY, colorizer = defaultColorizer }) {
  if (messageKey in log === false) return undefined
  if (typeof log[messageKey] !== 'string') return undefined
  return colorizer.message(log[messageKey])
}

/**
 * Prettifies metadata that is usually present in a Pino log line. It looks for
 * fields `name`, `pid`, and `hostname` and returns a formatted string using
 * the fields it finds.
 *
 * @param {object} input
 * @param {object} input.log The log that may or may not contain metadata to
 * be prettified.
 *
 * @returns {undefined|string} If no metadata is found then `undefined` is
 * returned. Otherwise, a string of prettified metadata is returned.
 */
function prettifyMetadata ({ log }) {
  if (log.name || log.pid || log.hostname) {
    let line = '('

    if (log.name) {
      line += log.name
    }

    if (log.name && log.pid) {
      line += '/' + log.pid
    } else if (log.pid) {
      line += log.pid
    }

    if (log.hostname) {
      // If `pid` and `name` were in the ignore keys list then we don't need
      // the leading space.
      line += `${line === '(' ? 'on' : ' on'} ${log.hostname}`
    }

    line += ')'
    return line
  }
  return undefined
}

function prettifyObject ({ input, ident = '    ', eol = '\n', skipKeys = [], errorLikeKeys = ERROR_LIKE_KEYS, excludeLoggerKeys = true }) {
  const objectKeys = Object.keys(input)
  const keysToIgnore = [].concat(skipKeys)

  if (excludeLoggerKeys === true) Array.prototype.push.apply(keysToIgnore, LOGGER_KEYS)

  let result = ''

  const keysToIterate = objectKeys.filter(k => keysToIgnore.includes(k) === false)
  for (var i = 0; i < objectKeys.length; i += 1) {
    const keyName = keysToIterate[i]
    const keyValue = input[keyName]

    if (keyValue === undefined) continue

    const lines = stringifySafe(input[keyName], null, 2)
    if (lines === undefined) continue
    const joinedLines = joinLinesWithIndentation({ input: lines, ident, eol })

    if (errorLikeKeys.includes(keyName) === true) {
      const splitLines = `${ident}${keyName}: ${joinedLines}${eol}`.split(eol)
      for (var j = 0; j < splitLines.length; j += 1) {
        if (j !== 0) result += eol

        const line = splitLines[j]
        if (/^\s*"stack"/.test(line)) {
          const matches = /^(\s*"stack":)\s*(".*"),?$/.exec(line)
          if (matches && matches.length === 3) {
            const indentSize = /^\s*/.exec(line)[0].length + 4
            const indentation = ' '.repeat(indentSize)
            const stackMessage = matches[2]
            result += matches[1] + eol + indentation + JSON.parse(stackMessage).replace(/\n/g, eol + indentation)
          }
        } else {
          result += line
        }
      }
    } else {
      result += `${ident}${keyName}: ${joinedLines}${eol}`
    }
  }

  return result
}

/**
 * Prettifies a timestamp if the given `log` has either `time` or `timestamp`
 * properties.
 *
 * @param {object} input
 * @param {object} input.log The log object with the timestamp to be prettified.
 * @param {bool|string} [input.translateFormat=undefined] When `true` the
 * timestamp will be prettified into a string at UTC using the default
 * `DATE_FORMAT`. If a string, then `translateFormat` will be used as the format
 * string to determine the output; see the `formatTime` function for details.
 *
 * @returns {undefined|string} If a timestamp property cannot be found then
 * `undefined` is returned. Otherwise, the prettified time is returned as a
 * string.
 */
function prettifyTime ({ log, translateFormat = undefined }) {
  if ('time' in log === false && 'timestamp' in log === false) return undefined
  if (translateFormat) {
    return '[' + formatTime(log.time || log.timestamp, translateFormat) + ']'
  }
  return `[${log.time || log.timestamp}]`
}
