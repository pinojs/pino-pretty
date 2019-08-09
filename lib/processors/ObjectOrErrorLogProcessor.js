const stringifySafe = require('fast-safe-stringify')

const LogProcessor = require('../LogProcessor')
const { isObject, internals: { joinLinesWithIndentation } } = require('../utils')
const {
  ERROR_LIKE_KEYS,
  MESSAGE_KEY,
  LOGGER_KEYS
} = require('../constants')

/**
 * Given a log object that has a `type: 'Error'` key, prettify the object and
 * return the result. In other
 *
 * @param {object} input
 * @param {object} input.log The error log to prettify.
 * @param {string} [input.messageKey] The name of the key that contains a
 * general log message. This is not the error's message property but the logger
 * messsage property. Default: `MESSAGE_KEY` constant.
 * @param {string} [input.ident] The sequence to use for indentation. Default: `'    '`.
 * @param {string} [input.eol] The sequence to use for EOL. Default: `'\n'`.
 * @param {string[]} [input.errorLikeKeys] A set of keys that should be considered
 * to have error objects as values. Default: `ERROR_LIKE_KEYS` constant.
 * @param {string[]} [input.errorProperties] A set of specific error object
 * properties, that are not the value of `messageKey`, `type`, or `stack`, to
 * include in the prettified result. The first entry in the list may be `'*'`
 * to indicate that all sibiling properties should be prettified. Default: `[]`.
 *
 * @returns {string} A sring that represents the prettified error log.
 */
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
 * Prettifies a standard object. Special care is taken when processing the object
 * to handle child objects that are attached to keys known to contain error
 * objects.
 *
 * @param {object} input
 * @param {object} input.input The object to prettify.
 * @param {string} [input.ident] The identation sequence to use. Default: `'    '`.
 * @param {string} [input.eol] The EOL sequence to use. Default: `'\n'`.
 * @param {string[]} [input.skipKeys] A set of object keys to exclude from the
 * prettified result. Default: `[]`.
 * @param {string[]} [input.errorLikeKeys] A set of object keys that contain
 * error objects. Default: `ERROR_LIKE_KEYS` constant.
 * @param {boolean} [input.excludeLoggerKeys] Indicates if known logger specific
 * keys should be excluded from prettification. Default: `true`.
 *
 * @returns {string} The prettified string. This can be as little as `''` if
 * there was nothing to prettify.
 */
function prettifyObject ({
  input,
  ident = '    ',
  eol = '\n',
  skipKeys = [],
  errorLikeKeys = ERROR_LIKE_KEYS,
  excludeLoggerKeys = true
}) {
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

function appendObjectOrError (lineParts, { log, EOL, IDENT, errorLikeObjectKeys, errorProps, messageKey }) {
  const errorProperties = errorProps.split(',')

  if (log.type === 'Error' && log.stack) {
    const prettifiedErrorLog = prettifyErrorLog({
      log,
      errorLikeKeys: errorLikeObjectKeys,
      errorProperties,
      ident: IDENT,
      eol: EOL
    })
    lineParts.push(prettifiedErrorLog)
  } else {
    const skipKeys = typeof log[messageKey] === 'string' ? [messageKey] : undefined
    const prettifiedObject = prettifyObject({
      input: log,
      skipKeys,
      errorLikeKeys: errorLikeObjectKeys,
      eol: EOL,
      ident: IDENT
    })
    lineParts.push(prettifiedObject)
  }
}

class ObjectOrErrorLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendObjectOrError(lineParts, context)
  }
}

module.exports = {
  prettifyErrorLog,
  prettifyObject,
  ObjectOrErrorLogProcessor
}
