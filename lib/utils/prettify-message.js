'use strict'

module.exports = prettifyMessage

const defaultColorizer = require('../colors')()
const {
  LEVELS,
  LEVEL_KEY,
  LEVEL_LABEL,
  MESSAGE_KEY
} = require('../constants')

const getPropertyValue = require('./get-property-value')
const interpretConditionals = require('./interpret-conditionals')

/**
 * Prettifies a message string if the given `log` has a message property.
 *
 * @param {object} input
 * @param {object} input.log The log object with the message to colorize.
 * @param {string} [input.messageKey='msg'] The property of the `log` that is the
 * message to be prettified.
 * @param {string|function} [input.messageFormat=undefined] A format string or function that defines how the
 *  logged message should be formatted, e.g. `'{level} - {pid}'`.
 * @param {function} [input.colorizer] A colorizer function that has a
 * `.message(str)` method attached to it. This function should return a colorized
 * string which will be the "prettified" message. Default: a no-op colorizer.
 * @param {string} [input.levelLabel='levelLabel'] The label used to output the log level
 * @param {string} [input.levelKey='level'] The key to find the level under.
 * @param {object} [input.customLevels] The custom levels where key as the level index and value as the level name.
 *
 * @returns {undefined|string} If the message key is not found, or the message
 * key is not a string, then `undefined` will be returned. Otherwise, a string
 * that is the prettified message.
 */
function prettifyMessage ({
  log,
  messageFormat,
  messageKey = MESSAGE_KEY,
  colorizer = defaultColorizer,
  levelLabel = LEVEL_LABEL,
  levelKey = LEVEL_KEY,
  customLevels, useOnlyCustomProps
}) {
  if (messageFormat && typeof messageFormat === 'string') {
    const parsedMessageFormat = interpretConditionals(messageFormat, log)

    const message = String(parsedMessageFormat).replace(
      /{([^{}]+)}/g,
      function (match, p1) {
        // return log level as string instead of int
        let level
        if (p1 === levelLabel && (level = getPropertyValue(log, levelKey)) !== undefined) {
          const condition = useOnlyCustomProps ? customLevels === undefined : customLevels[level] === undefined
          return condition ? LEVELS[level] : customLevels[level]
        }

        // Parse nested key access, e.g. `{keyA.subKeyB}`.
        return getPropertyValue(log, p1) || ''
      })
    return colorizer.message(message)
  }
  if (messageFormat && typeof messageFormat === 'function') {
    const msg = messageFormat(log, messageKey, levelLabel)
    return colorizer.message(msg)
  }
  if (messageKey in log === false) return undefined
  if (typeof log[messageKey] !== 'string' && typeof log[messageKey] !== 'number' && typeof log[messageKey] !== 'boolean') return undefined
  return colorizer.message(log[messageKey])
}
