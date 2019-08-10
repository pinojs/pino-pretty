const stringifySafe = require('fast-safe-stringify')

const LogProcessor = require('../LogProcessor')
const { internals: { joinLinesWithIndentation } } = require('../utils')
const {
  ERROR_LIKE_KEYS,
  LOGGER_KEYS
} = require('../constants')

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

function appendObject (lineParts, context) {
  const { log, EOL, IDENT, errorLikeObjectKeys, messageKey, skipObjectKeys, objectWasHandled } = context
  if (!objectWasHandled) {
    const skipKeys = []
    if (typeof log[messageKey] === 'string') {
      skipKeys.push(messageKey)
    }
    if (skipObjectKeys) {
      skipKeys.push(...skipObjectKeys)
    }
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

class ObjectLogProcessor extends LogProcessor {
  build (lineParts, context) {
    return appendObject(lineParts, context)
  }
}

module.exports = {
  prettifyObject,
  ObjectLogProcessor
}
